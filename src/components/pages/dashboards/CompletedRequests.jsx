import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdDirectionsBoat,
  MdArrowForward,
  MdPendingActions,
   MdPriorityHigh,
  MdInventory,
  MdLocalShipping,
} from "react-icons/md";
import RequestDetailView from "../../pages/dashboards/RequestDetailView";
import { HiClock } from "react-icons/hi";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const CompletedRequests = ({ searchQuery = "", filterType = "all", onOpenDetail = () => {} }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [vessels, setVessels] = useState([]);
  const { user, getToken } = useAuth();
  const normalizedSearch = (searchQuery || "").trim().toLowerCase();
  const normalizedFilter = (filterType || "all").trim().toLowerCase();

  // Tag color helper
  const getTagColor = (tag) => {
    if (!tag) return "bg-slate-100 text-slate-600 border-slate-200";
    switch (String(tag).toLowerCase()) {
      case "shipping":
        return "bg-teal-100 text-teal-600 border-teal-200";
      case "clearing":
        return "bg-purple-100 text-purple-600 border-purple-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Tag icon helper
  const getTagIcon = (tag) => {
    if (!tag) return null;
    switch (String(tag).toLowerCase()) {
      case "shipping":
        return <MdDirectionsBoat className="text-sm" />;
      default:
        return null;
    }
  };

  // In Stock badge helpers
  const getInStockColor = () => {
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getInStockIcon = () => {
    return <MdInventory className="text-sm" />;
  };


  const filteredRequests = (requests || []).filter((req) => {
    const matchesSearch =
      !normalizedSearch ||
      (req.requestId || "").toLowerCase().includes(normalizedSearch) ||
      (req.requester?.displayName || "")
        .toLowerCase()
        .includes(normalizedSearch) ||
      (req.department || "").toLowerCase().includes(normalizedSearch);

    const reqType = (req.requestType || "").toLowerCase();

    const matchesFilter =
      normalizedFilter === "all" ||
      reqType === normalizedFilter ||
      (normalizedFilter === "pettycash" && reqType.includes("petty")) ||
      (normalizedFilter === "purchaseorder" && reqType.includes("purchase"));

    return matchesSearch && matchesFilter;
  });
  // Roles that can view all departments
  const canViewAllDepartments = [
    "head of procurement",
    "account manager",
    "managing director",
    "cfo",
    "procurement officer",
    "accounting officer",
    "delivery base",
    "delivery vessel",
    "delivery jetty",
  ].includes(user?.role?.toLowerCase());

  const departments = [
    { value: "all", label: "All Departments" },
    { value: "Marine", label: "Marine" },
    { value: "Purchase", label: "Purchase" },
    { value: "Accounting", label: "Accounting" },
    { value: "Management", label: "Management" },
    { value: "IT", label: "IT" },
    { value: "Operations", label: "Operations" },
  ];

  useEffect(() => {
    fetchCompletedRequests();
  }, [selectedDepartment]);

  useEffect(() => {
    fetchVessels();
  }, []);

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

  const fetchCompletedRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      let url = `${API_BASE_URL}/requests/completed`;

      if (canViewAllDepartments && selectedDepartment !== "all") {
        url += `?department=${selectedDepartment}`;
      } else if (!canViewAllDepartments) {
        url += `?department=${user?.department}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.data || []);
    } catch (error) {
      console.error("Error fetching completed requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getVesselName = (vesselId) => {
    const v = vessels.find((x) => x.vesselId === vesselId);
    return v?.name || vesselId;
  };

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

 const handleViewDetails = (request) => {
    if (typeof onOpenDetail === "function") {
      onOpenDetail(request);
    }
  };

  const handleBack = () => {
    setSelectedRequest(null);
  };

 

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        {canViewAllDepartments && (
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="mt-3 block w-full max-w-xs border border-slate-300 rounded-lg shadow-sm px-4 py-2 focus:ring focus:ring-emerald-200"
          >
            {departments.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading && <p>Loading completed requests...</p>}
      {!loading && filteredRequests.length === 0 && (
        <p>No completed requests found.</p>
      )}

      {!loading && filteredRequests.length > 0 && (
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

                    {/* Tag badge (shows first, when present) */}
                    {request.tag && (
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTagColor(
                          request.tag
                        )}`}
                      >
                        {getTagIcon(request.tag)}
                        <span>
                          {String(request.tag).replace(
                            /(^\w|\s\w)/g,
                            (m) => m.toUpperCase()
                          )}
                        </span>
                      </span>
                    )}

                    {/* In Stock badge */}
                    {request.items &&
                      request.items.some((it) => it && it.inStock) && (
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getInStockColor()}`}
                        >
                          {getInStockIcon()}
                          <span>In Stock</span>
                        </span>
                      )}
                        {request.isIncompleteDelivery && (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                                  <MdLocalShipping className="text-sm" />
                                  <span>Incomplete Delivery</span>
                                </span>
                              )}

                    {/* Request type badge */}
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${getTypeColor(
                        request.requestType
                      )}`}
                    >
                      {getTypeIcon(request.requestType)}
                      <span>{getTypeLabel(request.requestType)}</span>
                    </span>

                    {/* Priority/Urgent badge */}
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
                    onClick={() => handleViewDetails(request)}
                    className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedRequests;
