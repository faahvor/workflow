import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoMdSearch } from "react-icons/io";
import {
  MdFilterList,
  MdExpandMore,
  MdDirectionsBoat,
  MdPendingActions,
} from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { HiClock } from "react-icons/hi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const QueriedRequest = ({
  searchQuery = "",
  filterType = "all",
  onUnreadChange = () => {},
  onOpenDetail = () => {},
}) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localFilter, setLocalFilter] = useState(filterType);
  const [vessels, setVessels] = useState([]);

  const [commentsByRequest, setCommentsByRequest] = useState({});
  const { getToken, user } = useAuth();

  const filtered = (requests || []).filter((req) => {
    const matchesSearch =
      (req.requestId || "")
        .toString()
        .toLowerCase()
        .includes(localSearch.toLowerCase()) ||
      (req.requester?.displayName || "")
        .toString()
        .toLowerCase()
        .includes(localSearch.toLowerCase()) ||
      (req.department || "")
        .toString()
        .toLowerCase()
        .includes(localSearch.toLowerCase());

    const matchesFilter =
      localFilter === "all" ||
      (req.requestType || "").toString().toLowerCase() ===
        localFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const sortedRequests = [
    // High priority requests first
    ...filtered.filter((r) => r.priority === "high"),
    // Then all others, sorted by requestId descending
    ...filtered
      .filter((r) => r.priority !== "high")
      .sort((a, b) => {
        // If requestId is numeric, sort numerically
        const numA = Number(String(a.requestId).replace(/\D/g, ""));
        const numB = Number(String(b.requestId).replace(/\D/g, ""));
        return numB - numA;
      }),
  ];

  // Use sortedRequests for pagination
  const total = sortedRequests.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paged = sortedRequests.slice((page - 1) * pageSize, page * pageSize);

  const fetchCommentsForRequest = async (requestId) => {
    try {
      const token = getToken();
      const resp = await axios.get(
        `${API_BASE_URL}/requests/${encodeURIComponent(requestId)}/comments`,
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );
      const data = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
        ? resp.data
        : [];
      console.log("Fetched comments for", requestId, data); // <-- ADD THIS
      setCommentsByRequest((prev) => ({ ...prev, [requestId]: data }));
      const request = requests.find((r) => r.requestId === requestId);
      if (
        request &&
        !request.isUnread &&
        hasQueriedRoleCommented(request, data)
      ) {
        setRequests((prev) =>
          prev.map((r) =>
            r.requestId === requestId ? { ...r, isUnread: true } : r
          )
        );
        if (typeof onUnreadChange === "function") onUnreadChange(1);
      }
    } catch {
      setCommentsByRequest((prev) => ({ ...prev, [requestId]: [] }));
    }
  };

  useEffect(() => {
    paged.forEach((req) => {
      if (req.requestId && !commentsByRequest[req.requestId]) {
        fetchCommentsForRequest(req.requestId);
      }
    });
    // eslint-disable-next-line
  }, [paged]);

  function hasQueriedRoleCommented(request, comments) {
    const queriedRole = (request.queriedRole || "")
      .toLowerCase()
      .replace(/\s/g, "");
    if (!queriedRole) return true; // If no queriedRole, don't block

    // Recursive function to check all comments and their replies
    function checkComments(commentsArr) {
      return (commentsArr || []).some((c) => {
        const role = (c.userId && c.userId.role) || c.role || "";
        const match = role.toLowerCase().replace(/\s/g, "") === queriedRole;
        if (match) return true;
        // Recursively check replies
        if (Array.isArray(c.replies) && c.replies.length > 0) {
          return checkComments(c.replies);
        }
        return false;
      });
    }

    const found = checkComments(comments);
    if (!found) {
      console.log(
        "No comment found for queriedRole:",
        queriedRole,
        "in comments (recursive):",
        comments
      );
    }
    return found;
  }

  const fetchVessels = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      setVessels(response.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching vessels:", err);
    }
  };

  useEffect(() => {
    fetchVessels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId;
  };

  useEffect(() => setLocalSearch(searchQuery), [searchQuery]);
  useEffect(() => setLocalFilter(filterType), [filterType]);

  const fetchQueried = async (p = 1) => {
    try {
      setLoading(true);
      const token = getToken();
      const resp = await axios.get(
        `${API_BASE_URL}/requests/queried?page=${p}&limit=${pageSize}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        }
      );
      const data = resp.data?.data || resp.data || [];
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching queried requests:", err);
      setError(
        err?.response?.data?.message || "Failed to fetch queried requests"
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueried(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    paged.forEach((req) => {
      if (req.requestId && !commentsByRequest[req.requestId]) {
        fetchCommentsForRequest(req.requestId);
      }
    });
    // eslint-disable-next-line
  }, [paged]);

  const handleViewDetailsClick = async (request) => {
    if (request.isUnread) {
      try {
        const token = getToken();
        await axios.post(
          `${API_BASE_URL}/requests/${request.requestId}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRequests((prev) =>
          prev.map((r) =>
            r.requestId === request.requestId ? { ...r, isUnread: false } : r
          )
        );
        if (typeof onUnreadChange === "function") onUnreadChange(); // fetch from server
      } catch (err) {}
    }
    onOpenDetail(request);
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading queried requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-700">{error}</div>
      ) : (
        <>
          <div className="space-y-4">
            {paged.map((request) => {
              const comments = commentsByRequest[request.requestId];
              // If comments are not yet loaded, treat as blocked
              const isBlocked =
                request.isQueried &&
                request.queriedRole &&
                (!comments || !hasQueriedRoleCommented(request, comments));
              const isUnreadForUser =
                Array.isArray(request.unreadByUsers) &&
                user &&
                request.unreadByUsers.includes(user.userId);

              return (
                <div
                  key={request.requestId || request.id}
                  className={`relative bg-white/90 backdrop-blur-xl border-2 rounded-2xl p-4 md:p-6 shadow-lg transition-all duration-200 ${
                    isBlocked ? "bg-gray-400 opacity-70" : ""
                  } ${
                    isUnreadForUser
                      ? "border-emerald-400 ring-2 ring-emerald-200"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  style={isBlocked ? { pointerEvents: "none" } : {}}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-slate-500 text-xs font-mono font-semibold">
                          {request.requestId || request.id}
                        </span>
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 text-slate-700">
                          Queried
                        </span>
                        {request.offshoreReqNumber && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                            <MdDirectionsBoat className="text-sm" />
                            <span>{request.offshoreReqNumber}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-slate-600 text-sm mb-3">
                        Requested by{" "}
                        <span className="text-slate-900 font-semibold">
                          {request.requester?.displayName || "N/A"}
                        </span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm">
                        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                          <span className="text-slate-900 font-semibold text-xs md:text-sm">
                            {request.department}
                          </span>
                          <span className="text-emerald-500">→</span>
                          <span className="text-slate-900 font-semibold text-xs md:text-sm">
                            {request.destination}
                          </span>
                        </div>

                        {request.vesselId && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MdDirectionsBoat className="text-base" />
                            <span className="text-xs md:text-sm font-medium">
                              {getVesselName(request.vesselId)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-slate-600">
                          <HiClock className="text-base" />
                          <span className="text-xs md:text-sm font-medium">
                            {new Date(request.createdAt).toLocaleDateString()}{" "}
                            {new Date(request.createdAt).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (isBlocked) {
                            console.log(
                              "Blocked! Should not open details for",
                              request.requestId
                            );
                            return;
                          }
                          handleViewDetailsClick(request);
                        }}
                        className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#036173] to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                        disabled={isBlocked}
                        title={
                          isBlocked
                            ? `Waiting for response from ${request.queriedRole}`
                            : ""
                        }
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QueriedRequest;
