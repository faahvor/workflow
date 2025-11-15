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
  const [requestsExpanded, setRequestsExpanded] = useState(true);
  const [activeView, setActiveView] = useState("overview");
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

              {/* Requests Section */}
              <div className="mt-6">
                {sidebarOpen && (
                  <button
                    onClick={() => setRequestsExpanded(!requestsExpanded)}
                    className="w-full flex items-center justify-between px-4 py-2 text-gray-500 hover:text-gray-300 transition-colors text-xs uppercase tracking-wider font-semibold"
                  >
                    <span>Requests</span>
                    {requestsExpanded ? <MdExpandLess /> : <MdExpandMore />}
                  </button>
                )}

                {requestsExpanded && (
                  <div className="space-y-1 mt-2">
                    <button
                      onClick={() => setActiveView("pending")}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeView === "pending"
                          ? "bg-gray-800/80 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      <MdPendingActions className="text-xl flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">Pending</span>
                      )}
                      {sidebarOpen && (
                        <span className="ml-auto bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-lg font-semibold">
                          {pendingRequests.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveView("approved")}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeView === "approved"
                          ? "bg-gray-800/80 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      <MdCheckCircle className="text-xl flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">Approved</span>
                      )}
                      {sidebarOpen && (
                        <span className="ml-auto bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-lg font-semibold">
                          {approvedRequests.length}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveView("completed")}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeView === "completed"
                          ? "bg-gray-800/80 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }`}
                    >
                      <MdHistory className="text-xl flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="font-medium">Completed</span>
                      )}
                      {sidebarOpen && (
                        <span className="ml-auto bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-lg font-semibold">
                          {completedRequests.length}
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
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
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Overview
                  </h1>
                  <p className="text-gray-600">
                    Create a new request for your vessel
                  </p>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border-2 border-slate-200 shadow-xl"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                      Create New Request
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Fill in the details below to submit your request
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wider pl-0.5">
                        Company Name
                      </label>
                      <div className="relative">
                        <select
                          name="company"
                          value={formData.company}
                          onChange={handleInputChange}
                          className="w-full h-12 px-4 pr-10 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none"
                        >
                          <option value="">Select Company</option>
                          <option value="HWFP Marine Services">
                            HWFP Marine Services
                          </option>
                          <option value="Ocean Logistics Ltd">
                            Ocean Logistics Ltd
                          </option>
                          <option value="Blue Wave Shipping">
                            Blue Wave Shipping
                          </option>
                          <option value="Maritime Solutions Inc">
                            Maritime Solutions Inc
                          </option>
                        </select>
                        <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wider pl-0.5">
                        Vessel
                      </label>
                      <div className="relative">
                        <select
                          name="vessel"
                          value={formData.vessel}
                          onChange={handleInputChange}
                          className="w-full h-12 px-4 pr-10 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none"
                        >
                          <option value="">Select Vessel</option>
                          <option value="MV Ocean Star">MV Ocean Star</option>
                          <option value="MV Sea Breeze">MV Sea Breeze</option>
                          <option value="MV Wave Rider">MV Wave Rider</option>
                          <option value="MV Atlantic Pride">
                            MV Atlantic Pride
                          </option>
                          <option value="MV Pacific Explorer">
                            MV Pacific Explorer
                          </option>
                        </select>
                        <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wider pl-0.5">
                        Department
                      </label>
                      <div className="relative">
                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleInputChange}
                          className="w-full h-12 px-4 pr-10 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none"
                        >
                          <option value="">Select Department</option>
                          <option value="Marine">Marine</option>
                          <option value="IT">IT</option>
                          <option value="Operations">Operations</option>
                          <option value="Project">Project</option>
                        </select>
                        <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wider pl-0.5">
                        Destination
                      </label>
                      <div className="relative">
                        <select
                          name="destination"
                          value={formData.destination}
                          onChange={handleInputChange}
                          className="w-full h-12 px-4 pr-10 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none"
                        >
                          <option value="">Select Destination</option>
                          <option value="Marine">Marine</option>
                          <option value="IT">IT</option>
                          <option value="Operations">Operations</option>
                          <option value="Project">Project</option>
                        </select>
                        <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xl" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-400 mb-2.5 uppercase tracking-wider pl-0.5">
                        Items from Inventory
                      </label>

                      {/* Added Items List */}
                      {items.length > 0 && (
                        <div className="mb-4 space-y-2">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-3 bg-slate-50 border-2 border-slate-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-slate-900 text-sm font-medium">
                                  {item.itemName}
                                </p>
                                <p className="text-slate-600 text-xs">
                                  Quantity: {item.quantity} {item.unit}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-700 text-xs font-medium px-3 py-1 rounded-lg hover:bg-red-100 transition-all duration-200"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowItemModal(true)}
                        className="w-full h-12 px-4 text-sm font-semibold text-emerald-600 bg-emerald-100 border-2 border-emerald-200 rounded-xl hover:bg-emerald-200 transition-all duration-200 flex items-center justify-center space-x-2"
                      >
                        <IoMdAdd className="text-lg" />
                        <span>Add Item from Inventory</span>
                      </button>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wider pl-0.5">
                        Additional Notes
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Any additional information or special instructions..."
                        rows="3"
                        className="w-full px-4 py-3 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 resize-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wider pl-0.5">
                        Attach Files
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 transition-all duration-200 cursor-pointer bg-slate-50">
                        <MdAttachFile className="text-3xl text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600 text-sm mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-slate-500 text-xs">
                          PDF, DOC, XLS, PNG, JPG (Max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Item Modal */}
                  {showItemModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-xl font-semibold text-slate-900 mb-4">
                          Add Item from Inventory
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                              Select Item
                            </label>
                            <select
                              name="itemName"
                              value={currentItem.itemName}
                              onChange={handleItemChange}
                              className="w-full h-11 px-4 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                            >
                              <option value="">Choose from inventory</option>
                              {inventoryItems.map((item, index) => (
                                <option key={index} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                              Quantity
                            </label>
                            <input
                              type="number"
                              name="quantity"
                              value={currentItem.quantity}
                              onChange={handleItemChange}
                              placeholder="Enter quantity"
                              className="w-full h-11 px-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                              Unit
                            </label>
                            <select
                              name="unit"
                              value={currentItem.unit}
                              onChange={handleItemChange}
                              className="w-full h-11 px-4 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400"
                            >
                              <option value="">Select unit</option>
                              <option value="pieces">Pieces</option>
                              <option value="liters">Liters</option>
                              <option value="kg">Kilograms</option>
                              <option value="meters">Meters</option>
                              <option value="boxes">Boxes</option>
                              <option value="sets">Sets</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mt-6">
                          <button
                            type="button"
                            onClick={addItem}
                            className="flex-1 h-11 px-4 text-sm font-semibold text-[#0a0a0a] bg-white rounded-lg hover:bg-gray-50 transition-all duration-200"
                          >
                            Add Item
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowItemModal(false);
                              setCurrentItem({
                                itemName: "",
                                quantity: "",
                                unit: "",
                              });
                            }}
                            className="px-6 h-11 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex items-center space-x-4">
                    <button
                      type="submit"
                      className="flex-1 h-12 px-6 text-sm font-semibold text-[#0a0a0a] bg-white rounded-xl transition-all duration-200 shadow-sm hover:bg-gray-50 active:scale-[0.98] hover:shadow-md flex items-center justify-center space-x-2"
                    >
                      <IoMdAdd className="text-lg" />
                      <span>Submit Request</span>
                    </button>
                    <button
                      type="button"
                      className="px-6 h-12 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
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
