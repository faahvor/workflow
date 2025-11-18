// src/components/pages/RequestDetailView.jsx

import React, { useEffect, useState } from "react";
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
import axios from "axios";

const RequestDetailView = ({
  request,
  onBack,
  onApprove,
  onReject,
  onQuery,
  actionLoading,
}) => {
  const { user } = useAuth();
  const [vessels, setVessels] = useState([]);
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";
  const { getToken } = useAuth();

  if (!request) return null;

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

  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId; // Fallback to vesselId if name not found
  };

  // Fetch vessels on mount
  useEffect(() => {
    fetchVessels();
  }, []);

  // Determine which table to show based on user role
  const renderItemsTable = () => {
    const userRole = user?.role?.toLowerCase(); // This converts to lowercase
    const items = request.items || [];

    console.log("Current user role:", userRole); // Debug log
    console.log("Request items:", items); // Debug log

    // Role-based table selection
    switch (userRole) {
      case "vesselmanager":
      case "vessel manager": // Handle space variant
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
      case "fleet manager": // Handle space variant
        return (
          <FleetManagerTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={actionLoading}
          />
        );

      case "deliverybase":
      case "delivery base": // Handle space variant
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
      case "delivery jetty": // Handle space variant
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
      case "delivery vessel": // Handle space variant
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
      default:
        // Fallback: Show a simple table for roles without specific tables
        console.warn("No specific table found for role:", userRole);
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="px-4 md:px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">
                        {item.name}
                      </p>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center">
                      <p className="text-sm text-slate-700 font-semibold">
                        {item.quantity}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
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
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Request ID
            </p>
            <p className="text-sm text-slate-900 font-semibold font-mono">
              {request.requestId}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Company</p>
            <p className="text-sm text-slate-900 font-semibold font-mono">
              {request.company || "N/A"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Requester
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.requester?.displayName || "N/A"}
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
          <div className="px-4 py-3 border-b border-r border-slate-200">
            {" "}
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Destination
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.destination}
            </p>
          </div>

          {request.vesselId && (
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Vessel
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {getVesselName(request.vesselId)}
              </p>
            </div>
          )}
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Submitted Date
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Request Type
            </p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                {request.requestType === "purchaseOrder"
                  ? "Purchase Order"
                  : "Petty Cash"}
              </span>
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Asset ID
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.assetId || "N/A"}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Job Number{" "}
            </p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                              {request.jobNumber || "N/A"}
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
          <p className="text-slate-600 text-sm">
            Review the request details and take action
          </p>
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
