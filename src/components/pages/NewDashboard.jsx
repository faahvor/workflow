import React, { useState } from "react";
import { IoMdMenu, IoMdClose, IoMdAdd } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdExpandMore,
  MdExpandLess,
  MdAttachFile,
  MdDirectionsBoat,
} from "react-icons/md";

const NewDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [requestsExpanded, setRequestsExpanded] = useState(false); // start COLLAPSED with UP arrow
  const [activeView, setActiveView] = useState("overview");

  // ===== New state for overview search + filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    company: "",
    vessel: "",
    department: "",
    destination: "",
    description: "",
  });
  const [items, setItems] = useState([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    itemName: "",
    quantity: "",
    unit: "",
  });

  // Dummy inventory items
  const inventoryItems = [
    "Engine Oil - Castrol 20W-50",
    "Hydraulic Fluid - Shell Tellus",
    "Air Filter - Mann C30810",
    "Fuel Filter - Parker Racor",
    "Oil Filter - Fleetguard LF3000",
    "Spark Plugs - NGK",
    "V-Belt - Gates",
    "Bearing - SKF 6205",
    "Gasket Set - Victor Reinz",
    "Coolant - Prestone",
    "Grease - Mobil XHP 222",
    "Safety Gloves",
    "Safety Goggles",
    "Life Jacket",
    "Fire Extinguisher",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (currentItem.itemName && currentItem.quantity && currentItem.unit) {
      setItems([...items, { ...currentItem, id: Date.now() }]);
      setCurrentItem({ itemName: "", quantity: "", unit: "" });
      setShowItemModal(false);
    }
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      items: items,
    };
    alert("Request submitted successfully! (This is a prototype)");
    console.log("Submission Data:", submissionData);
  };

  // Dummy data
  const pendingRequests = [
    {
      id: "REQ-001",
      title: "Engine Spare Parts",
      vessel: "MV Ocean Star",
      date: "Nov 12, 2025",
      status: "Pending",
    },
    {
      id: "REQ-002",
      title: "Navigation Equipment",
      vessel: "MV Sea Breeze",
      date: "Nov 10, 2025",
      status: "Pending",
    },
    {
      id: "REQ-003",
      title: "Safety Equipment",
      vessel: "MV Wave Rider",
      date: "Nov 08, 2025",
      status: "Pending",
    },
  ];

  const approvedRequests = [
    {
      id: "REQ-004",
      title: "Fuel Supply",
      vessel: "MV Ocean Star",
      date: "Nov 05, 2025",
      status: "Approved",
      approver: "John Smith",
    },
    {
      id: "REQ-005",
      title: "Deck Equipment",
      vessel: "MV Sea Breeze",
      date: "Nov 03, 2025",
      status: "Approved",
      approver: "Sarah Johnson",
    },
  ];

  const completedRequests = [
    {
      id: "REQ-006",
      title: "Communication System",
      vessel: "MV Wave Rider",
      date: "Oct 28, 2025",
      status: "Completed",
      completedDate: "Nov 01, 2025",
    },
    {
      id: "REQ-007",
      title: "Medical Supplies",
      vessel: "MV Ocean Star",
      date: "Oct 25, 2025",
      status: "Completed",
      completedDate: "Oct 30, 2025",
    },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        />
      </div>

      {/* Grid pattern background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial gradient fade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-72" : "w-20"
          } bg-[#1a1a1a] border-r border-gray-800/50 transition-all duration-300 flex flex-col`}
          style={{
            boxShadow: "0 0 50px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-800/50 flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">G</span>
                </div>
                <div>
                  <h1 className="text-white font-semibold text-lg">
                    Gemz Software
                  </h1>
                  <p className="text-gray-400 text-xs">Procurement Software</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800/50"
            >
              {sidebarOpen ? (
                <IoMdClose className="text-xl" />
              ) : (
                <IoMdMenu className="text-xl" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {/* Overview */}
              <button
                onClick={() => setActiveView("overview")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "overview"
                    ? "bg-gray-800/80 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdDashboard className="text-xl flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">Overview</span>}
              </button>

              {/* Requests (now a top-level item directly under Overview) */}
              {sidebarOpen && (
                <>
                  <button
                    onClick={() => setRequestsExpanded((s) => !s)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      requestsExpanded
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                    aria-expanded={requestsExpanded}
                  >
                    <MdPendingActions className="text-xl flex-shrink-0" />
                    <span className="font-medium  tracking-wider">
                      Requests
                    </span>

                    {/* right-side arrow */}
                    <span className="ml-auto">
                      {requestsExpanded ? (
                        <MdExpandMore className="text-gray-400" />
                      ) : (
                        <MdExpandLess className="text-gray-400" />
                      )}
                    </span>
                  </button>

                  {/* Sub-list (indented under Requests header) */}
                  {requestsExpanded && (
                    <div className="mt-2 pl-4 space-y-1">
                      <button
                        onClick={() => setActiveView("pending")}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                          activeView === "pending"
                            ? "bg-gray-800/80 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <MdPendingActions className="text-lg flex-shrink-0" />
                          <span className="text-sm font-normal">Pending</span>
                        </div>

                        {/* badge aligned to the right with comfortable gap */}
                        <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-lg font-semibold">
                          {pendingRequests.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveView("myrequests")}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                          activeView === "myrequests"
                            ? "bg-gray-800/80 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                        }`}
                      >
                        <MdDirectionsBoat className="text-lg flex-shrink-0" />
                        <span className="text-sm font-normal">My Requests</span>
                      </button>

                      <button
                        onClick={() => setActiveView("completed")}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                          activeView === "completed"
                            ? "bg-gray-800/80 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                        }`}
                      >
                        <MdHistory className="text-lg flex-shrink-0" />
                        <span className="text-sm font-normal">Completed</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* User Profile */}
          {sidebarOpen && (
            <div className="p-4 border-t border-gray-800/50">
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    John Doe
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    Marine Requester
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Overview - Create Request Form */}
            {activeView === "overview" && (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Overview
                  </h1>
                  <p className="text-gray-600">Requester dashboard</p>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
                        <MdDirectionsBoat className="text-2xl text-white" />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-1 font-semibold">
                      My Requests
                    </p>
                    <p className="text-slate-900 text-3xl font-bold">
                      {pendingRequests.length + approvedRequests.length}
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
                    <p className="text-slate-900 text-3xl font-bold">
                      {approvedRequests.length}
                    </p>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white/90 p-4 rounded-2xl border-2 border-slate-200 mb-6">
                  <div className="flex gap-4 flex-col md:flex-row">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search by request ID, title, or requester..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-4 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-12 pl-3 pr-8 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl"
                      >
                        <option value="all">All</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Requests list (uses pendingRequests as requested) */}
                <div className="space-y-4 mb-6">
                  {pendingRequests
                    .filter((r) => {
                      const q = searchQuery.trim().toLowerCase();
                      if (q) {
                        return (
                          r.id.toLowerCase().includes(q) ||
                          r.title.toLowerCase().includes(q) ||
                          r.vessel.toLowerCase().includes(q)
                        );
                      }
                      if (filterType === "all") return true;
                      if (filterType === "pending")
                        return r.status === "Pending";
                      if (filterType === "approved")
                        return approvedRequests.some((a) => a.id === r.id);
                      if (filterType === "completed")
                        return completedRequests.some((c) => c.id === r.id);
                      return true;
                    })
                    .map((req) => (
                      <div
                        key={req.id}
                        className="bg-white/90 p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs text-slate-500 font-mono">
                            {req.id}
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {req.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            Vessel: {req.vessel} • {req.date}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setActiveView("pending")}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
                          >
                            Review
                          </button>
                          <span className="text-xs text-orange-500 font-semibold">
                            {req.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Pending Requests */}
            {activeView === "pending" && (
              <div>
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Pending Requests
                  </h1>
                  <p className="text-gray-600">Requests awaiting approval</p>
                </div>

                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xs font-bold text-orange-600 bg-orange-100 border border-orange-200 px-3 py-1 rounded-lg">
                              {request.status}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {request.id}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Vessel: {request.vessel}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Submitted on {request.date}
                          </p>
                        </div>
                        <button className="px-4 py-2 text-sm text-slate-700 font-semibold hover:text-slate-900 border-2 border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approved Requests */}
            {activeView === "approved" && (
              <div>
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Approved Requests
                  </h1>
                  <p className="text-gray-600">
                    Requests that have been approved
                  </p>
                </div>

                <div className="space-y-4">
                  {approvedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg">
                              {request.status}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {request.id}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Vessel: {request.vessel}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Submitted on {request.date} • Approved by{" "}
                            {request.approver}
                          </p>
                        </div>
                        <button className="px-4 py-2 text-sm text-slate-700 font-semibold hover:text-slate-900 border-2 border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Requests */}
            {activeView === "completed" && (
              <div>
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Completed Requests
                  </h1>
                  <p className="text-gray-600">
                    Successfully fulfilled requests
                  </p>
                </div>

                <div className="space-y-4">
                  {completedRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white/90 backdrop-blur-xl p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg">
                              {request.status}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {request.id}
                            </span>
                          </div>
                          <h3 className="text-xl font-semibold text-slate-900 mb-1">
                            {request.title}
                          </h3>
                          <p className="text-sm text-slate-600">
                            Vessel: {request.vessel}
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Submitted on {request.date} • Completed on{" "}
                            {request.completedDate}
                          </p>
                        </div>
                        <button className="px-4 py-2 text-sm text-slate-700 font-semibold hover:text-slate-900 border-2 border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
