import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { IoMdSearch } from "react-icons/io";
import {
  MdFilterList,
  MdExpandMore,
  MdDirectionsBoat,
  MdArrowForward,
  MdPendingActions,
  MdCancel,
  MdLocalShipping,
  MdInventory,
  MdHelpOutline,
  MdShoppingCart,
  MdAttachMoney,
} from "react-icons/md";
import { FaHouseFloodWaterCircleArrowRight } from "react-icons/fa6";
import { HiClock } from "react-icons/hi";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const RequesterPending = ({
  searchQuery = "",
  filterType = "all",
  onOpenDetail = () => {},
  onUnreadChange,
  setPendingUnreadCount,
}) => {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localFilter, setLocalFilter] = useState(filterType);
  const [vessels, setVessels] = useState([]);

  const fetchVessels = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const getInStockColor = () => {
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getInStockIcon = () => {
    return <MdInventory className="text-sm" />;
  };
  const getQueriedColor = () => {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  const getQueriedIcon = () => {
    return <MdHelpOutline className="text-sm" />;
  };

  const getClearingColor = () => {
    return "bg-purple-100 text-blue-700 border-purple-200";
  };

  const getClearingIcon = () => {
    return <FaHouseFloodWaterCircleArrowRight className="text-sm" />;
  };
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalFilter(filterType);
  }, [filterType]);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      const resp = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(resp.data.data || []);
      setError(null);
      setPage(1);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      setError(
        err.response?.data?.message || "Failed to fetch pending requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const filtered = (requests || []).filter((req) => {
    const q = (localSearch || "").toLowerCase().trim();
    const matchesSearch =
      !q ||
      (req.requestId || "").toLowerCase().includes(q) ||
      (req.requester?.displayName || "").toLowerCase().includes(q) ||
      (req.department || "").toLowerCase().includes(q);
    const matchesFilter =
      localFilter === "all" ||
      (req.requestType || "").toLowerCase() === localFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const sortedRequests = [
    ...filtered.filter((r) => r.priority === "high"),
    ...filtered
      .filter((r) => r.priority !== "high")
      .sort((a, b) => {
        // If requestId is numeric, sort numerically
        const numA = Number(String(a.requestId).replace(/\D/g, ""));
        const numB = Number(String(b.requestId).replace(/\D/g, ""));
        return numB - numA;
      }),
  ];

  const total = sortedRequests.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paged = sortedRequests.slice((page - 1) * pageSize, page * pageSize);

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
        // Immediately fetch the latest unread count from backend for sidebar
        if (typeof onUnreadChange === "function") {
          onUnreadChange();
        }
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
    onOpenDetail(request);
  };
  // Get CSS color classes for request type
  const getTypeColor = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "pettyCash":
        return "bg-teal-100 text-teal-600 border-teal-200";
      case "inStock":
        return "bg-blue-100 text-blue-600 border-blue-200"; // <-- Add this line
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
      case "inStock":
        return <MdInventory className="text-sm" />; // <-- Add this line
      default:
        return null;
    }
  };

  // Get label for request type
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

  const isServiceRequest = (request) => request?.isService === true;

  function hasProcurementOfficerApproved(request) {
    return (
      Array.isArray(request.history) &&
      (request.history.some(
        (h) =>
          h.action === "APPROVE" &&
          h.role === "Procurement Officer" &&
          h.info === "Procurement Officer Approved"
      ) ||
        request.history.some(
          (h) =>
            h.action === "SPLIT" &&
            h.role === "SYSTEM" &&
            typeof h.info === "string" &&
            h.info.includes("Petty Cash items moved to Petty Cash flow")
        ))
    );
  }

  return (
    <div>
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by request ID, requester, or department..."
              className="w-full h-12 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-700">{error}</div>
      ) : (
        <>
          <div className="space-y-4">
            {paged.map((request) => (
              <div
                key={request.requestId || request.id}
                className={`bg-white/90 backdrop-blur-xl border-2 rounded-2xl p-4 md:p-6 shadow-lg transition-all duration-200 cursor-pointer group
    ${
      request.isUnread
        ? "border-emerald-400 ring-2 ring-emerald-200"
        : "border-slate-200 hover:border-slate-300"
    }
  `}
                onClick={() => onOpenDetail(request)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-slate-500 text-xs font-mono font-semibold">
                        {request.requestId || request.id}
                      </span>

                      {request.isRejected && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-600 border-2 border-red-200">
                          <MdCancel className="text-sm" />
                          <span>Rejected</span>
                        </span>
                      )}
                      {request.isQueried && (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getQueriedColor()}`}
                        >
                          {getQueriedIcon()}
                          <span>Queried</span>
                        </span>
                      )}
                      {(request.tag?.includes?.("Shipping") ||
                        request.tag === "Shipping") && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200">
                          <MdLocalShipping className="text-sm" />
                          <span>Shipping</span>
                        </span>
                      )}
                      {(request.tag?.includes?.("Clearing") ||
                        request.tag === "Clearing") && (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getClearingColor()}`}
                        >
                          {getClearingIcon()}
                          <span>Clearing</span>
                        </span>
                      )}

                      {request.isService === true && (
                        <span
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 ml-1"
                          style={{ marginLeft: 4 }}
                        >
                          <MdHelpOutline className="text-sm" />
                          <span>Services</span>
                        </span>
                      )}
                      {request.requestType === "inStock" ||
                      hasProcurementOfficerApproved(request) ? (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${getTypeColor(
                            request.requestType
                          )}`}
                        >
                          {getTypeIcon(request.requestType)}
                          <span>{getTypeLabel(request.requestType)}</span>
                        </span>
                      ) : null}
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
                            {getVesselName(request.vesselId)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetailsClick(request); // <-- use the new handler
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl transition-all duration-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
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

export default RequesterPending;
