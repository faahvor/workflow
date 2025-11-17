// src/components/pages/RequestDetailView.jsx

import React from "react";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdDescription,
  MdCancel,
  MdHelp,
  MdCheckCircle,
  MdArrowBack,
} from "react-icons/md";
import RequestWorkflow from "../../shared/RequestWorkflow";
import FleetManagerTable from "../../shared/tables/FleetManagerTable";
import DeliveryBaseTable from "../../shared/tables/DeliveryBaseTable";
import DeliveryJettyTable from "../../shared/tables/DeliveryJettyTable";
import DeliveryVesselTable from "../../shared/tables/DeliveryVesselTable";
import { useAuth } from "../../context/AuthContext";
import VesselManagerTable from "../../shared/tables/VesselManagerTable";

const RequestDetailView = ({ request, onBack, onApprove, onReject, onQuery, actionLoading }) => {
  const { user } = useAuth();
  
  if (!request) return null;

  // Determine which table to show based on user role
  const renderItemsTable = () => {
    const userRole = user?.role?.toLowerCase();
    const items = request.items || [];

    // Role-based table selection
    switch (userRole) {
      case "Vessel Manager":
      case "vmanager":
        return (
          <VesselManagerTable
            items={items}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            requestId={request.requestId}
            isReadOnly={actionLoading}
          />
        );

      case "fleetmanager":
        return (
          <FleetManagerTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={actionLoading}
          />
        );

      case "deliverybase":
        return (
          <DeliveryBaseTable
            items={items}
            onEditItem={handleEditItem}
            onDeliveryQuantityChange={handleDeliveryQuantityChange}
            requestId={request.requestId}
            isReadOnly={actionLoading}
          />
        );

      case "deliveryjetty":
        return (
          <DeliveryJettyTable
            items={items}
            onEditItem={handleEditItem}
            onDeliveryQuantityChange={handleDeliveryQuantityChange}
            requestId={request.requestId}
            isReadOnly={actionLoading}
          />
        );

      case "deliveryvessel":
        return (
          <DeliveryVesselTable
            items={items}
            onEditItem={handleEditItem}
            onDeliveryQuantityChange={handleDeliveryQuantityChange}
            requestId={request.requestId}
            isReadOnly={actionLoading}
          />
        );

      // Add more role-based tables here as we create them
     
    }
  };


  // Handle edit item
  const handleEditItem = async (item) => {
    try {
      // TODO: Implement API call to edit item
      console.log("Editing item:", item);
      // You'll need to add the API endpoint here
      // const response = await axios.patch(`/api/requests/${request.requestId}/items/${item.itemId}`, item);
      return { status: 200 };
    } catch (error) {
      console.error("Error editing item:", error);
      throw error;
    }
  };

  // Handle delete item
  const handleDeleteItem = async (requestId, itemId, reason) => {
    try {
      // TODO: Implement API call to delete item
      console.log("Deleting item:", { requestId, itemId, reason });
      // You'll need to add the API endpoint here
      // const response = await axios.delete(`/api/requests/${requestId}/items/${itemId}`, { data: { reason } });
      return { status: 200 };
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  };

  // Handle delivery quantity change
  const handleDeliveryQuantityChange = (requestId, itemId, quantity) => {
    console.log("Delivery quantity changed:", { requestId, itemId, quantity });
    // TODO: Implement API call to update delivery quantity
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        <MdArrowBack className="text-xl" />
        Back to Requests
      </button>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl px-6 md:px-8 py-6 mb-8 border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="text-slate-400 text-sm font-mono font-semibold">
            {request.requestId}
          </span>
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
              request.requestType === "purchaseOrder"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                : "bg-teal-500/20 text-teal-300 border-teal-400/30"
            }`}
          >
            {request.requestType === "purchaseOrder" ? (
              <MdShoppingCart className="text-sm" />
            ) : (
              <MdAttachMoney className="text-sm" />
            )}
            <span>
              {request.requestType === "purchaseOrder" ? "Purchase Order" : "Petty Cash"}
            </span>
          </span>
        </div>
        <p className="text-slate-400 text-sm">
          Requested by{" "}
          <span className="text-white font-medium">
            {request.requester?.displayName || "N/A"}
          </span>{" "}
          on {new Date(request.createdAt).toLocaleDateString()} at{" "}
          {new Date(request.createdAt).toLocaleTimeString()}
        </p>
      </div>

      {/* Workflow Progress - Now a separate component */}
      {request.flow?.path && (
        <div className="mb-8">
          <RequestWorkflow workflowPath={request.flow.path} />
        </div>
      )}

      {/* Request Information */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Request Details
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Request ID</p>
            <p className="text-sm text-slate-900 font-semibold font-mono">
              {request.requestId}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Requester</p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.requester?.displayName || "N/A"}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Department</p>
            <p className="text-sm text-slate-900 font-semibold">{request.department}</p>
          </div>
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Destination</p>
            <p className="text-sm text-slate-900 font-semibold">{request.destination}</p>
          </div>

          {request.vesselId && (
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">Vessel</p>
              <p className="text-sm text-slate-900 font-semibold">{request.vesselId}</p>
            </div>
          )}
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Submitted Date</p>
            <p className="text-sm text-slate-900 font-semibold">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Status</p>
            <p className="text-sm text-slate-900 font-semibold">{request.status}</p>
          </div>
          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Request Type</p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                {request.requestType === "purchaseOrder" ? "Purchase Order" : "Petty Cash"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Purpose */}
      {request.purpose && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdDescription className="text-xl" />
            Purpose
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <p className="text-slate-700 leading-relaxed">{request.purpose}</p>
          </div>
        </div>
      )}

      {/* Items List - Role-based table */}
      {request.items && request.items.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdShoppingCart className="text-xl" />
            Requested Items
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
            {renderItemsTable()}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-6 md:px-8 py-6 shadow-lg sticky bottom-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">Review the request details and take action</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => onReject(request.requestId)}
              disabled={actionLoading}
              className="w-full sm:w-auto px-6 h-12 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MdCancel className="text-lg" />
              Reject
            </button>
            <button
              onClick={() => onQuery(request.requestId)}
              disabled={actionLoading}
              className="w-full sm:w-auto px-6 h-12 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              <MdHelp className="text-lg" />
              Query
            </button>
            <button
              onClick={() => onApprove(request.requestId)}
              disabled={actionLoading}
              className="w-full sm:w-auto px-6 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MdCheckCircle className="text-lg" />
              {actionLoading ? "Processing..." : "Approve Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailView;