// src/components/pages/dashboards/PendingRequestsList.jsx

import React, { useState, useEffect } from "react";
import {
  MdArrowForward,
  MdPriorityHigh,
  MdDirectionsBoat,
  MdShoppingCart,
  MdAttachMoney,
  MdPendingActions,
  MdInventory,
  MdLocalShipping,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const PendingRequestsList = ({
  searchQuery = "",
  filterType = "all",
  onViewDetails = () => {},
  requests = null, // If provided, use these instead of fetching
  externalLoading = false,
}) => {
  const { getToken } = useAuth();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [error, setError] = useState(null);
  // Fetch pending requests (only if not provided externally)
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

      const requests = response.data.data || [];

      // Fetch flow for each request to check procurement officer approval
      const requestsWithFlow = await Promise.all(
        requests.map(async (request) => {
          try {
            const flowResponse = await axios.get(
              `${API_BASE_URL}/requests/${request.requestId}/flow`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return { ...request, flow: flowResponse.data };
          } catch (err) {
            console.warn(`Failed to fetch flow for ${request.requestId}:`, err);
            return { ...request, flow: null };
          }
        })
      );

      setPendingRequests(requestsWithFlow);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching pending requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchPendingRequests();
    fetchVessels();
  }, []);

  // Use external requests if provided
  const displayRequests = requests !== null ? requests : pendingRequests;
  const isLoading = requests !== null ? externalLoading : loading;

  // Filter requests
  const filteredRequests = displayRequests.filter((req) => {
    const matchesSearch =
      req.requestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requester?.displayName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      req.department?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterType === "all" ||
      req.requestType?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  // Get CSS color classes for tag
  const getTagColor = (tag) => {
    if (!tag) return "bg-slate-100 text-slate-600 border-slate-200";
    switch (String(tag).toLowerCase()) {
      case "shipping":
        return "bg-teal-100 text-teal-600 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Get icon for tag
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
      case "quotation":
        return "bg-teal-100 text-teal-600 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Get icon for request type
  const getTypeIcon = (type) => {
    switch (type) {
      case "purchaseOrder":
        return <MdShoppingCart className="text-sm" />;
      case "quotation":
        return <MdAttachMoney className="text-sm" />;
      default:
        return null;
    }
  };

  // Get label for request type
  const getTypeLabel = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "Purchase Order";
      case "quotation":
        return "Quotation";
      default:
        return type;
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }
  const hasProcurementOfficerApproved = (request) => {
    const path = request?.flow?.path || [];
    const procurementStep = path.find(
      (step) => step.state === "PENDING_PROCUREMENT_OFFICER_APPROVAL"
    );
    return procurementStep?.status === "completed";
  };

  if (filteredRequests.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {filteredRequests.map((request) => (
        <div
          key={request.requestId}
          className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group"
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
                {/* Tag badge */}
                {request.tag && (
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTagColor(
                      request.tag
                    )}`}
                  >
                    {getTagIcon(request.tag)}
                    <span>
                      {String(request.tag).replace(/(^\w|\s\w)/g, (m) =>
                        m.toUpperCase()
                      )}
                    </span>
                  </span>
                )}
                {request.items &&
                  request.items.some((it) => it && it.inStock) && (
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getInStockColor()}`}
                    >
                      {getInStockIcon()}
                      <span>In Stock</span>
                    </span>
                  )}

                {hasProcurementOfficerApproved(request) && (
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${getTypeColor(
                      request.requestType
                    )}`}
                  >
                    {getTypeIcon(request.requestType)}
                    <span>{getTypeLabel(request.requestType)}</span>
                  </span>
                )}
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
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onViewDetails(request)}
                className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#036173] to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingRequestsList;
