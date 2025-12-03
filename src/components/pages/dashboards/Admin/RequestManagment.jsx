import React, { useMemo, useState } from "react";
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

/*
  RequestManagement - new prototype page
  - Stats cards (no "Approved Today")
  - Tabs to switch lists: Pending / Purchase Orders / Petty Cash
  - Stuck >24h detection with Override button (mock)
  - Clicking a request opens RequestDetailDemo as a modal (prototype)
*/

const initialRequests = [
  {
    id: "REQ-2024-001",
    type: "purchase-order",
    title: "Marine Engine Parts",
    requester: "John Smith",
    department: "Marine",
    destination: "IT",
    vessel: "MV Ocean Star",
    amount: 15450,
    amountFormatted: "$15,450",
    priority: "urgent",
    createdAt: Date.now() - 1000 * 60 * 60 * 26, // 26 hours ago (stuck)
    managerAssignedAt: Date.now() - 1000 * 60 * 60 * 25, // 25 hours ago (stuck)
    status: "pending_manager",
    items: 12,
  },
  {
    id: "REQ-2024-002",
    type: "petty-cash",
    title: "Office Supplies",
    requester: "Sarah Johnson",
    department: "Operations",
    destination: "Project",
    vessel: "N/A",
    amount: 450,
    amountFormatted: "$450",
    priority: "normal",
    createdAt: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
    managerAssignedAt: Date.now() - 1000 * 60 * 60 * 4,
    status: "pending_manager",
    items: 5,
  },
  {
    id: "REQ-2024-003",
    type: "purchase-order",
    title: "Safety Equipment & Gear",
    requester: "Michael Brown",
    department: "IT",
    destination: "Marine",
    vessel: "MV Sea Breeze",
    amount: 8920,
    amountFormatted: "$8,920",
    priority: "urgent",
    createdAt: Date.now() - 1000 * 60 * 60 * 50, // older
    managerAssignedAt: Date.now() - 1000 * 60 * 60 * 49,
    status: "pending_manager",
    items: 8,
  },
  {
    id: "REQ-2024-004",
    type: "purchase-order",
    title: "Hydraulic Fluid & Filters",
    requester: "David Wilson",
    department: "Marine",
    destination: "Operations",
    vessel: "MV Wave Rider",
    amount: 3200,
    amountFormatted: "$3,200",
    priority: "normal",
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    managerAssignedAt: Date.now() - 1000 * 60 * 60 * 2,
    status: "pending_procurement",
    items: 6,
  },
];

const formatAmount = (n) =>
  typeof n === "number" ? `$${n.toLocaleString()}` : n || "N/A";

const ageHours = (ts) => Math.max(0, (Date.now() - ts) / (1000 * 60 * 60));

