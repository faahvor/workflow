import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import {
  MdAdd,
  MdEdit,
  MdArchive,
  MdBuild,
  MdSearch,
  MdMoreVert,
  MdCheckCircle,
} from "react-icons/md";
import { useAuth } from "../../../context/AuthContext";
import { useGlobalAlert } from "../../../shared/GlobalAlert";
import { useGlobalPrompt } from "../../../shared/GlobalPrompt";

const StatusBadge = ({ status }) => {
  const map = {
    Active: "bg-emerald-100 text-emerald-700",
    Maintenance: "bg-amber-100 text-amber-700",
    Archived: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
};

const VesselManagement = () => {
  const { getToken, user } = useAuth();
  const API_BASE = "https://hdp-backend-1vcl.onrender.com/api";
  const { showAlert } = useGlobalAlert();
  const [vessels, setVessels] = useState([]);
  const [tab, setTab] = useState("Active"); // Active | Maintenance | Archived | All
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const { showPrompt } = useGlobalPrompt(); // Add this line

  // pagination + sort
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const [actionMenuCoords, setActionMenuCoords] = useState(null);

  // form
  const blank = {
    vesselId: "",
    name: "",
    imo: "",
    mmsi: "",
    procurementOfficerId: "",
    vesselManagerId: "",
    status: "Active",
    notes: "",
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  // fetched users for candidate lists
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = (getToken && getToken()) || user?.token || "";
    console.log(
      "[VesselManagement] getAuthHeaders token:",
      token ? "present" : "missing",
      token ? token.slice?.(0, 20) + "..." : ""
    );
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const handleDocClick = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionMenuId(null);
      }
    };
    const handleKey = (e) => {
      if (e.key === "Escape") setOpenActionMenuId(null);
    };
    document.addEventListener("click", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const toggleActionMenu = (id, anchorEl) => {
    setOpenActionMenuId((prev) => {
      const next = prev === id ? null : id;
      if (!next) {
        setActionMenuCoords(null);
        return null;
      }
      if (anchorEl && typeof anchorEl.getBoundingClientRect === "function") {
        const rect = anchorEl.getBoundingClientRect();
        // clamp width between 140 and 220 so dropdown doesn't get too wide
        const clampedWidth = Math.min(Math.max(140, rect.width), 220);
        setActionMenuCoords({
          left: rect.left,
          top: rect.bottom,
          width: clampedWidth,
        });
      } else {
        setActionMenuCoords(null);
      }
      return id;
    });
  };

  // ensure we log mount and trigger an initial fetch (helps debug network/authorization)
  useEffect(() => {
    console.log("[VesselManagement] mounted", { tab, limit, sortBy, page });
    console.log("[VesselManagement] user object:", user);
    // call fetch explicitly on mount to ensure logs appear
    fetchVessels({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fetch vessels (admin endpoint)
  const fetchVessels = async (opts = {}) => {
    const p = opts.page ?? page;
    const lim = opts.limit ?? limit;
    const q = (opts.search ?? search ?? "").trim();
    const sb = opts.sortBy ?? sortBy;
    setLoading(true);
    try {
      // Request the admin vessels endpoint - add logs to inspect result
      // (Some backends reject certain query params — removing them per request)
      console.log("[VesselManagement] fetchVessels called with", {
        page: p,
        limit: lim,
        search: q,
        sortBy: sb,
        tab,
      });
      const resp = await axios.get(`${API_BASE}/admin/vessels`, {
        headers: getAuthHeaders(),
      });
      console.log(
        "[VesselManagement] fetchVessels axios resp status:",
        resp?.status
      );
      const body = resp?.data || {};
      console.log("[VesselManagement] fetchVessels body:", body);
      const data = body.data || [];
      setVessels(Array.isArray(data) ? data : []);
      setPage(body.page || p || 1);
      setPages(body.pages || 1);
      setTotal(body.total || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error(
        "Failed to fetch vessels:",
        err?.response?.status,
        err?.response?.data || err.message || err
      );
      console.log("[VesselManagement] fetchVessels error full object:", err);
      // keep previous state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVessels({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, sortBy]);

  // debounced search & tab change
  useEffect(() => {
    const t = setTimeout(() => {
      // if tab is not All, include status filter as search term (API accepts search)
      fetchVessels({ page: 1, search });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tab]);

  // fetch candidate users (large limit) once
  const fetchUsersCandidates = async () => {
    setUsersLoading(true);
    try {
      // request up to server max (100) to retrieve candidate managers
      const usersParams = { page: 1, limit: 100 };
      console.log(
        "[VesselManagement] fetchUsersCandidates params:",
        usersParams
      );
      const resp = await axios.get(`${API_BASE}/admin/users`, {
        params: usersParams,
        headers: getAuthHeaders(),
      });
      console.log(
        "[VesselManagement] fetchUsersCandidates resp status:",
        resp?.status
      );
      const body = resp?.data || {};
      console.log("[VesselManagement] fetchUsersCandidates body:", body);
      const data = body.data || body.users || [];
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(
        "Failed to fetch users for candidates:",
        err?.response?.data || err.message || err
      );
      console.log(
        "[VesselManagement] fetchUsersCandidates error full object:",
        err
      );
      setAllUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vesselCandidates = useMemo(
    () =>
      allUsers
        .filter((u) => {
          const r = ((u.role || u.roleType || "") + "").toLowerCase();
          return r.includes("vessel manager");
        })
        .map((u) => ({
          value: u.userId || u.id,
          label: u.displayName || u.name || u.username || u.email,
        })),
    [allUsers]
  );

  // local filtered view (keeps tab filter client-side as UI expects)
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return vessels.filter((v) => {
      // compare status in a case-insensitive way (API returns lowercase like "active")
      if (
        tab !== "All" &&
        (v.status || "active").toString().toLowerCase() !==
          tab.toString().toLowerCase()
      )
        return false;
      if (!q) return true;
      return (
        (v.name || "").toLowerCase().includes(q) ||
        (v.vesselId || v.id || "").toString().toLowerCase().includes(q) ||
        (v.imo || "").toLowerCase().includes(q) ||
        (v.mmsi || "").toLowerCase().includes(q)
      );
    });
  }, [vessels, tab, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...blank,
      vesselId: `V-${Math.floor(100 + Math.random() * 900)}`,
      procurementOfficers: [],
    });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    // normalize id key
    setForm({
      vesselId: v.vesselId || v.id,
      name: v.name || "",
      imo: v.imo || "",
      mmsi: v.mmsi || "",
      procurementOfficerId:
        v.procurementOfficers?.[0]?.userId || v.procurementOfficers?.[0] || "",

      vesselManagerId:
        (v.vesselManager && (v.vesselManager.userId || v.vesselManager.id)) ||
        v.vesselManagerId ||
        "",
      status:
        (v.status || "Active").charAt(0).toUpperCase() +
        (v.status || "Active").slice(1),
      notes: v.notes || "",
    });
    setError("");
    setModalOpen(true);
  };

  const createVessel = async () => {
    setSaving(true);
    if (!form.name || !form.vesselManagerId) {
      setError("Vessel name and Vessel Manager are required.");
      setSaving(false);
      return;
    }
    setError("");
    try {
      const payload = {
        name: form.name,
        vesselManagerId: form.vesselManagerId,
        procurementOfficers: form.procurementOfficerId
          ? [form.procurementOfficerId]
          : [],
        status: form.status ? form.status.toLowerCase() : undefined,
        notes: form.notes || undefined,
      };
      await axios.post(`${API_BASE}/admin/vessels`, payload, {
        headers: getAuthHeaders(),
      });
      setModalOpen(false);
      fetchVessels({ page: 1 });
      showAlert("Vessel created successfully");
    } catch (err) {
      console.error("Create vessel error:", err);
      setError(err.response?.data?.message || "Failed to create vessel");
    } finally {
      setSaving(false);
    }
  };

  const updateVessel = async () => {
    if (!editing) return;
    const vid = editing.vesselId || editing.id;
    if (!vid) {
      setError("Invalid vessel selected");
      return;
    }
    setSaving(true);
    if (!form.name || !form.vesselManagerId) {
      setError("Vessel name and Vessel Manager are required.");
      setSaving(false);
      return;
    }
    setError("");
    try {
      const patch = {
        name: form.name,
        vesselManagerId: form.vesselManagerId,
        procurementOfficers: form.procurementOfficers,
        status: form.status ? form.status.toLowerCase() : undefined,
        notes: form.notes || undefined,
      };
      await axios.patch(
        `${API_BASE}/admin/vessels/${encodeURIComponent(vid)}`,
        patch,
        { headers: getAuthHeaders() }
      );
      setModalOpen(false);
      fetchVessels({ page });
      showAlert("Vessel updated successfully");
    } catch (err) {
      console.error("Update vessel error:", err);
      setError(err.response?.data?.message || "Failed to update vessel");
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (editing) updateVessel();
    else createVessel();
  };

  const changeStatus = async (v, newStatus) => {
    const vid = v.vesselId || v.id;
    if (!vid) return;
    const ok = await showPrompt(`Move vessel ${vid} to ${newStatus}?`);
    if (!ok) return;
    try {
      await axios.patch(
        `${API_BASE}/admin/vessels/${encodeURIComponent(vid)}`,
        { status: newStatus.toLowerCase() },
        { headers: getAuthHeaders() }
      );
      fetchVessels({ page });
      showAlert(`Vessel moved to ${newStatus}`);
    } catch (err) {
      console.error("Change status error:", err);
      showAlert(err.response?.data?.message || "Failed to change status");
    }
  };

  const remove = async (v) => {
    const vid = v.vesselId || v.id;
    if (!vid) return;

    const ok = await showPrompt(
      "Permanently remove vessel? This cannot be undone."
    );
    if (!ok) return;
    try {
      await axios.delete(
        `${API_BASE}/admin/vessels/${encodeURIComponent(vid)}`,
        { headers: getAuthHeaders() }
      );
      fetchVessels({ page: Math.max(1, page) });
      showAlert("Vessel deleted");
    } catch (err) {
      console.error("Delete vessel error:", err);
      showAlert(err.response?.data?.message || "Failed to delete vessel");
    }
  };

  // helper: accept either an id/string or a nested user object returned by the vessels API
  const getUserLabel = (userOrObj) => {
    if (!userOrObj) return "—";
    // if an object was provided directly on the vessel (preferred)
    if (typeof userOrObj === "object") {
      return (
        userOrObj.displayName ||
        userOrObj.name ||
        userOrObj.username ||
        userOrObj.userId ||
        userOrObj.id ||
        "—"
      );
    }
    // otherwise try to resolve the string/id against cached users
    const key = userOrObj.toString();
    const u =
      allUsers.find(
        (x) =>
          (x.userId && x.userId.toString() === key) ||
          (x.id && x.id.toString() === key) ||
          (x.username && x.username.toString() === key) ||
          (x.email && x.email.toString() === key)
      ) || null;
    return u ? u.displayName || u.name || u.username : "—";
  };

  // sorting by clicking headers
  const toggleSort = (field) => {
    const asc = `${field}_asc`;
    const desc = `${field}_desc`;
    setSortBy((s) => (s === asc ? desc : asc));
  };

  return (
    <div className="space-y-6">
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse pointer-events-none"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse pointer-events-none"
        style={{ animationDelay: "0.5s" }}
      />

      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Vessel Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage fleet, assign managers and control vessel lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative bg-white/90 border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-2">
            <MdSearch className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vessel"
              className="outline-none text-sm bg-transparent"
            />
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-gradient-to-r from-[#036173] to-emerald-600 text-white rounded-xl inline-flex items-center gap-2"
          >
            <MdAdd /> Add Vessel
          </button>
        </div>
      </div>

      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {["Active", "Maintenance", "Archived", "All"].map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                tab === s
                  ? "bg-[#036173] text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 font-semibold border-b">
                <th className="px-4 py-3 text-left w-12">S/N</th>
                <th
                  className="px-4 py-3 text-left cursor-pointer"
                  onClick={() => toggleSort("name")}
                >
                  Vessel{" "}
                  {sortBy.startsWith("name_")
                    ? sortBy.endsWith("_asc")
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th className="px-4 py-3 text-left">Vessel Manager</th>
                <th className="px-4 py-3 text-left">Procurement Officers</th>
                <th
                  className="px-4 py-3 text-left cursor-pointer"
                  onClick={() => toggleSort("status")}
                >
                  Status{" "}
                  {sortBy.startsWith("status_")
                    ? sortBy.endsWith("_asc")
                      ? "▲"
                      : "▼"
                    : ""}
                </th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Loading vessels...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No vessels found
                  </td>
                </tr>
              ) : (
                filtered.map((v, idx) => (
                  <tr
                    key={v.vesselId || v.id || idx}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {v.name}
                      </div>

                      <div className="text-xs text-slate-400">{v.notes}</div>
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {getUserLabel(v.vesselManager || v.vesselManagerId)}
                    </td>

                    <td className="px-4 py-3 text-sm">
                      {v.procurementOfficers &&
                      v.procurementOfficers.length > 0 ? (
                        getUserLabel(v.procurementOfficers[0])
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={
                          (v.status || "Active").charAt(0).toUpperCase() +
                          (v.status || "Active").slice(1)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-flex items-center justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActionMenu(
                              v.vesselId || v.id || idx,
                              e.currentTarget
                            );
                          }}
                          className="px-3 py-2 bg-white border rounded-lg text-sm inline-flex items-center gap-2"
                          aria-haspopup="true"
                          aria-expanded={
                            openActionMenuId === (v.vesselId || v.id || idx)
                          }
                        >
                          <span>Select action</span>
                          <MdMoreVert />
                        </button>

                        {openActionMenuId === (v.vesselId || v.id || idx) && (
                          <div
                            ref={actionMenuRef}
                            style={{
                              position: actionMenuCoords ? "fixed" : "absolute",
                              left: actionMenuCoords
                                ? actionMenuCoords.left
                                : 0,
                              top: actionMenuCoords
                                ? actionMenuCoords.top
                                : "100%",
                              // use exact width from coords and cap it with maxWidth
                              width: actionMenuCoords
                                ? actionMenuCoords.width
                                : 176,
                              maxWidth: 260,
                              zIndex: 9999,
                            }}
                            className="mt-1 bg-white border rounded-lg shadow-lg overflow-hidden"
                          >
                            <button
                              onClick={() => {
                                openEdit(v);
                                setOpenActionMenuId(null);
                                setActionMenuCoords(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            {v.status !== "Maintenance" &&
                              v.status !== "maintenance" && (
                                <button
                                  onClick={() => {
                                    changeStatus(v, "Maintenance");
                                    setOpenActionMenuId(null);
                                    setActionMenuCoords(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                                >
                                  Maintenance
                                </button>
                              )}

                            {v.status !== "Archived" &&
                              v.status !== "archived" && (
                                <button
                                  onClick={() => {
                                    changeStatus(v, "Archived");
                                    setOpenActionMenuId(null);
                                    setActionMenuCoords(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                                >
                                  Archive
                                </button>
                              )}

                            {(v.status === "Maintenance" ||
                              v.status === "maintenance" ||
                              v.status === "Archived" ||
                              v.status === "archived") && (
                              <button
                                onClick={() => {
                                  changeStatus(v, "Active");
                                  setOpenActionMenuId(null);
                                  setActionMenuCoords(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                              >
                                Activate
                              </button>
                            )}

                            <button
                              onClick={() => {
                                remove(v);
                                setOpenActionMenuId(null);
                                setActionMenuCoords(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-3 px-3">
          <div className="text-xs text-slate-500">Total: {total}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (page > 1) {
                  setPage((p) => p - 1);
                  fetchVessels({ page: page - 1 });
                }
              }}
              disabled={page <= 1}
              className="px-3 py-2 bg-white border rounded-lg"
            >
              Prev
            </button>
            <div className="px-3 py-2 text-sm">
              Page {page} / {pages}
            </div>
            <button
              onClick={() => {
                if (page < pages) {
                  setPage((p) => p + 1);
                  fetchVessels({ page: page + 1 });
                }
              }}
              disabled={page >= pages}
              className="px-3 py-2 bg-white border rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-20 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#036173] to-emerald-600 text-white">
                <div className="text-lg font-semibold">
                  {editing ? "Edit Vessel" : "Add Vessel"}
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white/90"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded">
                    {error}
                  </div>
                )}

                {/* Vessel Name and Status in one row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">
                      Vessel Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option>Active</option>
                      <option>Maintenance</option>
                      <option>Archived</option>
                    </select>
                  </div>
                </div>

                {/* Vessel Manager and Procurement Officer in one row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">
                      Vessel Manager
                    </label>
                    <select
                      value={form.vesselManagerId || ""}
                      onChange={(e) =>
                        setForm({ ...form, vesselManagerId: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Vessel Manager</option>
                      {vesselCandidates.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">
                      Procurement Officer
                      <span className="text-xs text-slate-400 ml-1">
                        (vessel scope only)
                      </span>
                    </label>
                    <select
                      value={form.procurementOfficerId || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          procurementOfficerId: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Procurement Officer</option>
                      {allUsers
                        .filter(
                          (u) =>
                            (u.role || u.roleType) === "Procurement Officer" &&
                            u.procurementScope &&
                            u.procurementScope.type === "vessel"
                        )
                        .map((u) => (
                          <option
                            key={u.userId || u.id}
                            value={u.userId || u.id}
                          >
                            {u.displayName || u.name || u.username || u.email}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-white border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-white ${
                      saving
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-[#036173]"
                    }`}
                  >
                    {saving ? "Saving..." : editing ? "Save" : "Add Vessel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VesselManagement;
