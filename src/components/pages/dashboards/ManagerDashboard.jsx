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
  MdInventory,
  MdLocalShipping,
  MdHelpOutline,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";
import Sidebar from "../../shared/layout/Sidebar";
import RequestDetailView from "./RequestDetailView";
import CompletedRequests from "./CompletedRequests";
import Approved from "./Approved";
import UsersSignature from "./UsersSignature";
import VendorManagement from "./VendorManagement";
import InventoryManagement from "./InventoryManagement";
import AccountMerged from "./AccountMerged";
import QueriedRequest from "./QueriedRequest";
import ProcurementCreateRequest from "./ProcurementCreateRequest";
import ProcurementMyRequests from "./ProcurementMyRequests";
import OverviewDashboard from "./OverviewDashboard";
import IncompleteDeliveryList from "./IncompleteDeliveryList";
import Notification from "./Notification";
import RejectedRequest from "./RejectedRequest";
import ChatRoom from "./ChatRoom";
import Support from "./Support";
import { useGlobalAlert } from "../../shared/GlobalAlert";
import { useGlobalPrompt } from "../../shared/GlobalPrompt";

// ManagerDashboard component
const ManagerDashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const { showAlert } = useGlobalAlert();
  const { showPrompt } = useGlobalPrompt();
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
  const [queriedCount, setQueriedCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [approvedTodayCount, setApprovedTodayCount] = useState(0);
  const [pendingUnreadCount, setPendingUnreadCount] = useState(0);
  const [queriedUnreadCount, setQueriedUnreadCount] = useState(0);
  const [rejectedUnreadCount, setRejectedUnreadCount] = useState(0);

  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true";
    }
    return false;
  });
  const fetchChatUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const resp = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/chat/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatUnreadCount(resp.data?.unreadCount || 0);
    } catch (err) {
      setChatUnreadCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChatUnreadCount();
      const interval = setInterval(fetchChatUnreadCount, 3000); // every 3 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  // ManagerDashboard.jsx

  const fetchRejectedUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      // Fetch only 1 item, but get the total unread count from the API response
      const resp = await axios.get(
        `${API_BASE_URL}/requests/rejected?limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // If your API returns unreadCount, use it; otherwise, count isUnread in data
      const unread =
        resp.data?.data?.filter?.((r) => r.isUnread).length ??
        (Array.isArray(resp.data?.data) ? resp.data.data.length : 0);
      setRejectedUnreadCount(unread);
    } catch {
      setRejectedUnreadCount(0);
    }
  };

  const fetchQueriedUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const resp = await axios.get(`${API_BASE_URL}/requests/queried?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // If your API returns unreadCount, use it; otherwise, count isUnread in data
      const unread =
        typeof resp.data.unreadCount === "number"
          ? resp.data.unreadCount
          : resp.data?.data?.filter?.((r) => r.isUnread).length ?? 0;
      setQueriedUnreadCount(unread);
    } catch {
      setQueriedUnreadCount(0);
    }
  };
  // Replace request helper
  const replaceRequestIn = (setter) => (updatedReq) =>
    setter((prev = []) =>
      prev.map((r) => (r?.requestId === updatedReq?.requestId ? updatedReq : r))
    );

  const replaceInPending = replaceRequestIn(setPendingRequests);
  const replaceInCompleted = replaceRequestIn(setCompletedRequests);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const handleOpenDetail = async (request, opts = {}) => {
    const flow = await fetchRequestFlow(request.requestId);
    setSelectedRequest({ ...request, flow });
    // set readOnly for both completed and approved views
    if (opts.readOnly) {
      setDetailReadOnly(true);
    } else {
      setDetailReadOnly(
        activeView === "completed" ||
          activeView === "approved" ||
          activeView === "myrequests"
      );
    }
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
      setPendingUnreadCount(
        (response.data.data || []).filter((r) => r.isUnread).length
      );

      setError(null);
    } catch (err) {
      console.error("❌ Error fetching pending requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };
  const fetchUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const resp = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(resp.data?.unreadCount || 0);
    } catch (err) {
      setUnreadCount(0);
    }
  };
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchQueriedCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      // request a single item page to get total count
      const resp = await axios.get(`${API_BASE_URL}/requests/queried?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const total =
        resp.data?.total ??
        (Array.isArray(resp.data?.data) ? resp.data.data.length : 0);
      setQueriedCount(Number(total) || 0);
    } catch (err) {
      console.warn("Failed to fetch queried count:", err);
      setQueriedCount(0);
    }
  };
  const fetchApprovedTodayCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      // request a single item page to get total count if the API exposes `total`
      const resp = await axios.get(
        `${API_BASE_URL}/requests/approved?limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const total =
        resp.data?.total ??
        (Array.isArray(resp.data?.data) ? resp.data.data.length : 0);
      setApprovedTodayCount(Number(total) || 0);
    } catch (err) {
      console.warn("Failed to fetch approved count:", err);
      setApprovedTodayCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
      fetchVessels();
      fetchQueriedCount();
      fetchApprovedTodayCount();
      fetchRejectedUnreadCount(); // <-- Add this
      fetchQueriedUnreadCount();
    }
  }, [user]);

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
  // ...existing code...
  const handleApprove = async (requestId) => {
    const req =
      selectedRequest && selectedRequest.requestId === requestId
        ? selectedRequest
        : pendingRequests.find((r) => r.requestId === requestId);

    const isQueried = req?.isQueried === true;

    const confirmMsg = isQueried
      ? "Confirm you want to approve this query request?"
      : "Are you sure you want to approve this request?";

    const ok = await showPrompt(confirmMsg);
    if (!ok) {
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

      console.log("🔁 approve response:", response?.data);

      // fetch the full request to inspect items after approve
      try {
        const reqResp = await axios.get(
          `${API_BASE_URL}/requests/${requestId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(
          "🔁 request after approve:",
          reqResp?.data?.data ?? reqResp?.data
        );
      } catch (fetchErr) {
        console.error("Error fetching request after approve:", fetchErr);
      }

      showAlert("Request approved successfully!");

      setView("list");
      setSelectedRequest(null);
      fetchPendingRequests();
      fetchApprovedTodayCount();
      fetchQueriedCount();
    } catch (err) {
      console.error("❌ Error approving request:", err);
      showAlert(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };
  // ...existing code...
  // Reject a request
  const handleReject = async (requestId, comment) => {
    if (!comment || comment.trim().length < 3) {
      showAlert("A rejection comment is required.");
      return;
    }

    const ok = await showPrompt(
      "Are you sure you want to reject this request?"
    );
    if (!ok) return;

    try {
      setActionLoading(true);
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/reject`,
        { comment }, // Send the comment in the body
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      showAlert("Request rejected successfully!");

      setView("list");
      setSelectedRequest(null);
      fetchPendingRequests();
      fetchQueriedCount();
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
      showAlert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuery = (requestId) => {
    setView("list");
    fetchPendingRequests();
    fetchQueriedCount();
  };
  const handleViewDetails = async (request, cardType) => {
    // Use cardType if provided, otherwise fallback to request.status
    if (cardType === "approved") {
      setActiveView("approved");
    } else if (cardType === "queried") {
      setActiveView("queried");
    } else if (cardType === "pending") {
      setActiveView("pending");
    } else if (request.status === "APPROVED" || request.status === "approved") {
      setActiveView("approved");
    } else {
      setActiveView("pending");
    }
    const flow = await fetchRequestFlow(request.requestId);
    setSelectedRequest({ ...request, flow });
    setDetailReadOnly(
      request.status === "APPROVED" ||
        request.status === "approved" ||
        activeView === "completed"
    );
    setView("detail");
  };

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

  // Get CSS color classes for request type
  const getTypeColor = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "pettyCash":
        return "bg-teal-100 text-teal-600 border-teal-200";
      case "inStock":
        return "bg-blue-100 text-blue-600 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Get icon component for request type
  const getTypeIcon = (type) => {
    switch (type) {
      case "purchaseOrder":
        return <MdShoppingCart className="text-sm" />;
      case "pettyCash":
        return <MdAttachMoney className="text-sm" />;
      case "inStock":
        return <MdInventory className="text-sm" />;
      default:
        return null;
    }
  };

  // Get human-readable label for request type
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

  const getInStockColor = () => {
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getInStockIcon = () => {
    return <MdInventory className="text-sm" />;
  };

  // Get vessel name from vesselId
  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId;
  };
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
  const displayRequests = pendingRequests;
  const isLoading = loading;

  const filteredRequests = displayRequests.filter((req) => {
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

  // Sort: high priority first, then by request number descending
  const highPriority = filteredRequests
    .filter((r) => r.priority === "high")
    .sort((a, b) => {
      const numA = Number(String(a.requestId).replace(/\D/g, ""));
      const numB = Number(String(b.requestId).replace(/\D/g, ""));
      return numB - numA;
    });
  const others = filteredRequests
    .filter((r) => r.priority !== "high")
    .sort((a, b) => {
      const numA = Number(String(a.requestId).replace(/\D/g, ""));
      const numB = Number(String(b.requestId).replace(/\D/g, ""));
      return numB - numA;
    });

  const sortedRequests = [...highPriority, ...others];

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

  const handleViewDetailsClick = async (request) => {
    if (request.isUnread) {
      try {
        const token = getToken();
        await axios.post(
          `${API_BASE_URL}/requests/${request.requestId}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPendingRequests((prev) =>
          prev.map((r) =>
            r.requestId === request.requestId ? { ...r, isUnread: false } : r
          )
        );
        setPendingUnreadCount((prev) => Math.max(0, prev - 1));
        // Optionally, notify parent to update sidebar count
        if (typeof onUnreadChange === "function") onUnreadChange(-1);
      } catch (err) {
        // Optionally handle error
      }
    }
    handleOpenDetail(request); // <-- Use your actual handler here
  };

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
            pendingCount={pendingUnreadCount}
            queriedCount={queriedUnreadCount}
            chatUnreadCount={chatUnreadCount}
            rejectedCount={rejectedUnreadCount}
            notificationCount={unreadCount}
            isRequester={false}
            setCollapsed={setSidebarCollapsed}
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
          pendingCount={pendingUnreadCount}
          queriedCount={queriedUnreadCount}
          rejectedCount={rejectedUnreadCount}
          chatUnreadCount={chatUnreadCount}
          notificationCount={unreadCount}
          isRequester={false}
          setCollapsed={setSidebarCollapsed}
        />

        {activeView === "chatRoom" && <ChatRoom />}
        {activeView === "support" && <Support />}

        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2">
                {activeView === "createNew"
                  ? "Create New Request"
                  : activeView === "myRequests"
                  ? "My Requests"
                  : activeView === "overview"
                  ? `${user?.role} Dashboard`
                  : activeView === "pending"
                  ? "Pending Requests"
                  : activeView === "approved"
                  ? "Approved Requests"
                  : activeView === "completed"
                  ? "Completed Requests"
                  : activeView === "queried"
                  ? "Queried Requests"
                  : activeView === "rejected"
                  ? "Rejected Requests"
                  : ""}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {activeView === "createNew"
                  ? "Fill in the details below to submit your request"
                  : activeView === "myRequests"
                  ? "View and track requests you have created"
                  : activeView === "overview"
                  ? "Manage and process requests efficiently"
                  : activeView === "pending"
                  ? "Review and process pending requests"
                  : activeView === "approved"
                  ? "View all approved requests"
                  : activeView === "completed"
                  ? "View all completed requests"
                  : activeView === "queried"
                  ? "Review queried requests"
                  : ""}
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
                {activeView === "createNew" && (
                  <ProcurementCreateRequest
                    onRequestCreated={() => {
                      // After creating, switch to pending view and refresh
                      setActiveView("myRequests");
                      fetchPendingRequests();
                    }}
                  />
                )}
                {/* ✅ ADD: My Requests View for Procurement roles */}
                {activeView === "myRequests" && (
                  <ProcurementMyRequests onOpenDetail={handleOpenDetail} />
                )}
                {activeView === "overview" && (
                  <OverviewDashboard
                    user={user}
                    pendingRequests={pendingRequests}
                    approvedTodayCount={approvedTodayCount}
                    queriedCount={queriedCount}
                    department={user?.department || ""}
                    destination={user?.destination || ""}
                    setActiveView={setActiveView}
                    onViewDetails={handleViewDetails}
                    onPendingUnreadChange={setPendingUnreadCount} // <-- add this
                  />
                )}
                {activeView !== "signature" &&
                  activeView !== "vendorManagement" &&
                  activeView !== "inventoryManagement" &&
                  activeView !== "merged" &&
                  activeView !== "incompleteDelivery" &&
                  activeView !== "createNew" &&
                  activeView !== "myRequests" &&
                  activeView !== "chatRoom" &&
                  activeView !== "support" &&
                  activeView !== "notifications" &&
                  activeView !== "overview" && (
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
                      </div>
                    </div>
                  )}
                {activeView === "signature" && <UsersSignature />}
                {activeView === "notifications" && (
                  <Notification onUnreadCountChange={fetchUnreadCount} />
                )}{" "}
                {activeView === "vendorManagement" && <VendorManagement />}
                {activeView === "inventoryManagement" && (
                  <InventoryManagement />
                )}
                {activeView === "incompleteDelivery" && (
                  <IncompleteDeliveryList
                    searchQuery={searchQuery}
                    filterType={filterType}
                    onViewDetails={handleOpenDetail}
                  />
                )}
                {activeView === "rejected" && (
                  <RejectedRequest
                    searchQuery={searchQuery}
                    onUnreadChange={setRejectedUnreadCount}
                    filterType={filterType}
                    onOpenDetail={handleOpenDetail}
                  />
                )}
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
                ) : activeView === "queried" ? (
                  <QueriedRequest
                    searchQuery={searchQuery}
                    onUnreadChange={fetchQueriedUnreadCount}
                    filterType={filterType}
                    onOpenDetail={handleOpenDetail}
                  />
                ) : activeView === "merged" ? (
                  <AccountMerged
                    user={user}
                    getToken={getToken}
                    API_BASE_URL={API_BASE_URL}
                    onOpenDetail={handleOpenDetail}
                  />
                ) : activeView !== "signature" &&
                  activeView !== "vendorManagement" &&
                  activeView !== "createNew" &&
                  activeView !== "myRequests" &&
                  activeView !== "incompleteDelivery" &&
                  activeView !== "inventoryManagement" &&
                  activeView !== "notifications" &&
                  activeView !== "chatRoom" &&
                  activeView !== "support" &&
                  activeView !== "rejected" &&
                  activeView !== "overview" ? (
                  <div className="space-y-4">
                    {sortedRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className={`bg-white/90 backdrop-blur-xl border-2 rounded-2xl p-4 md:p-6 shadow-lg transition-all duration-200 cursor-pointer group
    ${
      request.isUnread
        ? "border-emerald-400 ring-2 ring-emerald-200"
        : "border-slate-200 hover:border-slate-300"
    }
  `}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-slate-500 text-xs font-mono font-semibold">
                                {request.requestId}
                              </span>
                              {request.isIncompleteDelivery && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                  <MdLocalShipping className="text-sm" />
                                  <span>Incomplete Delivery</span>
                                </span>
                              )}
                              {/* Tag badge (shows first, when present) */}
                              {request.tag && (
                                <span
                                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTagColor(
                                    request.tag
                                  )}`}
                                >
                                  {getTagIcon(request.tag)}
                                  <span>
                                    {String(request.tag).replace(
                                      /(^\w|\s\w)/g,
                                      (m) => m.toUpperCase()
                                    )}
                                  </span>
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
                                  <span>
                                    {getTypeLabel(request.requestType)}
                                  </span>
                                </span>
                              ) : null}
                              {request.offshoreReqNumber && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                                  <MdDirectionsBoat className="text-sm" />
                                  <span>{request.offshoreReqNumber}</span>
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
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleDateString()}{" "}
                                  {new Date(
                                    request.createdAt
                                  ).toLocaleTimeString([], {
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
                              className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#036173] to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredRequests.length === 0 &&
                      activeView !== "signature" && (
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
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
