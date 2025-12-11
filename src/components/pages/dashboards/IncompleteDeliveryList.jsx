import React, { useEffect, useState } from "react";
import { MdInventory, MdFilterList, MdExpandMore } from "react-icons/md";
import { IoMdSearch } from "react-icons/io";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const IncompleteDeliveryList = ({
  onViewDetails = () => {},
}) => {
  const { user, getToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // NEW: Local state for search/filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const fetchIncompleteDeliveries = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(
          `${API_BASE_URL}/requests/incomplete-deliveries?page=${page}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        setRequests(data.data || []);
        setPages(data.pages || 1);
        setTotal(data.total || 0);
      } catch (err) {
        setRequests([]);
      }
      setLoading(false);
    };
    fetchIncompleteDeliveries();
  }, [page, getToken]);

  // Filter and search
  const normalizedSearch = (searchQuery || "").trim().toLowerCase();
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.requestId?.toLowerCase().includes(normalizedSearch) ||
      req.status?.toLowerCase().includes(normalizedSearch) ||
      req.department?.toLowerCase().includes(normalizedSearch);

    const matchesFilter =
      filterType === "all" ||
      req.requestType?.toLowerCase() === filterType.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <div>
      <div className="flex items-center mb-4">
        <MdInventory className="text-2xl text-emerald-500 mr-2" />
        <h2 className="text-lg font-semibold">Incomplete Deliveries</h2>
      </div>

      {/* Search and Filter UI */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
            <input
              type="text"
              placeholder="Search by request ID, requester, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200"
            />
          </div>
         
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : filteredRequests.length === 0 ? (
        <div className="text-gray-400">No incomplete deliveries found.</div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => (
            <div
              key={req.requestId}
              className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200 cursor-pointer group"
              onClick={() => onViewDetails(req)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-slate-500 text-xs font-mono font-semibold">
                      {req.requestId}
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                      <MdInventory className="text-sm" />
                      <span>Incomplete Delivery</span>
                    </span>
                    {req.tag && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-100 text-slate-600 border-slate-200">
                        <span>
                          {String(req.tag).replace(/(^\w|\s\w)/g, (m) =>
                            m.toUpperCase()
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                <p className="text-slate-600 text-sm mb-3">
                Requested by{" "}
                <span className="text-slate-900 font-semibold">
                  {req.requester?.displayName || "N/A"}
                </span>
              </p>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm">
                    <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                      <span className="text-slate-900 font-semibold text-xs md:text-sm">
                        {req.department}
                      </span>
                      <span className="text-slate-900 font-semibold text-xs md:text-sm">
                        {req.destination}
                      </span>
                    </div>
                    {req.vesselId && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MdInventory className="text-base" />
                        <span className="text-xs md:text-sm font-medium">
                          {req.vesselId}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-xs md:text-sm font-medium">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onViewDetails(req)}
                    className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#036173] to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 rounded bg-gray-700 text-gray-200 disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-gray-400 text-sm">
          Page {page} of {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          className="px-3 py-1 rounded bg-gray-700 text-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default IncompleteDeliveryList;