const RequestManagement = () => {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState("all"); // all | pending | purchase-order | petty-cash
  const [search, setSearch] = useState("");
  const [openRequest, setOpenRequest] = useState(null);

  // --- Comments for inline request detail modal (prototype) ---
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

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

  // --- Workflow stages (copied from RequestDetailDemo for consistent UI) ---
  const workflowStages = [
    { id: 1, name: "Submitted", status: "completed" },
    { id: 2, name: "Procurement Review", status: "current" },
    { id: 3, name: "Manager Approval", status: "pending" },
    { id: 4, name: "Finance Approval", status: "pending" },
    { id: 5, name: "Processing", status: "pending" },
    { id: 6, name: "Completed", status: "pending" },
  ];

  const getStageColor = (status) => {
    switch (status) {
      case "completed":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
      case "current":
        return "text-teal-500 bg-teal-500/10 border-teal-500/30";
      case "pending":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getStageIcon = (status) => {
    switch (status) {
      case "completed":
        return "✓";
      case "current":
        return "⏱";
      case "pending":
        return "⏳";
      default:
        return "⏳";
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = requests.length;
    const purchaseOrders = requests.filter(
      (r) => r.type === "purchase-order"
    ).length;
    const petty = requests.filter((r) => r.type === "petty-cash").length;
    const pending = requests.filter((r) => r.status.includes("pending")).length;
    return { total, purchaseOrders, petty, pending };
  }, [requests]);

  const filteredList = useMemo(() => {
    return requests.filter((r) => {
      if (filter === "pending" && !r.status.includes("pending")) return false;
      if (filter === "purchase-order" && r.type !== "purchase-order")
        return false;
      if (filter === "petty-cash" && r.type !== "petty-cash") return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.title || "").toLowerCase().includes(q) ||
        (r.requester || "").toLowerCase().includes(q) ||
        (r.id || "").toLowerCase().includes(q)
      );
    });
  }, [requests, filter, search]);

  const handleOverride = (reqId) => {
    // Mock override: mark as escalated and update timestamps
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              overridden: true,
              status: "escalated",
              managerAssignedAt: Date.now(),
            }
          : r
      )
    );
    alert(`Request ${reqId} overridden and escalated (prototype).`);
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
      <div className="grid grid-cols-1 md:grid-cols-3  gap-6">
        <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Total Requests</div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.total}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Pending: {stats.pending}
              </div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-2xl text-emerald-600">
              <MdAssessment />
            </div>
          </div>
        </div>

        <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Purchase Orders</div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.purchaseOrders}
              </div>
              <div className="text-sm text-slate-500 mt-1">Active POs</div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-2xl text-emerald-600">
              <MdShoppingCart />
            </div>
          </div>
        </div>

        <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Petty Cash</div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.petty}
              </div>
              <div className="text-sm text-slate-500 mt-1">Requests</div>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center text-2xl text-emerald-600">
              <MdAttachMoney />
            </div>
          </div>
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
            onClick={() => setFilter("purchase-order")}
            className={`px-3 py-2 rounded-lg font-semibold ${
              filter === "purchase-order"
                ? "bg-[#036173] text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setFilter("petty-cash")}
            className={`px-3 py-2 rounded-lg font-semibold ${
              filter === "petty-cash"
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
          const stuck =
            r.managerAssignedAt && ageHours(r.managerAssignedAt) > 24;
          return (
            <div
              key={r.id}
              className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-slate-500 text-xs font-mono">
                      {r.id}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${
                        r.type === "purchase-order"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-teal-100 text-teal-700 border-teal-200"
                      }`}
                    >
                      {r.type === "purchase-order" ? (
                        <MdShoppingCart className="text-sm mr-1" />
                      ) : (
                        <MdAttachMoney className="text-sm mr-1" />
                      )}
                      {r.type === "purchase-order"
                        ? "Purchase Order"
                        : "Petty Cash"}
                    </span>
                    {r.priority === "urgent" && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-600 border border-red-200">
                        <MdPriorityHigh className="text-sm mr-1" /> URGENT
                      </span>
                    )}
                    {stuck && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-amber-700 border border-amber-200">
                        Stuck &gt;24h
                      </span>
                    )}
                    {r.overridden && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                        Overridden
                      </span>
                    )}
                  </div>

                  <h3 className="text-slate-900 text-lg font-bold mb-1">
                    {r.title}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Requested by{" "}
                    <span className="text-slate-900 font-semibold">
                      {r.requester}
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
                    {r.vessel && r.vessel !== "N/A" && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MdDirectionsBoat />{" "}
                        <span className="text-sm font-medium">{r.vessel}</span>
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
                    <div className="text-slate-900 font-bold">
                      {formatAmount(r.amount)}
                    </div>
                    <div className="text-xs text-slate-500">
                      Items: {r.items}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setOpenRequest(r)}
                      className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-semibold"
                    >
                      Review
                    </button>
                    <div className="flex gap-2">
                      {stuck && (
                        <button
                          onClick={() => handleOverride(r.id)}
                          className="h-10 px-3 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold"
                        >
                          Override
                        </button>
                      )}
                      <button
                        onClick={() => setOpenRequest(r)}
                        className="h-10 px-3 bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-lg text-sm font-semibold"
                      >
                        Details
                      </button>
                    </div>
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
            onClick={() => setOpenRequest(null)}
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
                  <div className="relative">
                    {/* Progress Line - Behind icons */}
                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 -z-10">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-1/6 transition-all duration-500" />
                    </div>

                    {/* Stages */}
                    <div className="relative flex items-start justify-between">
                      {workflowStages.map((stage) => (
                        <div
                          key={stage.id}
                          className="flex flex-col items-center z-10"
                          style={{ width: `${100 / workflowStages.length}%` }}
                        >
                          <div
                            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 text-xl font-bold transition-all duration-300 bg-white ${getStageColor(
                              stage.status
                            )}`}
                          >
                            {getStageIcon(stage.status)}
                          </div>
                          <p
                            className={`text-xs font-medium text-center leading-tight ${
                              stage.status === "completed"
                                ? "text-emerald-600"
                                : stage.status === "current"
                                ? "text-teal-600"
                                : "text-slate-400"
                            }`}
                          >
                            {stage.name}
                          </p>
                          {stage.status === "current" && (
                            <span className="mt-1 px-2 py-0.5 bg-teal-500/10 text-teal-600 text-[10px] font-semibold rounded-full">
                              IN PROGRESS
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
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
                        {openRequest.id}
                      </p>
                    </div>
                    <div className="px-4 py-3 border-b border-r border-slate-200">
                      <p className="text-xs text-slate-500">Requester</p>
                      <p className="text-sm text-slate-900 font-semibold">
                        {openRequest.requester}
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
                          {openRequest.type === "purchase-order"
                            ? "Purchase Order"
                            : "Petty Cash"}
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
                        {/** use a small demo list derived from openRequest (if no real items exist) */}
                        {(
                          openRequest._itemsPreview || [
                            {
                              id: 1,
                              name: openRequest.title || "Item A",
                              quantity: 1,
                              unit: "pcs",
                              unitPrice: openRequest.amountFormatted || "$0",
                              total: openRequest.amountFormatted || "$0",
                            },
                          ]
                        ).map((it) => (
                          <tr
                            key={it.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-slate-900">
                                {it.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="text-sm text-slate-700 font-semibold">
                                {it.quantity}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                                {it.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm text-slate-700">
                                {it.unitPrice}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="text-sm font-bold text-slate-900">
                                {it.total}
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
                        {comments.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-100"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                              {(c.author || "U")
                                .split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {c.author}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {new Date(c.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                                {c.text}
                              </div>
                            </div>
                          </li>
                        ))}
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
    </div>
  );
};

export default RequestManagement;
