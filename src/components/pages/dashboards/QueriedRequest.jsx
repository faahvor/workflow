import React, { useEffect, useState } from "react";
import axios from "axios";
import { IoMdSearch } from "react-icons/io";
import { MdFilterList, MdExpandMore, MdDirectionsBoat, MdPendingActions } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const QueriedRequest = ({ searchQuery = "", filterType = "all", onOpenDetail = () => {} }) => {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localFilter, setLocalFilter] = useState(filterType);

    const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId;
  };

  useEffect(() => setLocalSearch(searchQuery), [searchQuery]);
  useEffect(() => setLocalFilter(filterType), [filterType]);

  const fetchQueried = async (p = 1) => {
    try {
      setLoading(true);
      const token = getToken();
      const resp = await axios.get(`${API_BASE_URL}/requests/queried?page=${p}&limit=${pageSize}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const data = resp.data?.data || resp.data || [];
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching queried requests:", err);
      setError(err?.response?.data?.message || "Failed to fetch queried requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueried(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const filtered = (requests || []).filter((req) => {
    const matchesSearch =
      (req.requestId || "").toString().toLowerCase().includes(localSearch.toLowerCase()) ||
      (req.requester?.displayName || "").toString().toLowerCase().includes(localSearch.toLowerCase()) ||
      (req.department || "").toString().toLowerCase().includes(localSearch.toLowerCase());

    const matchesFilter =
      localFilter === "all" ||
      (req.requestType || "").toString().toLowerCase() === localFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
  
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading queried requests...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-xl text-red-700">{error}</div>
      ) : (
        <>
          <div className="space-y-4">
            {paged.map((request) => (
              <div
                key={request.requestId || request.id}
                className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-slate-500 text-xs font-mono font-semibold">
                        {request.requestId || request.id}
                      </span>
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 text-slate-700">
                        Queried
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
                        <span className="text-emerald-500">→</span>
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
                          {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onOpenDetail(request)}
                      className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#036173] to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm">
                {page} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="px-3 py-1 rounded-md bg-slate-100 disabled:opacity-50"
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

export default QueriedRequest;