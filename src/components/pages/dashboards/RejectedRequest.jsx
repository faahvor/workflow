import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  MdCancel,
  MdArrowForward,
  MdDirectionsBoat,
  MdShoppingCart,
  MdAttachMoney,
  MdHelpOutline,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RejectedRequest = ({
  searchQuery = "",
  filterType = "all",
  onOpenDetail = () => {},
  setRejectedUnreadCount = () => {},
  onUnreadChange,
}) => {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [commentsByRequest, setCommentsByRequest] = useState({});

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.requestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.offshoreReqNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      req.jobNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester?.displayName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      req.requestType?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const sortedRequests = [
    // High priority requests first
    ...filteredRequests.filter((r) => r.priority === "high"),
    // Then all others, sorted by requestId descending
    ...filteredRequests
      .filter((r) => r.priority !== "high")
      .sort((a, b) => {
        // If requestId is numeric, sort numerically
        const numA = Number(String(a.requestId).replace(/\D/g, ""));
        const numB = Number(String(b.requestId).replace(/\D/g, ""));
        return numB - numA;
      }),
  ];

  // Fetch comments for a request
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
      setCommentsByRequest((prev) => ({ ...prev, [requestId]: data }));

      // Check if a new comment has arrived and mark as unread
      const request = requests.find((r) => r.requestId === requestId);
      if (request && !request.isUnread && hasNewComment(request, data)) {
        setRequests((prev) =>
          prev.map((r) =>
            r.requestId === requestId ? { ...r, isUnread: true } : r
          )
        );
        if (typeof onUnreadChange === "function") onUnreadChange(1);
        setRejectedUnreadCount((prev) => prev + 1);
      }
    } catch {
      setCommentsByRequest((prev) => ({ ...prev, [requestId]: [] }));
    }
  };

  // Helper to check if a new comment has arrived for the user
  function hasNewComment(request, comments) {
    // You can customize this logic to match your app's requirements
    // For example, check if any comment is newer than last read time, or from a specific role
    // Here, we'll just check if there are any comments at all
    return Array.isArray(comments) && comments.length > 0;
  }

  // Fetch comments for each request in the filtered list
  useEffect(() => {
    filteredRequests.forEach((req) => {
      if (req.requestId && !commentsByRequest[req.requestId]) {
        fetchCommentsForRequest(req.requestId);
      }
    });
    // eslint-disable-next-line
  }, [filteredRequests]);

  // Fetch rejected requests
  const fetchRejectedRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const resp = await axios.get(`${API_BASE_URL}/requests/rejected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(resp.data?.data || []);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch rejected requests"
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedRequests();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setRejectedUnreadCount(requests.filter((r) => r.isUnread).length);
    if (typeof onUnreadChange === "function")
      onUnreadChange(requests.filter((r) => r.isUnread).length);
  }, [requests, onUnreadChange, setRejectedUnreadCount]);

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
        if (typeof onUnreadChange === "function") onUnreadChange(-1);

        setRejectedUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {}
    }
    onOpenDetail(request);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rejected requests...</p>
        </div>
      </div>
    );
  }

  if (filteredRequests.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-12 text-center shadow-lg">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MdCancel className="text-4xl text-red-400" />
        </div>
        <p className="text-slate-700 text-lg font-semibold">
          No rejected requests found
        </p>
        <p className="text-slate-500 text-sm mt-2">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  // Helper functions for tag/type icons/colors (reuse from PendingRequestList if needed)
  const getTagColor = (tag) => {
    if (!tag) return "bg-slate-100 text-slate-600 border-slate-200";
    switch (String(tag).toLowerCase()) {
      case "shipping":
        return "bg-teal-100 text-teal-600 border-teal-200";
      default:
        return "bg-purple-100 text-blue-700 border-purple-200";
    }
  };

  const getTagIcon = (tag) => {
    if (!tag) return null;
    switch (String(tag).toLowerCase()) {
      case "shipping":
        return <MdDirectionsBoat className="text-sm" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "pettyCash":
        return "bg-teal-100 text-teal-600 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "purchaseOrder":
        return <MdShoppingCart className="text-sm" />;
      case "pettyCash":
        return <MdAttachMoney className="text-sm" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "Purchase Order";
      case "pettyCash":
        return "Petty Cash";
      case "inStock":
        return "INSTOCK";
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {sortedRequests.map((request) => (
        <div
          key={request.requestId}
          className={`bg-white/90 backdrop-blur-xl border-2 rounded-2xl p-4 md:p-6 shadow-lg transition-all duration-200 cursor-pointer group ${
            request.isUnread
              ? "border-emerald-400 ring-2 ring-emerald-200"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-slate-500 text-xs font-mono font-semibold">
                  {request.requestId}
                </span>
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border bg-red-100 text-red-700 border-red-200">
                  <MdCancel className="text-sm" />
                  <span>Rejected</span>
                </span>
                {/* Tag badge */}
                {request.tag && (
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTagColor(
                      request.tag
                    )}`}
                  >
                    {getTagIcon(request.tag)}
                    <span>
                      {String(request.tag).replace(/(^\w|\s\w)/g, (m) =>
                        m.toUpperCase()
                      )}
                    </span>
                  </span>
                )}
                {request.items &&
                  request.items.some((it) => it && it.inStock) && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-green-100 text-green-700 border-green-200">
                      <MdShoppingCart className="text-sm" />
                      <span>In Stock</span>
                    </span>
                  )}
                {/* <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${getTypeColor(
                    request.requestType
                  )}`}
                >
                  {getTypeIcon(request.requestType)}
                  <span>{getTypeLabel(request.requestType)}</span>
                </span> */}
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
                  <MdArrowForward className="text-emerald-500" />
                  <span className="text-slate-900 font-semibold text-xs md:text-sm">
                    {request.destination}
                  </span>
                </div>
                {request.vesselId && (
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MdDirectionsBoat className="text-base" />
                    <span className="text-xs md:text-sm font-medium">
                      {request.vesselId}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-600">
                  <HiClock className="text-base" />
                  <span className="text-xs md:text-sm font-medium">
                    {new Date(request.createdAt).toLocaleDateString()}{" "}
                    {new Date(request.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleViewDetailsClick(request)}
                className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-red-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RejectedRequest;
