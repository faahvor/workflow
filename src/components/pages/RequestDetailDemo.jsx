import React, { useState } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdShoppingCart,
  MdAttachMoney,
  MdDirectionsBoat,
  MdPerson,
  MdLocationOn,
  MdDescription,
  MdAttachFile,
  MdCancel,
  MdHelp,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";

const RequestDetailDemo = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Demo request data
  const request = {
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
  };

  // Workflow stages
  const workflowStages = [
    { id: 1, name: "Submitted", status: "completed" },
    { id: 2, name: "Procurement Review", status: "current" },
    { id: 3, name: "Manager Approval", status: "pending" },
    { id: 4, name: "Finance Approval", status: "pending" },
    { id: 5, name: "Processing", status: "pending" },
    { id: 6, name: "Completed", status: "pending" },
  ];

  // Sample items
  const requestItems = [
    {
      id: 1,
      name: "Marine Engine Oil SAE 40",
      quantity: 50,
      unit: "liters",
      unitPrice: "$85.00",
      total: "$4,250.00",
    },
    {
      id: 2,
      name: "Oil Filter - Premium Grade",
      quantity: 24,
      unit: "pieces",
      unitPrice: "$45.00",
      total: "$1,080.00",
    },
    {
      id: 3,
      name: "Fuel Filter Assembly",
      quantity: 12,
      unit: "sets",
      unitPrice: "$120.00",
      total: "$1,440.00",
    },
    {
      id: 4,
      name: "Air Filter Element",
      quantity: 18,
      unit: "pieces",
      unitPrice: "$65.00",
      total: "$1,170.00",
    },
    {
      id: 5,
      name: "Hydraulic Oil ISO 68",
      quantity: 100,
      unit: "liters",
      unitPrice: "$75.00",
      total: "$7,500.00",
    },
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
                <p className="text-gray-400 text-xs">Request Details</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
                <MdDashboard className="text-xl shrink-0" />
                <span className="font-medium text-sm">Overview</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <MdPendingActions className="text-xl shrink-0" />
                <span className="font-medium text-sm">Request Details</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
                <MdCheckCircle className="text-xl shrink-0" />
                <span className="font-medium text-sm">Approved</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
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
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl px-8 py-6 mb-8 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-slate-400 text-sm font-mono font-semibold">
                  {request.id}
                </span>
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                    request.type === "purchase-order"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                      : "bg-teal-500/20 text-teal-300 border-teal-400/30"
                  }`}
                >
                  {request.type === "purchase-order" ? (
                    <MdShoppingCart className="text-sm" />
                  ) : (
                    <MdAttachMoney className="text-sm" />
                  )}
                  <span>
                    {request.type === "purchase-order"
                      ? "Purchase Order"
                      : "Petty Cash"}
                  </span>
                </span>
                {request.priority === "urgent" && (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse">
                    <span>⚠️ URGENT</span>
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                Requested by{" "}
                <span className="text-white font-medium">
                  {request.requester}
                </span>{" "}
                on {request.date} at {request.time}
              </p>
            </div>

            {/* Workflow Progress */}
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
                  {workflowStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className="flex flex-col items-center z-10"
                      style={{ width: "16.666%" }}
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

            {/* Request Information - Compact Table Layout */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-8">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Request Details
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {/* Row 1 */}
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Request ID
                  </p>
                  <p className="text-sm text-slate-900 font-semibold font-mono">
                    {request.id}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Requester
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.requester}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Department
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.department}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Destination
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.destination}
                  </p>
                </div>

                {/* Row 2 */}
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Vessel
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.vessel}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Submitted Date
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.date}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Submitted Time
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.time}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Status
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    Pending Review
                  </p>
                </div>

                {/* Row 3 */}
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Priority
                  </p>
                  <p className="text-sm font-semibold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        request.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {request.priority === "urgent" ? "URGENT" : "Normal"}
                    </span>
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Request Type
                  </p>
                  <p className="text-sm font-semibold">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                      {request.type === "purchase-order"
                        ? "Purchase Order"
                        : "Petty Cash"}
                    </span>
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Company
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    HWFP Marine Services
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Cost Center
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    CC-2024-1105
                  </p>
                </div>

                {/* Row 4 */}
                <div className="px-4 py-3 border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Budget Code
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    BDG-MAR-Q4
                  </p>
                </div>
                <div className="px-4 py-3 border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Approval Level
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    Level 2 (Manager)
                  </p>
                </div>
                <div className="px-4 py-3 border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Delivery Required
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    Within 7 Days
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Currency
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    NGN (₦)
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MdShoppingCart className="text-xl" />
                Requested Items
              </h3>
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Item Description
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requestItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-slate-900">
                              {item.name}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-sm text-slate-700 font-semibold">
                              {item.quantity}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-slate-700">
                              {item.unitPrice}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {item.total}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900 text-white">
                        <td
                          colSpan="4"
                          className="px-6 py-4 text-right font-bold"
                        >
                          Grand Total:
                        </td>
                        <td className="px-6 py-4 text-right text-xl font-bold">
                          {request.amount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MdDescription className="text-xl" />
                Additional Notes
              </h3>
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                <p className="text-slate-700 leading-relaxed">
                  This request is for essential maintenance supplies needed for
                  the vessel's scheduled service. All items are required to meet
                  safety and operational standards. Priority delivery requested
                  due to upcoming voyage schedule.
                </p>
              </div>
            </div>

            {/* Attached Files */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MdAttachFile className="text-xl" />
                Attached Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group shadow-lg">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">📄</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-emerald-600">
                    Request Form.pdf
                  </p>
                  <p className="text-xs text-slate-500">245 KB</p>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group shadow-lg">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-emerald-600">
                    Budget Analysis.xlsx
                  </p>
                  <p className="text-xs text-slate-500">128 KB</p>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group shadow-lg">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-emerald-600">
                    Product Specs.jpg
                  </p>
                  <p className="text-xs text-slate-500">892 KB</p>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-8 py-6 shadow-lg sticky bottom-0">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-slate-600 text-sm">
                  Review the request details and take action
                </p>
                <div className="flex items-center gap-3">
                  <button className="px-6 h-12 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center gap-2">
                    <MdCancel className="text-lg" />
                    Reject
                  </button>
                  <button className="px-6 h-12 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/20">
                    <MdHelp className="text-lg" />
                    Query
                  </button>
                  <button className="px-6 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 flex items-center gap-2">
                    <MdCheckCircle className="text-lg" />
                    Approve Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailDemo;
