import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdDirectionsBoat,
  MdArrowForward,
  MdLocalShipping,
  MdInventory,
  MdPriorityHigh,
  MdHelpOutline,
} from "react-icons/md";
import { FaHouseFloodWaterCircleArrowRight } from "react-icons/fa6";
import { HiClock } from "react-icons/hi";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Approved = ({
  searchQuery = "",
  filterType = "all",
  onOpenDetail = () => {},
}) => {
  const { user, getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);

  const normalizedSearch = (searchQuery || "").trim().toLowerCase();
  const normalizedFilter = (filterType || "all").trim().toLowerCase();
  const [approvedFlowMap, setApprovedFlowMap] = useState({});

  useEffect(() => {
    fetchVessels();
  }, []);

  useEffect(() => {
    fetchApprovedRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // Fetch flow for each request and store result in approvedFlowMap
    const fetchAllFlows = async () => {
      const token = getToken();
      const map = {};
      await Promise.all(
        (requests || []).map(async (request) => {
          try {
            const resp = await axios.get(
              `${API_BASE_URL}/requests/${request.requestId}/flow`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const flow = resp.data.data || [];
            const procStep = flow.find(
              (step) => step.state === "PENDING_PROCUREMENT_OFFICER_APPROVAL"
            );
            map[request.requestId] = procStep?.status === "completed";
          } catch {
            map[request.requestId] = false;
          }
        })
      );
      setApprovedFlowMap(map);
    };

    if (requests.length > 0) fetchAllFlows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  const fetchVessels = async () => {
    try {
      const token = getToken();
      const resp = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVessels(resp.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching vessels:", err);
    }
  };

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const url = `${API_BASE_URL}/requests/approved?page=${page}&limit=${limit}`;
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(resp.data.data || []);
      setPages(resp.data.pages || 1);
    } catch (err) {
      console.error("❌ Error fetching approved requests:", err);
      setRequests([]);
      setPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getVesselName = (vesselId) => {
    const v = vessels.find((x) => x.vesselId === vesselId);
    return v?.name || vesselId;
  };

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

  const isServiceRequest = (request) =>
  request?.isService === true;

    const getClearingColor = () => {
    return "bg-purple-100 text-blue-700 border-purple-200";
  };

  const getClearingIcon = () => {
    return <FaHouseFloodWaterCircleArrowRight className="text-sm" />;
  };

 // ...existing code...

const filteredRequests = (requests || []).filter((req) => {
  const matchesSearch =
    req.requestId?.toLowerCase().includes(normalizedSearch) ||
    req.offshoreReqNumber?.toLowerCase().includes(normalizedSearch) ||
    req.jobNumber?.toLowerCase().includes(normalizedSearch) ||
    req.requester?.displayName?.toLowerCase().includes(normalizedSearch) ||
    req.department?.toLowerCase().includes(normalizedSearch);

  const reqType = (req.requestType || "").toLowerCase();
  const matchesFilter =
    normalizedFilter === "all" ||
    reqType === normalizedFilter ||
    (normalizedFilter === "pettycash" && reqType.includes("petty")) ||
    (normalizedFilter === "purchaseorder" && reqType.includes("purchase"));

  return matchesSearch && matchesFilter;
});

const sortedRequests = [...requests].sort((a, b) => {
  // High priority always comes first
  if (a.priority === "high" && b.priority !== "high") return -1;
  if (a.priority !== "high" && b.priority === "high") return 1;
  // If same priority, sort by requestId descending
  const numA = Number(String(a.requestId).replace(/\D/g, ""));
  const numB = Number(String(b.requestId).replace(/\D/g, ""));
  return numB - numA;
});

  const handleViewDetails = (request) => {
    if (typeof onOpenDetail === "function") onOpenDetail(request);
  };
  function hasProcurementOfficerApproved(request) {
    return (
      Array.isArray(request.history) &&
      request.history.some(
        (h) =>
          h.action === "APPROVE" &&
          h.role === "Procurement Officer" &&
          h.info === "Procurement Officer Approved"
      )
    );
  }

  return (
    <div >
      {loading && <p>Loading approved requests...</p>}
      {!loading && filteredRequests.length === 0 && (
        <p>No approved requests found.</p>
      )}

      {!loading && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {sortedRequests.map((request) => (
            <div
              key={request.requestId}
              className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-slate-500 text-xs font-mono font-semibold">
                      {request.requestId}
                    </span>
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
                    {request.offshoreReqNumber && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <MdDirectionsBoat className="text-sm" />
                        <span>{request.offshoreReqNumber}</span>
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
                    {hasProcurementOfficerApproved(request) && (
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(
                          request.requestType
                        )}`}
                      >
                        {getTypeIcon(request.requestType)}
                        <span>{getTypeLabel(request.requestType)}</span>
                      </span>
                    )}
                      {request.priority === "high" && (
                                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-600 border-2 border-red-200 animate-pulse">
                                        <MdPriorityHigh className="text-sm" />
                                        <span>URGENT</span>
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
    {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
  </span>
</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleViewDetails(request)}
                    className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {!loading && pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 bg-white border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="px-4 py-2 bg-white border rounded">
            Page {page} / {pages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-2 bg-white border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Approved;
