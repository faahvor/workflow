import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { IoMdSearch } from "react-icons/io";
import {
  MdFilterList,
  MdExpandMore,
  MdCheckCircle,
  MdDirectionsBoat,
  MdDescription,
} from "react-icons/md";
import MergeTable from "../../shared/tables/MergeTable"; // add this import
const RequesterMerged = ({ searchQuery = "", filterType = "all" }) => {
  const { getToken, user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMergedRequest, setSelectedMergedRequest] = useState(null); // NEW: open details
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  console.log("RequesterMerged mounted - user role:", user?.role);
  const handleCardClick = (req) => {
    // open merged-request details panel (read-only)
    setSelectedMergedRequest(req || null);
  };
  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localFilter, setLocalFilter] = useState(filterType);

  useEffect(() => setLocalSearch(searchQuery), [searchQuery]);
  useEffect(() => setLocalFilter(filterType), [filterType]);

  const fetchMerged = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      const resp = await axios.get(`${API_BASE_URL}/requests/merged`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("fetchMerged response:", resp?.status, resp?.data);
      let items = resp.data.data || [];

      // determine role
      const role = (user?.role || "").toString().toLowerCase();
      const isAccountingLead = [
        "accountinglead",
        "accounting lead",
        "account lead",
      ].includes(role);
      console.log(
        "RequesterMerged: API returned merged count =",
        (items || []).length,
        { role, isAccountingLead }
      );

      console.log(
        "RequesterMerged: after role filter, merged count =",
        (items || []).length
      );
      setRequests(items);
      if (isAccountingLead) {
        // for Accounting Lead: exclude any request with tag === "shipping"
        items = items.filter((r) => {
          if (!r) return false;
          if (Array.isArray(r.tags) && r.tags.length) {
            return !r.tags
              .map((t) => String(t).toLowerCase())
              .includes("shipping");
          }
          const tag = (r.tag || "").toString().toLowerCase();
          return !tag.includes("shipping");
        });
      } else {
        // for other users (operations/requester): include only shipping-tagged merged requests
        items = items.filter((r) => {
          if (!r) return false;
          if (Array.isArray(r.tags) && r.tags.length) {
            return r.tags
              .map((t) => String(t).toLowerCase())
              .includes("shipping");
          }
          const tag = (r.tag || "").toString().toLowerCase();
          return tag.includes("shipping");
        });
      }

      setRequests(items);
      setError(null);
      setPage(1);
    } catch (err) {
      console.error("Error fetching merged requests:", err);
      setError(
        err.response?.data?.message || "Failed to fetch merged requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = (requests || []).filter((req) => {
    const q = (localSearch || "").toLowerCase().trim();
    const matchesSearch =
      !q ||
      (req.requestId || "").toLowerCase().includes(q) ||
      (req.requester?.displayName || "").toLowerCase().includes(q) ||
      (req.department || "").toLowerCase().includes(q);
    const matchesFilter =
      localFilter === "all" ||
      (req.requestType || "").toLowerCase() === localFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <h2 className="text-3xl font-extrabold mb-[2rem] text-slate-900">
        Merged Request
      </h2>

      {!selectedMergedRequest && (
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search merged requests..."
                className="w-full h-12 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl"
              />
            </div>
            {/* <div className="relative">
              <select
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                className="h-12 pl-12 pr-10 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl appearance-none"
              >
                <option value="all">All Types</option>
                <option value="purchaseOrder">Purchase Orders</option>
                <option value="pettycash">Petty Cash</option>
              </select>
              <MdFilterList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
              <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
            </div> */}
          </div>
        </div>
      )}

      {selectedMergedRequest ? (
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
                {selectedMergedRequest.requestId}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Company
              </p>
              <p className="text-sm text-slate-900 font-semibold font-mono">
                {selectedMergedRequest.company?.name || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Requester
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {selectedMergedRequest.requester?.displayName || "N/A"}
              </p>
            </div>
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Department
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {selectedMergedRequest.department || "N/A"}
              </p>
            </div>
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Destination
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {selectedMergedRequest.destination || "N/A"}
              </p>
            </div>

            {selectedMergedRequest.vesselId && (
              <div className="px-4 py-3 border-b border-r border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  Vessel
                </p>
                <p className="text-sm text-slate-900 font-semibold">
                  {selectedMergedRequest.vesselId}
                </p>
              </div>
            )}
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Submitted Date
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {selectedMergedRequest.createdAt
                  ? new Date(
                      selectedMergedRequest.createdAt
                    ).toLocaleDateString()
                  : ""}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Request Type
              </p>
              <p className="text-sm font-semibold">
                <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                  {selectedMergedRequest.requestType === "purchaseOrder"
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
                {selectedMergedRequest.assetId || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Logistics Type
              </p>
              <p className="text-sm text-slate-900 font-semibold capitalize">
                {selectedMergedRequest.logisticsType || "N/A"}
              </p>
            </div>
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Job Number
              </p>
              <p className="text-sm font-semibold">
                <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                  {selectedMergedRequest.jobNumber || "N/A"}
                </span>
              </p>
            </div>
          </div>

          {selectedMergedRequest.purpose && (
            <div className="mb-8 mt-[4rem]">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MdDescription className="text-xl pl-[2rem]" />
                Purpose
              </h3>
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                <p className="text-slate-700 leading-relaxed">
                  {selectedMergedRequest.purpose}
                </p>
              </div>
            </div>
          )}
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-3 pl-[2rem]">
              Moved Items
            </h4>
            <div className="bg-white/90 border rounded-lg p-4">
              <MergeTable
                movedItems={
                  Array.isArray(selectedMergedRequest.movedItems)
                    ? selectedMergedRequest.movedItems
                    : []
                }
                isReadOnly={true}
                tag={selectedMergedRequest.tag || ""}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paged.map((request) => (
              <div
                key={request.requestId || request.id}
                className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 shadow-lg transition-all duration-200 cursor-pointer opacity-90 hover:opacity-100"
                onClick={() => handleCardClick(request)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-slate-500 text-xs font-mono font-semibold">
                        {request.requestId || request.id}
                      </span>

                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 text-slate-700">
                        <MdCheckCircle className="text-sm" />
                        <span>Merged</span>
                      </span>

                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-emerald-100 text-emerald-700">
                        <span>
                          {request.requestType === "purchaseOrder"
                            ? "Purchase Order"
                            : "Petty Cash"}
                        </span>
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
                            {request.vesselId}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="text-xs md:text-sm font-medium">
                          {request.createdAt
                            ? new Date(request.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total}
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

export default RequesterMerged;
