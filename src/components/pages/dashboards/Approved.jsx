import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdDirectionsBoat,
  MdArrowForward,
} from "react-icons/md";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const Approved = ({
  searchQuery = "",
  filterType = "all",
  onOpenDetail = () => {},
}) => {
  const { user, getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(10);

  const normalizedSearch = (searchQuery || "").trim().toLowerCase();
  const normalizedFilter = (filterType || "all").trim().toLowerCase();

  useEffect(() => {
    fetchVessels();
  }, []);

  useEffect(() => {
    fetchApprovedRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchVessels = async () => {
    try {
      const token = getToken();
      const resp = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVessels(resp.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching vessels:", err);
    }
  };

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const url = `${API_BASE_URL}/requests/approved?page=${page}&limit=${limit}`;
      const resp = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(resp.data.data || []);
      setPages(resp.data.pages || 1);
    } catch (err) {
      console.error("❌ Error fetching approved requests:", err);
      setRequests([]);
      setPages(1);
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

  const handleViewDetails = (request) => {
    if (typeof onOpenDetail === "function") onOpenDetail(request);
  };

  return (
    <div className="p-6 md:p-8">
      {loading && <p>Loading approved requests...</p>}
      {!loading && filteredRequests.length === 0 && (
        <p>No approved requests found.</p>
      )}

      {!loading && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.requestId}
              className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-slate-500 text-xs font-mono font-semibold">
                      {request.requestId}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(
                        request.requestType
                      )}`}
                    >
                      {getTypeIcon(request.requestType)}
                      <span>{getTypeLabel(request.requestType)}</span>
                    </span>
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

      {/* Pagination controls */}
      {!loading && pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-2 bg-white border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <div className="px-4 py-2 bg-white border rounded">
            Page {page} / {pages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-2 bg-white border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Approved;
