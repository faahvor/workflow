import React, { useEffect, useMemo, useState } from "react";
import { IoMdSearch } from "react-icons/io";
import {
  MdAssessment,
  MdShoppingCart,
  MdAttachMoney,
  MdDirectionsBoat,
  MdPriorityHigh,
  MdArrowForward,
  MdCheckCircle,
  MdHistory,
} from "react-icons/md";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import RequestWorkflow from "../../../shared/RequestWorkflow";
import { useGlobalAlert } from "../../../shared/GlobalAlert";

const formatAmount = (n) =>
  typeof n === "number" ? `$${n.toLocaleString()}` : n || "N/A";

const ageMinutes = (ts) =>
  Math.max(0, (Date.now() - new Date(ts).getTime()) / (1000 * 60));
const isCompletedRequest = (r) => {
  const status = (r.status || "").toUpperCase();
  return status === "COMPLETED";
};

const RequestManagement = () => {
  const [filter, setFilter] = useState("all"); // all | pending | purchase-order | petty-cash
  const [search, setSearch] = useState("");
  const [openRequest, setOpenRequest] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  // --- Comments for inline request detail modal (prototype) ---
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const { getToken } = useAuth();
const API_BASE = import.meta.env.VITE_API_BASE_URL;
const { showAlert } = useGlobalAlert();
  // server-backed list state / pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(20); // fixed as requested
  const [total, setTotal] = useState(0);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [workflowPath, setWorkflowPath] = useState([]);
  const [requests, setRequests] = useState([]);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideRequestId, setOverrideRequestId] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  const fetchWorkflow = async (requestId) => {
    if (!requestId) return;

    const token =
      (typeof getToken === "function" && (await getToken())) ||
      localStorage.getItem("token") ||
      null;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      console.debug("[RequestManagement] fetching workflow for:", requestId);

      const resp = await axios.get(`${API_BASE}/requests/${requestId}/flow`, {
        headers,
      });

      console.debug(
        "[RequestManagement] fetchWorkflow resp status:",
        resp.status
      );
      console.debug("[RequestManagement] fetchWorkflow body:", resp.data);

      const flowData = resp.data?.data || resp.data?.flow || resp.data || [];

      if (Array.isArray(flowData)) {
        setWorkflowPath(flowData);
      } else if (flowData && typeof flowData === "object") {
        // If it's an object with a path/stages array inside
        const stages =
          flowData.path || flowData.stages || flowData.workflow || [];
        setWorkflowPath(Array.isArray(stages) ? stages : []);
      } else {
        setWorkflowPath([]);
      }
    } catch (err) {
      console.error("[RequestManagement] fetchWorkflow error:", err);
      if (err?.response?.data) {
        console.error(
          "[RequestManagement] fetchWorkflow response.data:",
          err.response.data
        );
      }
      // Don't showAlert for workflow errors, just log - request can still be viewed
      setWorkflowPath([]);
    }
  };

  const fetchRequests = async (opts = {}) => {
    const p = opts.page ?? page;
    const q = opts.search ?? search;
    const f = opts.filter ?? filter;

    const params = {
      page: p,
      limit,
    };

    // map UI filter to server params
    if (q && q.toString().trim()) params.search = q.toString().trim();
    if (f === "purchase-order") params.type = "purchaseOrder";
    if (f === "petty-cash") params.type = "pettyCash";
    // note: 'pending' filter should return all pending statuses client-side; we request server without status filter so it returns everything (server supports status if you want more exact filtering)

    const token =
      (typeof getToken === "function" && (await getToken())) ||
      localStorage.getItem("token") ||
      null;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      setLoadingRequests(true);
      console.debug("[RequestManagement] fetching requests", {
        params,
        headers,
      });
      const resp = await axios.get(`${API_BASE}/admin/requests`, {
        params,
        headers,
      });
      console.debug(
        "[RequestManagement] fetchRequests axios resp status:",
        resp.status
      );
      console.debug("[RequestManagement] fetchRequests body:", resp.data);
      const body = resp.data || {};
      const data = Array.isArray(body.data) ? body.data : [];
      setRequests(data);
      setPage(body.page ?? p);
      setPages(body.pages ?? 1);
      setTotal(body.total ?? data.length);
    } catch (err) {
      console.error("[RequestManagement] fetchRequests error:", err);
      // surface possible server message
      if (err?.response?.data) {
        console.error(
          "[RequestManagement] fetchRequests response.data:",
          err.response.data
        );
      }
      showAlert("Failed to fetch requests. Check console for details.");
    } finally {
      setLoadingRequests(false);
    }
  };
  const fetchRequestDetail = async (requestId) => {
    if (!requestId) return;

    // Find the request from the list and open modal immediately
    const listRequest = requests.find(
      (r) => (r.requestId || r.id) === requestId
    );
    if (listRequest) {
      setOpenRequest(listRequest);
      // Set comments from list data if available
      if (Array.isArray(listRequest.comments)) {
        setComments(listRequest.comments);
      } else {
        setComments([]);
      }
    }

    const token =
      (typeof getToken === "function" && (await getToken())) ||
      localStorage.getItem("token") ||
      null;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      console.debug(
        "[RequestManagement] fetching request detail for:",
        requestId
      );

      const resp = await axios.get(`${API_BASE}/requests/${requestId}`, {
        headers,
      });

      console.debug(
        "[RequestManagement] fetchRequestDetail resp status:",
        resp.status
      );
      console.debug("[RequestManagement] fetchRequestDetail body:", resp.data);

      const requestData = resp.data?.data || resp.data || null;

      if (requestData) {
        // Update with full data
        setOpenRequest(requestData);

        // Fetch workflow data for this request
        fetchWorkflow(requestId);

        // If the response includes comments, set them
        if (Array.isArray(requestData.comments)) {
          setComments(requestData.comments);
        }
      } else {
        console.error("[RequestManagement] No request data in response");
      }
    } catch (err) {
      console.error("[RequestManagement] fetchRequestDetail error:", err);
      if (err?.response?.data) {
        console.error(
          "[RequestManagement] fetchRequestDetail response.data:",
          err.response.data
        );
      }
    }
  };

  useEffect(() => {
    // initial fetch and whenever filter/search/page changes
    fetchRequests({ page, search, filter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter, search]);

  const mockComments = [
    {
      id: "c1",
      author: "Procurement Officer",
      text: "Please confirm lead time.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "c2",
      author: "John Smith",
      text: "Acknowledged, sourcing quotes.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ];

  const postComment = async () => {
    const text = (newComment || "").trim();
    if (!text) return;
    setPostingComment(true);
    const temp = {
      id: `temp-${Date.now()}`,
      author: "You",
      text,
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setComments((c) => [temp, ...c]);
    setNewComment("");
    // mock network delay
    setTimeout(() => {
      // replace temp with persisted mock comment
      setComments((prev) => [
        {
          id: `c-${Date.now()}`,
          author: "You",
          text,
          createdAt: new Date().toISOString(),
        },
        ...prev.filter((x) => !x._temp),
      ]);
      setPostingComment(false);
    }, 700);
  };

  // Stats
  const stats = useMemo(() => {
    const totalCount = requests.length;
    const purchaseOrders = requests.filter(
      (r) => r.requestType === "purchaseOrder"
    ).length;
    const petty = requests.filter((r) => r.requestType === "pettyCash").length;
    // Pending count: exclude completed and rejected
    const pending = requests.filter(
      (r) => !isCompletedRequest(r) && r.isRejected !== true
    ).length;
    return { total: totalCount, purchaseOrders, petty, pending };
  }, [requests]);

  const filteredList = useMemo(() => {
    return requests.filter((r) => {
      // 'pending' filter: exclude completed and rejected requests
      if (filter === "pending") {
        if (isCompletedRequest(r)) return false;
        if (r.isRejected === true) return false;
      }

      // 'purchaseOrder' filter: only purchaseOrder type
      if (filter === "purchaseOrder" && r.requestType !== "purchaseOrder")
        return false;

      // 'pettyCash' filter: only pettyCash type
      if (filter === "pettyCash" && r.requestType !== "pettyCash") return false;

      // 'all' filter: show everything (no additional filtering)

      const q = search.trim().toLowerCase();
      if (!q) return true;

      const requesterStr =
        typeof r.requester === "object"
          ? (
              r.requester.displayName ||
              r.requester.username ||
              r.requester.userId ||
              ""
            )
              .toString()
              .toLowerCase()
          : (r.requester || "").toString().toLowerCase();

      return (
        (r.requestId || "").toLowerCase().includes(q) ||
        (r.purpose || "").toLowerCase().includes(q) ||
        requesterStr.includes(q)
      );
    });
  }, [requests, filter, search]);

  const handleOverride = (reqId) => {
    setOverrideRequestId(reqId);
    setOverrideReason("");
    setOverrideModalOpen(true);
  };

  const submitOverride = async () => {
    const reason = (overrideReason || "").trim();
    if (!reason) {
      showAlert("Please provide a reason for overriding this request.");
      return;
    }

    const token =
      (typeof getToken === "function" && (await getToken())) ||
      localStorage.getItem("token") ||
      null;

    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };

    try {
      setOverrideLoading(true);
      console.debug(
        "[RequestManagement] submitting override for:",
        overrideRequestId
      );
      console.debug("[RequestManagement] override reason:", reason);

      const resp = await axios.post(
        `${API_BASE}/admin/requests/${overrideRequestId}/override`,
        { reason },
        { headers }
      );

      console.debug("[RequestManagement] override resp status:", resp.status);
      console.debug("[RequestManagement] override resp data:", resp.data);

      // Show success message
      setOverrideSuccess(true);

      // Re-fetch requests to get updated data
      fetchRequests({ page, search, filter });

      // Close modal after 2 seconds
      setTimeout(() => {
        setOverrideModalOpen(false);
        setOverrideRequestId(null);
        setOverrideReason("");
        setOverrideSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("[RequestManagement] override error:", err);
      if (err?.response?.data) {
        console.error(
          "[RequestManagement] override response.data:",
          err.response.data
        );
      }
    } finally {
      setOverrideLoading(false);
    }
  };

  const closeOverrideModal = () => {
    setOverrideModalOpen(false);
    setOverrideRequestId(null);
    setOverrideReason("");
    setOverrideSuccess(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats row (no Approved Today) */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Request Management
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage and track purchase orders and petty cash requests.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <MdAssessment className="text-2xl text-white" />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1 font-semibold">
            Total Requests
          </p>
          <p className="text-slate-900 text-3xl font-bold">{stats.total}</p>
          <p className="text-slate-500 text-sm mt-1">
            Pending: {stats.pending}
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
              <MdShoppingCart className="text-2xl text-white" />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1 font-semibold">
            Purchase Orders
          </p>
          <p className="text-slate-900 text-3xl font-bold">
            {stats.purchaseOrders}
          </p>
          <p className="text-slate-500 text-sm mt-1">Active POs</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <MdAttachMoney className="text-2xl text-white" />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1 font-semibold">
            Petty Cash
          </p>
          <p className="text-slate-900 text-3xl font-bold">{stats.petty}</p>
          <p className="text-slate-500 text-sm mt-1">Requests</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-2 rounded-lg font-semibold ${
              filter === "pending"
                ? "bg-[#036173] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setFilter("purchaseOrder")}
            className={`px-3 py-2 rounded-lg font-semibold ${
              filter === "purchaseOrder"
                ? "bg-[#036173] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setFilter("pettyCash")}
            className={`px-3 py-2 rounded-lg font-semibold ${
              filter === "pettyCash"
                ? "bg-[#036173] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Petty Cash
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-2 rounded-lg font-semibold ${
              filter === "all"
                ? "bg-[#036173] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            All
          </button>
        </div>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="relative w-full max-w-md">
            <IoMdSearch className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by request ID, title or requester..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredList.map((r) => {
          const stuckTimestamp = r.managerAssignedAt || r.createdAt;
          const stuck =
            !isCompletedRequest(r) &&
            stuckTimestamp &&
            ageMinutes(stuckTimestamp) > 30;

          // DEBUG: log the request object to see what fields are available
          console.log("[RequestManagement] request item:", r);

          return (
            <div
              key={r.requestId || r.id}
              className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-slate-500 text-xs font-mono">
                      {r.requestId || r.id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${
                        r.requestType === "purchaseOrder"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-teal-100 text-teal-700 border-teal-200"
                      }`}
                    >
                      {r.requestType === "purchaseOrder"
                        ? "Purchase Order"
                        : "Petty Cash"}
                    </span>

                    {/* Status Badge */}
                    {r.status && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${
                          r.status.toLowerCase().includes("approved")
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : r.status.toLowerCase().includes("pending")
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : r.status.toLowerCase().includes("rejected")
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>
                    )}

                    {r.priority === "urgent" && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                        <MdPriorityHigh className="text-sm mr-1" /> URGENT
                      </span>
                    )}
                    {stuck && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-amber-700 border border-amber-200">
                        Delayed
                      </span>
                    )}
                    {r.overridden && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        Overridden
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm">
                    Requested by{" "}
                    <span className="text-slate-900 font-semibold">
                      {typeof r.requester === "object"
                        ? r.requester.displayName ||
                          r.requester.username ||
                          r.requester.userId ||
                          "—"
                        : r.requester || "—"}
                    </span>
                  </p>

                  <div className="flex items-center gap-3 mt-3 text-sm flex-wrap">
                    <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <span className="text-slate-900 font-semibold">
                        {r.department}
                      </span>
                      <MdArrowForward className="text-emerald-500" />
                      <span className="text-slate-900 font-semibold">
                        {r.destination}
                      </span>
                    </div>
                    {((typeof r.vessel === "object"
                      ? r.vessel?.name
                      : r.vessel) ||
                      r.vesselName) &&
                      ((typeof r.vessel === "object"
                        ? r.vessel?.name
                        : r.vessel) || r.vesselName) !== "N/A" && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MdDirectionsBoat />{" "}
                          <span className="text-sm font-medium">
                            {typeof r.vessel === "object"
                              ? r.vessel?.name || r.vessel?.vesselName || "—"
                              : r.vessel || r.vesselName || "—"}
                          </span>
                        </div>
                      )}
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MdHistory />{" "}
                      <span className="text-sm font-medium">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 lg:ml-auto">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">
                      Items:{" "}
                      {Array.isArray(r.items) ? r.items.length : r.items || 0}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => fetchRequestDetail(r.requestId || r.id)}
                      className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold"
                    >
                      Review
                    </button>
                    {stuck && (
                      <button
                        onClick={() => handleOverride(r.requestId || r.id)}
                        className="h-10 px-3 bg-pink-50 text-amber-700 rounded-lg text-sm font-semibold"
                      >
                        Override
                      </button>
                    )}
                    <div className="flex gap-2"></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-12 text-center shadow-lg">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MdAssessment className="text-4xl text-slate-400" />
            </div>
            <p className="text-slate-700 text-lg font-semibold">
              No requests found
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Request Detail modal (inline UI - sidebar removed) */}
      {openRequest && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => {
              setOpenRequest(null);
              setComments([]);
              setNewComment("");
            }}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-8 z-50 w-[95%] max-w-6xl">
            {/* Modal body: full request detail (no sidebar) */}
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 space-y-6 max-h-[75vh] overflow-auto">
                {/* Workflow (detailed, matches RequestDetailDemo) */}
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-3xl px-8 py-6 mb-8 shadow-lg">
                  <h3 className="text-sm font-semibold text-slate-600 mb-6 uppercase tracking-wider">
                    Request Workflow
                  </h3>
                  {workflowPath && workflowPath.length > 0 && (
                    <div className="mt-6">
                      <RequestWorkflow workflowPath={workflowPath} />
                    </div>
                  )}
                </div>

                {/* Request Details */}
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Request Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    <div className="px-4 py-3 border-b border-r border-slate-200">
                      <p className="text-xs text-slate-500">Request ID</p>
                      <p className="text-sm text-slate-900 font-semibold font-mono">
                        {openRequest.requestId || openRequest.id || "—"}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-r border-slate-200">
                      <p className="text-xs text-slate-500">Requester</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        {typeof openRequest.requester === "object"
                          ? openRequest.requester.displayName ||
                            openRequest.requester.username ||
                            openRequest.requester.userId ||
                            "—"
                          : openRequest.requester || "—"}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-r border-slate-200">
                      <p className="text-xs text-slate-500">Department</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        {openRequest.department}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-xs text-slate-500">Destination</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        {openRequest.destination}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-r border-slate-200">
                      <p className="text-xs text-slate-500">Vessel</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        {openRequest.vessel}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-r border-slate-200">
                      <p className="text-xs text-slate-500">Submitted Date</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        {new Date(openRequest.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-r border-slate-200">
                      <p className="text-xs text-slate-500">Request Type</p>
                      <p className="text-sm font-semibold">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                          {openRequest.requestType === "purchaseOrder"
                            ? "Purchase Order"
                            : openRequest.requestType === "pettyCash"
                            ? "Petty Cash"
                            : openRequest.requestType ||
                              openRequest.type ||
                              "—"}
                        </span>
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        Pending
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List (prototype rows) */}
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <MdShoppingCart /> Requested Items
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">
                            Item Description
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                            Qty
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase">
                            Unit
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">
                            Unit Price
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(Array.isArray(openRequest.items) &&
                        openRequest.items.length > 0
                          ? openRequest.items
                          : [
                              {
                                itemId: "placeholder-1",
                                name:
                                  openRequest.purpose ||
                                  openRequest.title ||
                                  "No items",
                                quantity: 1,
                                unit: "pcs",
                                unitPrice: 0,
                                totalPrice: openRequest.amount || 0,
                              },
                            ]
                        ).map((it, idx) => (
                          <tr
                            key={it.itemId || it.id || idx}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-900">
                                {it.name || it.description || "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-sm text-slate-700 font-semibold">
                                {it.quantity ?? 0}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                                {it.unit || "pcs"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm text-slate-700">
                                {typeof it.unitPrice === "number"
                                  ? formatAmount(it.unitPrice)
                                  : it.unitPrice || "—"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm font-bold text-slate-900">
                                {typeof it.totalPrice === "number"
                                  ? formatAmount(it.totalPrice)
                                  : it.totalPrice || it.total || "—"}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comments */}
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg space-y-4">
                  <h3 className="text-lg font-bold">Comments</h3>
                  <div className="space-y-3">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Add a comment..."
                    ></textarea>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setNewComment("")}
                        className="px-3 py-2 bg-slate-100 rounded-md"
                      >
                        Clear
                      </button>
                      <button
                        onClick={postComment}
                        disabled={postingComment || !newComment.trim()}
                        className="px-4 py-2 bg-[#036173] text-white rounded-md"
                      >
                        {postingComment ? "Posting..." : "Post Comment"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    {commentsLoading ? (
                      <div className="py-6 text-center text-slate-500">
                        Loading comments...
                      </div>
                    ) : comments.length > 0 ? (
                      <ul className="space-y-3">
                        {comments.map((c, idx) => {
                          // Safely extract author name from various possible structures
                          let authorName = "User";
                          if (typeof c.author === "object" && c.author) {
                            authorName =
                              c.author.displayName ||
                              c.author.username ||
                              c.author.userId ||
                              "User";
                          } else if (typeof c.author === "string" && c.author) {
                            authorName = c.author;
                          } else if (typeof c.userId === "object" && c.userId) {
                            authorName =
                              c.userId.displayName ||
                              c.userId.username ||
                              c.userId.userId ||
                              "User";
                          } else if (typeof c.userId === "string" && c.userId) {
                            authorName = c.userId;
                          }

                          // Ensure authorName is always a string
                          if (typeof authorName !== "string") {
                            authorName = String(authorName || "User");
                          }

                          const commentText =
                            c.content || c.text || c.message || "";
                          const commentDate =
                            c.timestamp ||
                            c.createdAt ||
                            new Date().toISOString();

                          return (
                            <li
                              key={c.id || c._id || idx}
                              className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-100"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                                {String(authorName || "U")
                                  .split(" ")
                                  .map((s) => (s && s[0]) || "")
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase() || "U"}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">
                                      {authorName}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      {new Date(commentDate).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                                  {commentText}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="py-6 text-center text-slate-500">
                        No comments yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Override Reason Modal */}
      {overrideModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={closeOverrideModal}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-50 w-[95%] max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    Override Request
                  </h3>
                  <button
                    onClick={closeOverrideModal}
                    className="text-white/80 hover:text-white text-xl"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-amber-100 text-sm mt-1">
                  Request ID: {overrideRequestId}
                </p>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {overrideSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MdCheckCircle className="text-4xl text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      Request Successfully Overridden
                    </h4>
                    <p className="text-sm text-slate-500">
                      The request has been overridden and the latest data has
                      been fetched.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Reason for Override{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
                      placeholder="Provide a reason"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              {!overrideSuccess && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    onClick={closeOverrideModal}
                    disabled={overrideLoading}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitOverride}
                    disabled={overrideLoading || !overrideReason.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {overrideLoading ? "Submitting..." : "Override Request"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RequestManagement;
