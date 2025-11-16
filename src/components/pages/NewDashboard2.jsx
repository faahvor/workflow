import React, { useState } from "react";
import { IoMdMenu, IoMdClose, IoMdSearch } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdExpandMore,
  MdExpandLess,
  MdArrowForward,
  MdPriorityHigh,
  MdAttachMoney,
  MdShoppingCart,
  MdDirectionsBoat,
  MdFilterList,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";
import RequestDetailModal from "./RequestDetailModal";

const NewDashboard2 = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Dummy pending requests data
  const pendingRequests = [
    {
      id: "REQ-2024-001",
      type: "purchase-order",
      title: "Marine Engine Parts",
      requester: "John Smith",
      department: "Marine",
      destination: "IT",
      vessel: "MV Ocean Star",
      amount: "$15,450",
      priority: "urgent",
      date: "2024-11-14",
      time: "09:30 AM",
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
      amount: "$450",
      priority: "normal",
      date: "2024-11-14",
      time: "10:15 AM",
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
      amount: "$8,920",
      priority: "urgent",
      date: "2024-11-14",
      time: "11:45 AM",
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
      amount: "$3,200",
      priority: "normal",
      date: "2024-11-13",
      time: "02:20 PM",
      items: 6,
    },
    {
      id: "REQ-2024-005",
      type: "petty-cash",
      title: "Catering Supplies",
      requester: "Emma Davis",
      department: "Project",
      destination: "Marine",
      vessel: "MV Atlantic Pride",
      amount: "$680",
      priority: "normal",
      date: "2024-11-13",
      time: "03:45 PM",
      items: 15,
    },
    {
      id: "REQ-2024-006",
      type: "purchase-order",
      title: "Navigation Equipment",
      requester: "James Miller",
      department: "IT",
      destination: "Operations",
      vessel: "MV Pacific Explorer",
      amount: "$12,500",
      priority: "urgent",
      date: "2024-11-13",
      time: "04:10 PM",
      items: 4,
    },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "purchase-order":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "petty-cash":
        return "bg-teal-100 text-teal-600 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "purchase-order":
        return <MdShoppingCart className="text-sm" />;
      case "petty-cash":
        return <MdAttachMoney className="text-sm" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "purchase-order":
        return "Purchase Order";
      case "petty-cash":
        return "Petty Cash";
      default:
        return type;
    }
  };

  const filteredRequests = pendingRequests.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || req.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse delay-500" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <div
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          } flex flex-col`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Gemz Software</h1>
                <p className="text-gray-400 text-xs">Procurement Officer</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <button
                onClick={() => setActiveView("overview")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "overview"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdDashboard className="text-xl shrink-0" />
                <span className="font-medium text-sm">Overview</span>
              </button>

              <button
                onClick={() => setActiveView("pending")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "pending"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdPendingActions className="text-xl shrink-0" />
                <span className="font-medium text-sm">Pending Requests</span>
                <span className="ml-auto bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {pendingRequests.length}
                </span>
              </button>

              <button
                onClick={() => setActiveView("approved")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "approved"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdCheckCircle className="text-xl shrink-0" />
                <span className="font-medium text-sm">Approved</span>
              </button>

              <button
                onClick={() => setActiveView("history")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "history"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdHistory className="text-xl shrink-0" />
                <span className="font-medium text-sm">History</span>
              </button>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                PO
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  Procurement Officer
                </p>
                <p className="text-gray-400 text-xs truncate">
                  officer@gemz.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors"
        >
          {isSidebarOpen ? (
            <IoMdClose className="text-2xl" />
          ) : (
            <IoMdMenu className="text-2xl" />
          )}
        </button>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-[#0a0a0a] mb-2">
                {activeView === "overview"
                  ? "Procurement Dashboard"
                  : activeView === "pending"
                  ? "Pending Requests"
                  : activeView === "approved"
                  ? "Approved Requests"
                  : "Request History"}
              </h1>
              <p className="text-gray-600">
                {activeView === "overview"
                  ? "Manage and process procurement requests efficiently"
                  : activeView === "pending"
                  ? "Review and process pending procurement requests"
                  : activeView === "approved"
                  ? "View all approved procurement requests"
                  : "Complete history of all procurement requests"}
              </p>
            </div>

            {/* Stats Cards - Only show in overview */}
            {activeView === "overview" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <MdPendingActions className="text-2xl text-white" />
                    </div>
                    <span className="text-orange-600 text-xs font-bold bg-orange-100 px-3 py-1.5 rounded-full border border-orange-200">
                      URGENT
                    </span>
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
                      pendingRequests.filter((r) => r.type === "purchase-order")
                        .length
                    }
                  </p>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <MdAttachMoney className="text-2xl text-white" />
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-1 font-semibold">
                    Petty Cash Requests
                  </p>
                  <p className="text-slate-900 text-3xl font-bold">
                    {
                      pendingRequests.filter((r) => r.type === "petty-cash")
                        .length
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

            {/* Search and Filter Bar */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6 shadow-lg">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search by request ID, title, or requester..."
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
                    <option value="purchase-order">Purchase Orders</option>
                    <option value="petty-cash">Petty Cash</option>
                  </select>
                  <MdFilterList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                  <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
                </div>
              </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left Section - Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-slate-500 text-xs font-mono font-semibold">
                              {request.id}
                            </span>
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(
                                request.type
                              )}`}
                            >
                              {getTypeIcon(request.type)}
                              <span>{getTypeLabel(request.type)}</span>
                            </span>
                            {request.priority === "urgent" && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-600 border-2 border-red-200 animate-pulse">
                                <MdPriorityHigh className="text-sm" />
                                <span>URGENT</span>
                              </span>
                            )}
                          </div>
                          
                          <p className="text-slate-600 text-sm">
                            Requested by{" "}
                            <span className="text-slate-900 font-semibold">
                              {request.requester}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                            <span className="text-slate-900 font-semibold text-sm">
                              {request.department}
                            </span>
                            <MdArrowForward className="text-emerald-500" />
                            <span className="text-slate-900 font-semibold text-sm">
                              {request.destination}
                            </span>
                          </div>
                        </div>
                        {request.vessel !== "N/A" && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MdDirectionsBoat className="text-base" />
                            <span className="text-sm font-medium">
                              {request.vessel}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <HiClock className="text-base" />
                          <span className="text-sm font-medium">
                            {request.date} at {request.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-3 lg:ml-auto">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="h-10 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="h-10 px-6 bg-slate-100 border-2 border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-200 hover:border-slate-300 transition-all duration-200"
                        >
                          Details
                        </button>
                      </div>
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
          </div>
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default NewDashboard2;
