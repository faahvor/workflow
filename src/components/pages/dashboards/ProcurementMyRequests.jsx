// src/components/pages/dashboards/ProcurementMyRequests.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoMdSearch } from "react-icons/io";
import {
  MdFilterList,
  MdExpandMore,
  MdDirectionsBoat,
  MdArrowForward,
  MdPendingActions,
  MdShoppingCart,
  MdAttachMoney,
  MdPriorityHigh,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const ProcurementMyRequests = ({ onOpenDetail = () => {} }) => {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vessels, setVessels] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [localSearch, setLocalSearch] = useState("");
  const [localFilter, setLocalFilter] = useState("all");
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch vessels for name resolution
  const fetchVessels = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVessels(response.data.data || []);
    } catch (err) {
      console.error("Error fetching vessels:", err);
    }
  };

  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId;
  };

  const buildUrl = (p, s, f) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("limit", String(pageSize));
    params.set("sortBy", "createdAt_desc");
    if ((s || "").trim() !== "") {
      params.set("search", s.trim());
    }
    if (f && f !== "all") {
      params.set("requestType", f);
    }
    return `${API_BASE_URL}/requests/submitted?${params.toString()}`;
  };

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setError("Not authenticated");
        setRequests([]);
        return;
      }
      const url = buildUrl(page, localSearch, localFilter);
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = resp.data || {};
      setRequests(Array.isArray(data.data) ? data.data : []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch my requests", err);
      setError(err.response?.data?.message || "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVessels();
  }, []);

  useEffect(() => {
    fetchMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, localSearch, localFilter]);

  // Reset page when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [localSearch, localFilter]);

  // Get CSS color classes for request type
  const getTypeColor = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "bg-emerald-100 text-emerald-600 border-emerald-200";
      case "pettyCash":
        return "bg-teal-100 text-teal-600 border-teal-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  // Get icon component for request type
  const getTypeIcon = (type) => {
    switch (type) {
      case "purchaseOrder":
        return <MdShoppingCart className="text-sm" />;
      case "pettyCash":
        return <MdAttachMoney className="text-sm" />;
      default:
        return null;
    }
  };

  // Get human-readable label for request type
  const getTypeLabel = (type) => {
    switch (type) {
      case "purchaseOrder":
        return "Purchase Order";
      case "pettyCash":
        return "Petty Cash";
      default:
        return type;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("completed") || s.includes("approved")) {
      return "bg-green-100 text-green-700 border-green-200";
    }
    if (s.includes("rejected")) {
      return "bg-red-100 text-red-700 border-red-200";
    }
    if (s.includes("queried")) {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-orange-100 text-orange-700 border-orange-200";
  };

  const getStatusLabel = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("completed")) return "Completed";
    if (s.includes("approved")) return "Approved";
    if (s.includes("rejected")) return "Rejected";
    if (s.includes("queried")) return "Queried";
    if (s.includes("pending")) return "Pending";
    return status || "Unknown";
  };

  return (
    <div>
      {/* Search and Filter */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by request ID, department, or destination..."
              className="w-full h-12 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <select
              value={localFilter}
              onChange={(e) => setLocalFilter(e.target.value)}
              className="h-12 pl-12 pr-10 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="purchaseOrder">Purchase Orders</option>
              <option value="pettyCash">Petty Cash</option>
            </select>
            <MdFilterList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
            <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-700">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-12 text-center shadow-lg">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MdPendingActions className="text-4xl text-slate-400" />
          </div>
          <p className="text-slate-700 text-lg font-semibold">
            No requests found
          </p>
          <p className="text-slate-500 text-sm mt-2">
            You haven't created any requests yet, or try adjusting your search criteria
          </p>
        </div>
      ) : (
        <>
          {/* Requests List */}
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.requestId || request.id}
                className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-slate-500 text-xs font-mono font-semibold">
                        {request.requestId || request.id}
                      </span>

                      {/* Request Type Badge */}
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border capitalize ${getTypeColor(
                          request.requestType
                        )}`}
                      >
                        {getTypeIcon(request.requestType)}
                        <span>{getTypeLabel(request.requestType)}</span>
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(
                          request.status || request.flow?.currentState
                        )}`}
                      >
                        {getStatusLabel(request.status || request.flow?.currentState)}
                      </span>

                      {/* Priority Badge */}
                      {request.priority === "high" && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-600 border-2 border-red-200 animate-pulse">
                          <MdPriorityHigh className="text-sm" />
                          <span>URGENT</span>
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 text-sm mb-3">
                      Created by{" "}
                      <span className="text-slate-900 font-semibold">
                        {request.requester?.displayName || "You"}
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
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(request, { readOnly: true, origin: "myRequests" });
                      }}
                      className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#036173] to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} requests
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50 hover:bg-slate-200 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600 px-2">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 disabled:opacity-50 hover:bg-slate-200 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProcurementMyRequests;