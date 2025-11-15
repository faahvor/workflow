import React from "react";
import {
  IoMdClose,
  IoMdCheckmarkCircle,
  IoMdTime,
  IoMdHourglass,
} from "react-icons/io";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdDirectionsBoat,
  MdPerson,
  MdLocationOn,
  MdDescription,
  MdAttachFile,
  MdCheckCircle,
  MdCancel,
  MdHelp,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";

const RequestDetailModal = ({ request, onClose }) => {
  if (!request) return null;

  // Workflow stages
  const workflowStages = [
    {
      id: 1,
      name: "Submitted",
      status: "completed",
      icon: IoMdCheckmarkCircle,
    },
    { id: 2, name: "Procurement Review", status: "current", icon: IoMdTime },
    { id: 3, name: "Manager Approval", status: "pending", icon: IoMdHourglass },
    { id: 4, name: "Finance Approval", status: "pending", icon: IoMdHourglass },
    { id: 5, name: "Processing", status: "pending", icon: IoMdHourglass },
    { id: 6, name: "Completed", status: "pending", icon: IoMdHourglass },
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
        return "text-blue-500 bg-blue-500/10 border-blue-500/30";
      case "pending":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-6 flex items-center justify-between border-b border-slate-700/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-slate-400 text-sm font-mono">
                {request.id}
              </span>
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                  request.type === "purchase-order"
                    ? "bg-blue-500/20 text-blue-300 border-blue-400/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
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
            <p className="text-slate-400 text-sm mt-1">
              Requested by{" "}
              <span className="text-white font-medium">
                {request.requester}
              </span>{" "}
              on {request.date} at {request.time}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200"
          >
            <IoMdClose className="text-2xl" />
          </button>
        </div>

        {/* Workflow Progress */}
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">
            Request Workflow
          </h3>
          <div className="relative">
            {/* Progress Line - Behind icons */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 -z-10">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 w-1/6 transition-all duration-500" />
            </div>

            {/* Stages */}
            <div className="relative flex items-start justify-between">
              {workflowStages.map((stage, index) => {
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.id}
                    className="flex flex-col items-center z-10"
                    style={{ width: "16.666%" }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300 bg-white ${getStageColor(
                        stage.status
                      )}`}
                    >
                      <Icon className="text-xl" />
                    </div>
                    <p
                      className={`text-xs font-medium text-center leading-tight ${
                        stage.status === "completed"
                          ? "text-emerald-600"
                          : stage.status === "current"
                          ? "text-blue-600"
                          : "text-slate-400"
                      }`}
                    >
                      {stage.name}
                    </p>
                    {stage.status === "current" && (
                      <span className="mt-1 px-2 py-0.5 bg-blue-500/10 text-blue-600 text-[10px] font-semibold rounded-full">
                        IN PROGRESS
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {/* Request Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <MdPerson className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Requester
                  </p>
                  <p className="text-slate-900 font-semibold">
                    {request.requester}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <MdLocationOn className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Department Flow
                  </p>
                  <p className="text-slate-900 font-semibold">
                    {request.department} → {request.destination}
                  </p>
                </div>
              </div>
            </div>

            {request.vessel !== "N/A" && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                    <MdDirectionsBoat className="text-white text-xl" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Vessel
                    </p>
                    <p className="text-slate-900 font-semibold">
                      {request.vessel}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <HiClock className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Submitted
                  </p>
                  <p className="text-slate-900 font-semibold">
                    {request.date} at {request.time}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MdShoppingCart className="text-xl" />
              Requested Items
            </h3>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
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
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <p className="text-slate-700 leading-relaxed">
                This request is for essential maintenance supplies needed for
                the vessel's scheduled service. All items are required to meet
                safety and operational standards. Priority delivery requested
                due to upcoming voyage schedule.
              </p>
            </div>
          </div>

          {/* Attached Files */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MdAttachFile className="text-xl" />
              Attached Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-2xl">📄</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-blue-600">
                  Request Form.pdf
                </p>
                <p className="text-xs text-slate-500">245 KB</p>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-blue-600">
                  Budget Analysis.xlsx
                </p>
                <p className="text-xs text-slate-500">128 KB</p>
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-2xl">🖼️</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-blue-600">
                  Product Specs.jpg
                </p>
                <p className="text-xs text-slate-500">892 KB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-slate-50 px-8 py-6 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 h-12 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
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
  );
};

export default RequestDetailModal;
