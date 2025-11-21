import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { hasDoubleApproval } from "../../utils/roles";
import { IoMdSearch } from "react-icons/io";
import {
  MdArrowForward,
  MdPriorityHigh,
  MdDirectionsBoat,
  MdFilterList,
  MdExpandMore,
  MdPendingActions,
  MdShoppingCart,
  MdAttachMoney,
  MdCheckCircle,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";
import Sidebar from "../../shared/layout/Sidebar";
import RequestDetailView from "./RequestDetailView";
import CompletedRequests from "./CompletedRequests";
import Approved from "./Approved"; // <-- added import

// ManagerDashboard component
const ManagerDashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("overview");
  const [view, setView] = useState("list");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [vessels, setVessels] = useState([]);
  const [detailReadOnly, setDetailReadOnly] = useState(false);
  const [completedRequests, setCompletedRequests] = useState([]);

  // Replace request helper
  const replaceRequestIn = (setter) => (updatedReq) =>
    setter((prev = []) =>
      prev.map((r) => (r?.requestId === updatedReq?.requestId ? updatedReq : r))
    );

  const replaceInPending = replaceRequestIn(setPendingRequests);
  const replaceInCompleted = replaceRequestIn(setCompletedRequests);

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  // Handle detail back navigation and list updates
  const handleDetailBack = (updatedRequest) => {
    setView("list");
    setSelectedRequest(null);
    if (typeof setDetailReadOnly === "function") setDetailReadOnly(false);

    if (updatedRequest && updatedRequest.requestId) {
      replaceInPending(updatedRequest);
      replaceInCompleted(updatedRequest);

      if (typeof setRequests === "function") {
        setRequests((prev = []) =>
          prev.map((r) =>
            r?.requestId === updatedRequest.requestId ? updatedRequest : r
          )
        );
      }
    } else {
      if (typeof fetchPendingRequests === "function") fetchPendingRequests();
      if (typeof fetchCompletedRequests === "function")
        fetchCompletedRequests();
      if (typeof fetchAllRequests === "function") fetchAllRequests();
    }
  };

  // Open request detail and fetch flow
  const handleOpenDetail = async (request) => {
    const flow = await fetchRequestFlow(request.requestId);
    setSelectedRequest({ ...request, flow });
    // set readOnly for both completed and approved views
    setDetailReadOnly(activeView === "completed" || activeView === "approved");
    setView("detail");
  };

  // Fetch pending requests
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPendingRequests(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching pending requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch request flow/details by ID
  const fetchRequestFlow = async (requestId) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/requests/${requestId}/flow`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (err) {
      console.error("❌ Error fetching request flow:", err);
      return null;
    }
  };

  // Fetch vessels list
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

  // Approve a request
  const handleApprove = async (requestId) => {
    if (!window.confirm("Are you sure you want to approve this request?")) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Request approved successfully!");

      setView("list");
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (err) {
      console.error("❌ Error approving request:", err);
      alert(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject a request
  const handleReject = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this request?")) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Request rejected successfully!");

      setView("list");
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  // Query a request (send back to requester)
  const handleQuery = async (requestId) => {
    if (
      !window.confirm(
        "Are you sure you want to query this request? It will be sent back to the requester."
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/query`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Request queried and sent back to requester!");

      setView("list");
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (err) {
      console.error("❌ Error querying request:", err);
      alert(err.response?.data?.message || "Failed to query request");
    } finally {
      setActionLoading(false);
    }
  };

  // View request details (opens detail view)
  const handleViewDetails = async (request) => {
    const flow = await fetchRequestFlow(request.requestId);
    setSelectedRequest({ ...request, flow });
    // set readOnly for both completed and approved views
    setDetailReadOnly(activeView === "completed" || activeView === "approved");
    setView("detail");
  };

  // Get CSS color classes for request type
  const getTypeColor = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "quotation":
        return "bg-teal-100 text-teal-600 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Get icon component for request type
  const getTypeIcon = (type) => {
    switch (type) {
      case "purchaseOrder":
        return <MdShoppingCart className="text-sm" />;
      case "quotation":
        return <MdAttachMoney className="text-sm" />;
      default:
        return null;
    }
  };

  // Get human-readable label for request type
  const getTypeLabel = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "Purchase Order";
      case "quotation":
        return "Quotation";
      default:
        return type;
    }
  };

  // Get vessel name from vesselId
  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId;
  };

  const filteredRequests = pendingRequests.filter((req) => {
    const matchesSearch =
      req.requestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester?.displayName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      req.requestType?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // Load pending requests on mount
  useEffect(() => {
    if (user) {
      fetchPendingRequests();
      fetchVessels();
    }
  }, [user]);

  useEffect(() => {
    if (view === "detail") {
      setView("list");
      setSelectedRequest(null);
    }
  }, [activeView]);

  if (view === "detail" && selectedRequest) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />

        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative z-10 flex h-full">
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            pendingCount={pendingRequests.length}
            isRequester={false}
          />

          <div className="flex-1 overflow-auto">
            <RequestDetailView
              request={selectedRequest}
              onBack={handleDetailBack}
              onApprove={handleApprove}
              onReject={handleReject}
              onQuery={handleQuery}
              actionLoading={actionLoading}
              isReadOnly={detailReadOnly}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 flex h-full">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          pendingCount={pendingRequests.length}
          isRequester={false}
        />

        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2">
                {activeView === "overview"
                  ? `${user?.role} Dashboard`
                  : activeView === "pending"
                  ? "Pending Requests"
                  : activeView === "approved"
                  ? "Approved Requests"
                  : activeView === "completed"
                  ? "Completed Requests"
                  : "Request History"}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {activeView === "overview"
                  ? "Manage and process requests efficiently"
                  : activeView === "pending"
                  ? "Review and process pending requests"
                  : activeView === "approved"
                  ? "View all approved requests"
                  : activeView === "completed"
                  ? "View all completed requests"
                  : "Complete history of all requests"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm md:text-base">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              </div>
            ) : (
              <>
                {activeView === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <MdPendingActions className="text-2xl text-white" />
                        </div>
                       
                      </div>
                      <p className="text-slate-500 text-sm mb-1 font-semibold">
                        Pending Requests
                      </p>
                      <p className="text-slate-900 text-3xl font-bold">
                        {pendingRequests.length}
                      </p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <MdShoppingCart className="text-2xl text-white" />
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm mb-1 font-semibold">
                        Purchase Orders
                      </p>
                      <p className="text-slate-900 text-3xl font-bold">
                        {
                          pendingRequests.filter(
                            (r) => r.requestType === "purchaseOrder"
                          ).length
                        }
                      </p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                          <MdAttachMoney className="text-2xl text-white" />
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm mb-1 font-semibold">
                        Petty Cash
                      </p>
                      <p className="text-slate-900 text-3xl font-bold">
                        {
                          pendingRequests.filter(
                            (r) => r.requestType !== "purchaseOrder"
                          ).length
                        }
                      </p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                          <MdCheckCircle className="text-2xl text-white" />
                        </div>
                      </div>
                      <p className="text-slate-500 text-sm mb-1 font-semibold">
                        Approved Today
                      </p>
                      <p className="text-slate-900 text-3xl font-bold">0</p>
                    </div>
                  </div>
                )}

                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6 shadow-lg">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                      <input
                        type="text"
                        placeholder="Search by request ID, requester, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-12 pl-12 pr-10 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="all">All Types</option>
                        <option value="purchaseOrder">Purchase Orders</option>
                        <option value="pettycash">PettyCash</option>
                      </select>
                      <MdFilterList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                      <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
                    </div>
                  </div>
                </div>

                {activeView === "completed" ? (
                  <CompletedRequests
                    searchQuery={searchQuery}
                    filterType={filterType}
                    onOpenDetail={handleOpenDetail}
                  />
                ) : activeView === "approved" ? (
                  <Approved
                    searchQuery={searchQuery}
                    filterType={filterType}
                    onOpenDetail={handleOpenDetail}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-slate-500 text-xs font-mono font-semibold">
                              {request.requestId}
                            </span>

                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(
                                request.requestType
                              )}`}
                            >
                              {getTypeIcon(request.requestType)}
                              <span>{getTypeLabel(request.requestType)}</span>
                            </span>

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
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#036173] to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredRequests.length === 0 && (
                      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-12 text-center shadow-lg">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MdPendingActions className="text-4xl text-slate-400" />
                        </div>
                        <p className="text-slate-700 text-lg font-semibold">
                          No requests found
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
