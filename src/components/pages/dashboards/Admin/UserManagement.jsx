import React, { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { IoMdAdd } from "react-icons/io";
import { MdPersonAdd, MdEdit, MdDelete, MdMoreVert } from "react-icons/md";
import { useAuth } from "../../../context/AuthContext";
import { ROLES } from "../../../utils/roles";
import { useGlobalAlert } from "../../../shared/GlobalAlert";
import { useGlobalPrompt } from "../../../shared/GlobalPrompt";

const defaultRoleTypes = Object.values(ROLES).filter(Boolean);

const accessLevels = ["User", "Admin", "Superadmin"];

// Add departments list
const departments = [
  { name: "Marine" },
  { name: "IT" },
  { name: "Account" },
  { name: "Protocol" },
  { name: "Compliance/QHSE" },
  { name: "Operations" },
  { name: "Project" },
  { name: "Purchase" },
  { name: "Store" },
  { name: "Freight" },
  { name: "HR" },
  { name: "Admin" },
];

const StatusPillSmall = ({ status }) => {
  const map = {
    active: "bg-emerald-100 text-emerald-700",
    suspended: "bg-amber-100 text-amber-700",
    locked: "bg-red-100 text-red-700",
  };
  const s = (status || "active").toString();
  const label = s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
        map[s] || "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
};

const AdminUserManagement = () => {
  const { getToken, user } = useAuth();
  const API_BASE = "https://hdp-backend-1vcl.onrender.com/api";

  // table + query state
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20); // default 20 per your request
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusTab, setStatusTab] = useState("Active"); // Active | Suspended | Locked | All
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const { showAlert } = useGlobalAlert();
  const { showPrompt } = useGlobalPrompt(); // Add this line

  useEffect(() => {
    const handleDocClick = (e) => {
      // if there's an open menu and the click is outside it, close
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionMenuId(null);
      }
      // Close role dropdown if clicking outside
      if (!e.target.closest("[data-role-dropdown]")) {
        setShowRoleDropdown(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpenActionMenuId(null);
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener("click", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const toggleActionMenu = (id) => {
    setOpenActionMenuId((prev) => (prev === id ? null : id));
  };

  const deleteUser = async (u) => {
    const id = u.userId || u.id;
    if (!id) return;
    // prevent self-delete
    const currentId = user?.userId || user?.id;
    if (currentId && currentId === id) {
      showAlert("You cannot delete your own account.");
      return;
    }
    // confirm
    const ok = await showPrompt(
      `Permanently delete user "${
        u.displayName || u.username
      }"? This action cannot be undone.`
    );
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/admin/users/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(),
      });
      // refresh list and show message
      fetchUsers({ page });
      showSuccess("User deleted successfully");
    } catch (err) {
      console.error("Delete user error:", err);
      showAlert(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  // modal / form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const blankForm = {
    username: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Requester",
    accessLevel: "User",
    department: "",
    status: "active",
    procurementScope: "",
  };
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // saving + success message
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const successTimerRef = useRef(null);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(""), 3500);
  };

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // helpers
  const getAuthHeaders = () => {
    const token = (getToken && getToken()) || user?.token || "";
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeRole = (r) => r || "Requester";
  const normalizeAccess = (a) => a || "User";

  // fetch users with server pagination
  const fetchUsers = async (opts = {}) => {
    const p = opts.page ?? page;
    const lim = opts.limit ?? limit;
    const q = (opts.search ?? query ?? "").trim();
    const status = opts.status ?? statusTab;
    const role = opts.role ?? roleFilter;
    setLoading(true);
    try {
      const params = { page: p, limit: lim, sortBy };
      if (q) params.search = q;
      // server expects lowercase statuses (docs show "active" etc)
      if (status && status !== "All") params.status = status.toLowerCase();
      if (role && role !== "All")
        params.search = (params.search ? params.search + " " : "") + role;
      const resp = await axios.get(`${API_BASE}/admin/users`, {
        params,
        headers: getAuthHeaders(),
      });
      const body = resp.data || {};
      const data = body.data || body.users || [];
      setUsers(Array.isArray(data) ? data : []);
      setPage(body.page || p || 1);
      setPages(body.pages || 1);
      setTotal(body.total || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error(
        "Failed to fetch admin users:",
        err?.response?.data || err.message || err
      );
      // fallback: keep existing users (do not clear)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, sortBy]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchUsers({ page: 1, search: query }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roleFilter, statusTab]);

  // open create modal
  const openCreate = (role = "Requester", access = "User") => {
    setEditing(null);
    setForm({ ...blankForm, role, accessLevel: access });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      username: u.username || "",
      displayName: u.displayName || u.name || "",
      email: u.email || "",
      password: "",
      confirmPassword: "",
      role: u.role || "Requester",
      accessLevel: u.accessLevel || "User",
      department: u.department || "",
      status: (u.status || "active").toString(),
      procurementScope: u.procurementScope?.type || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  // create user
  const createUser = async () => {
    setSaving(true);
    if (!form.username || !form.displayName || !form.email || !form.password) {
      setFormError("username, display name, email and password are required");
      setSaving(false);
      return;
    }
    if (form.role === "Procurement Officer" && !form.procurementScope) {
      setFormError("Procurement scope is required for Procurement Officer");
      setSaving(false);
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      setSaving(false);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match");
      setSaving(false);
      return;
    }
    setFormError("");
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        role: form.role,
        department: form.department,
        procurementScope:
          form.role === "Procurement Officer" && form.procurementScope
            ? { type: form.procurementScope }
            : undefined,
      };
      console.log("Payload:", payload);
      await axios.post(`${API_BASE}/admin/users`, payload, {
        headers: getAuthHeaders(),
      });
      setModalOpen(false);
      fetchUsers({ page: 1 });
      showSuccess("User created successfully");
    } catch (err) {
      console.error("Create user error:", err);
      setFormError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  // update user
  const updateUser = async () => {
    setSaving(true);
    if (!editing) return;
    const userId = editing.userId || editing.id || editing.userId;
    if (!userId) {
      setFormError("Invalid user selected");
      setSaving(false);
      return;
    }
    // basic validate
    if (!form.displayName || !form.email) {
      setFormError("Display name and email are required");
      setSaving(false);
      return;
    }
    if (form.role === "Procurement Officer" && !form.procurementScope) {
      setFormError("Procurement scope is required for Procurement Officer");
      setSaving(false);
      return;
    }
    if (form.password || form.confirmPassword) {
      if (form.password.length < 6) {
        setFormError("Password must be at least 6 characters");
        setSaving(false);
        return;
      }
      if (form.password !== form.confirmPassword) {
        setFormError("Passwords do not match");
        setSaving(false);
        return;
      }
    }
    setFormError("");
    try {
      const patch = {
        displayName: form.displayName,
        email: form.email,
        role: form.role,
        department: form.department,
        status: form.status,
        procurementScope:
          form.role === "Procurement Officer" && form.procurementScope
            ? { type: form.procurementScope }
            : undefined,
      };
      console.log("Patch payload:", patch);
      console.log("PATCH payload (JSON):", JSON.stringify(patch, null, 2));

      await axios.patch(
        `${API_BASE}/admin/users/${encodeURIComponent(userId)}`,
        patch,
        {
          headers: getAuthHeaders(),
        }
      );
      // optionally change password separately
      if (form.password) {
        await axios.patch(
          `${API_BASE}/admin/users/${encodeURIComponent(userId)}/password`,
          { newPassword: form.password },
          { headers: getAuthHeaders() }
        );
      }
      setModalOpen(false);
      fetchUsers({ page });
      showSuccess("User updated successfully");
    } catch (err) {
      console.error("Update user error:", err);
      setFormError(err.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  // suspend / unsuspend
  const suspendUser = async (u) => {
    const id = u.userId || u.id;
    if (!id) return;
    const ok = await showPrompt(`Suspend ${u.displayName || u.username}?`);
    if (!ok) return;
    try {
      await axios.patch(
        `${API_BASE}/admin/users/${encodeURIComponent(id)}/suspend`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchUsers({ page });
    } catch (err) {
      console.error("Suspend error:", err);
      showAlert(err?.response?.data?.message || "Failed to suspend user");
    }
  };

  const unsuspendUser = async (u) => {
    const id = u.userId || u.id;
    if (!id) return;
    try {
      await axios.patch(
        `${API_BASE}/admin/users/${encodeURIComponent(id)}/unsuspend`,
        {},
        { headers: getAuthHeaders() }
      );
      fetchUsers({ page });
      showSuccess("User unsuspended successfully");
    } catch (err) {
      console.error("Unsuspend error:", err);
      showAlert(err?.response?.data?.message || "Failed to unsuspend user");
    }
  };

  // helper display values and derived filtered list (server does main filter but we keep UI consistent)
  const filtered = users.filter((u) => {
    if (
      statusTab !== "All" &&
      (u.status || "active").toString().toLowerCase() !==
        statusTab.toLowerCase()
    )
      return false;
    if (roleFilter !== "All" && (u.role || "").toString() !== roleFilter)
      return false;
    const q = (query || "").trim().toLowerCase();
    if (!q) return true;
    return (
      (u.displayName || u.name || "") +
      " " +
      (u.email || "") +
      " " +
      (u.username || "")
    )
      .toLowerCase()
      .includes(q);
  });

  const handleSave = () => {
    if (editing) updateUser();
    else createUser();
  };

  useEffect(() => {
    if (form.role !== "Procurement Officer" && form.procurementScope) {
      setForm((f) => ({ ...f, procurementScope: "" }));
    }
  }, [form.role]);

  return (
    <div className="space-y-6">
      {/* success banner */}
      {successMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md shadow">
            {successMessage}
          </div>
        </div>
      )}
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
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">
          Users Management
        </h2>
        <p className="text-slate-500 mt-1">Manage Users</p>
      </div>
      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name, username or email..."
            className="px-4 py-2 rounded-xl border border-slate-200 w-[360px]"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200"
          >
            <option>All</option>
            {Array.from(
              new Set([
                ...defaultRoleTypes,
                ...users.map((u) => u.role || "Requester"),
              ])
            ).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 ml-3">
            {["Active", "Suspended", "Locked", "All"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusTab(s)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  statusTab === s
                    ? s === "Active"
                      ? "bg-[#036173] text-white"
                      : s === "Suspended"
                      ? "bg-amber-100 text-amber-700"
                      : s === "Locked"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-700 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openCreate("Requester", "User")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm"
          >
            <IoMdAdd /> New User
          </button>
          <button
            onClick={() => openCreate("Procurement Officer", "Admin")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#036173] to-emerald-600 text-white rounded-xl text-sm"
          >
            <MdPersonAdd /> New Admin
          </button>
        </div>
      </div>

      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-2 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 font-semibold border-b">
                <th className="text-center px-4 py-3 w-12">S/N</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Access Level</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                        <span>Loading users...</span>
                      </div>
                    ) : (
                      "No users match your criteria"
                    )}
                  </td>
                </tr>
              )}

              {filtered.map((u, idx) => (
                <tr
                  key={u.userId || u.id || idx}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                        {(u.displayName || u.name || "U")
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {u.displayName || u.name || u.username}
                        </div>
                        <div className="text-xs text-slate-500">
                          {u.email} {u.username ? `• ${u.username}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-700">
                    {u.department || "—"}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-700">
                    {u.role || "Requester"}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-700">
                    {u.accessLevel || "User"}
                  </td>

                  <td className="px-4 py-3">
                    <StatusPillSmall
                      status={(u.status || "active").toString().toLowerCase()}
                    />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleActionMenu(u.userId || u.id || idx);
                        }}
                        className="px-3 py-2 bg-white border rounded-lg text-sm inline-flex items-center gap-2"
                        aria-haspopup="true"
                        aria-expanded={
                          openActionMenuId === (u.userId || u.id || idx)
                        }
                      >
                        <span>Select action</span>
                        <MdMoreVert />
                      </button>

                      {openActionMenuId === (u.userId || u.id || idx) && (
                        <div
                          ref={actionMenuRef}
                          className="absolute left-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-1000 overflow-hidden"
                          style={{ width: 140, maxWidth: 220 }}
                        >
                          <button
                            onClick={() => {
                              openEdit(u);
                              setOpenActionMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          {(u.status || "active").toString().toLowerCase() ===
                          "active" ? (
                            <button
                              onClick={() => {
                                suspendUser(u);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                            >
                              Suspend
                            </button>
                          ) : (u.status || "active")
                              .toString()
                              .toLowerCase() === "suspended" ? (
                            <button
                              onClick={() => {
                                unsuspendUser(u);
                                setOpenActionMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                            >
                              Unsuspend
                            </button>
                          ) : null}

                          {user?.accessLevel &&
                            ["admin", "superadmin"].includes(
                              user.accessLevel.toString().toLowerCase()
                            ) &&
                            (user?.userId || user?.id) !==
                              (u.userId || u.id) && (
                              <button
                                onClick={() => {
                                  deleteUser(u);
                                  setOpenActionMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-3 px-3">
          <div className="text-xs text-slate-500">Total: {total}</div>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                if (page > 1) {
                  setPage((p) => p - 1);
                  fetchUsers({ page: page - 1 });
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
                  fetchUsers({ page: page + 1 });
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

      {/* Create / Edit Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => {
              setModalOpen(false);
              setEditing(null);
              setForm(blankForm);
              setFormError("");
            }}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-24 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#036173] to-emerald-600 text-white">
                <div className="text-lg font-semibold">
                  {editing ? "Edit User" : "Create User / Admin"}
                </div>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setEditing(null);
                    setForm(blankForm);
                    setFormError("");
                  }}
                  className="text-white/90"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded">
                    {formError}
                  </div>
                )}

                {/* show inline modal success if needed (kept for parity) */}
                {successMessage && (
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded">
                    {successMessage}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Full name</label>
                    <input
                      value={form.displayName}
                      onChange={(e) =>
                        setForm({ ...form, displayName: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Username</label>
                    <input
                      value={form.username}
                      onChange={(e) =>
                        setForm({ ...form, username: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Email</label>
                    <input
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select department</option>
                      {departments.map((d) => (
                        <option key={d.name} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative" data-role-dropdown>
                    <label className="text-xs text-slate-500">Role</label>
                    <button
                      type="button"
                      onClick={() => setShowRoleDropdown((prev) => !prev)}
                      className="w-full px-3 py-2 border rounded-lg text-sm text-left bg-white flex items-center justify-between"
                    >
                      <span>{form.role || "Select role"}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          showRoleDropdown ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {showRoleDropdown && (
                      <div
                        className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto"
                        style={{
                          position: "fixed",
                          width: "18rem",
                          zIndex: 9999,
                          marginTop: "4px",
                        }}
                      >
                        {defaultRoleTypes.map((rt) => (
                          <button
                            key={rt}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, role: rt });
                              setShowRoleDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                              form.role === rt
                                ? "bg-emerald-50 text-emerald-700 font-medium"
                                : "text-slate-700"
                            }`}
                          >
                            {rt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">
                      Access Level
                    </label>
                    <select
                      value={form.accessLevel}
                      onChange={(e) =>
                        setForm({ ...form, accessLevel: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {accessLevels.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.role === "Procurement Officer" && (
                    <div>
                      <label className="text-xs text-slate-500">
                        Procurement Scope{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.procurementScope}
                        onChange={(e) =>
                          setForm({ ...form, procurementScope: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      >
                        <option value="">Select scope</option>
                        <option value="base">Base</option>
                        <option value="jetty">Jetty</option>
                        <option value="vessel">Vessel</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">
                      Password{" "}
                      {editing ? (
                        <span className="text-xs text-slate-400">
                          (leave blank to keep)
                        </span>
                      ) : null}
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({ ...form, confirmPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={() => setShowPassword((s) => !s)}
                    />
                    Show passwords
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setModalOpen(false);
                        setEditing(null);
                        setForm(blankForm);
                        setFormError("");
                      }}
                      className="px-4 py-2 bg-white border rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg text-white ${
                        saving
                          ? "bg-slate-400 cursor-not-allowed"
                          : "bg-[#036173]"
                      }`}
                    >
                      {saving
                        ? "Saving..."
                        : editing
                        ? "Save Changes"
                        : "Create User"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUserManagement;
