import React, { useEffect, useMemo, useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { MdPersonAdd, MdEdit } from "react-icons/md";

/*
  User - extracted from NewDashboard
  Props:
    - users: array
    - setUsers: function
    - openUserModalFor: null | "User" | "Admin" (trigger from parent)
    - setOpenUserModalFor: setter to clear trigger
*/

const defaultRoleTypes = [
  "Requester",
  "Procurement Officer",
  "Vessel Manager",
  "IT Manager",
  "Operations Manager",
  "Accounting Officer",
  "Managing Director",
  "Equipment Manager",
  "Store Manager",
];

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
  { name: "HR" },
  { name: "Admin" },
];

const StatusPillSmall = ({ status }) => {
  const map = {
    Active: "bg-emerald-100 text-emerald-700",
    Suspended: "bg-amber-100 text-amber-700",
    Locked: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
};

const User = ({
  users = [],
  setUsers,
  openUserModalFor,
  setOpenUserModalFor,
}) => {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  // statusTab controls which users are shown; default is Active
  const [statusTab, setStatusTab] = useState("Active"); // Active | Suspended | Locked | All

  // Modal state (internal also responds to parent's trigger)
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const blankForm = {
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    roleType: "Requester",
    accessLevel: "User",
    status: "Active",
    department: "",
  };
  const [form, setForm] = useState(blankForm);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // respond to parent trigger
  useEffect(() => {
    if (openUserModalFor) {
      setModalOpen(true);
      setEditing(null);
      setForm((f) => ({
        ...blankForm,
        accessLevel: openUserModalFor === "Admin" ? "Admin" : "User",
        roleType:
          openUserModalFor === "Admin" ? "Procurement Officer" : "Requester",
      }));
      setOpenUserModalFor(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openUserModalFor]);

  // helpers: derive business role (e.g. Requester, Vessel Manager) and access level (User/Admin/Superadmin)
  const getRoleDisplay = (u) => {
    // prefer explicit roleType, otherwise if u.role contains a business role use that, else fallback to "Requester"
    if (u?.roleType) return u.roleType;
    if (u?.role && typeof u.role === "string") {
      const roleLower = u.role.toLowerCase();
      // if role looks like an access level, ignore it for business role
      if (["admin", "user", "superadmin"].includes(roleLower))
        return "Requester";
      // otherwise treat u.role as a business role
      return u.role;
    }
    return "Requester";
  };

  const getAccessDisplay = (u) => {
    // prefer explicit accessLevel, otherwise derive from u.role if it's one of the access-level keywords
    if (u?.accessLevel) return u.accessLevel;
    if (u?.role && typeof u.role === "string") {
      const roleLower = u.role.toLowerCase();
      if (roleLower === "superadmin") return "Superadmin";
      if (roleLower === "admin") return "Admin";
      if (roleLower === "user") return "User";
    }
    return "User";
  };

  // Filter users by statusTab (default Active). 'All' shows every status.
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return users.filter((u) => {
      const status = u.status || "Active";
      if (statusTab !== "All" && status !== statusTab) return false;
      const roleDisplay = getRoleDisplay(u);
      if (roleFilter !== "All" && roleDisplay !== roleFilter) return false;
      if (!q) return true;
      return (
        (u.name || "") +
        " " +
        (u.email || "") +
        " " +
        (u.username || "") +
        " " +
        roleDisplay +
        " " +
        getAccessDisplay(u)
      )
        .toLowerCase()
        .includes(q);
    });
  }, [users, query, roleFilter, statusTab]);

  const openCreateFor = (roleType = "User", access = "User") => {
    setEditing(null);
    setForm({ ...blankForm, roleType, accessLevel: access });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      username: u.username || "",
      name: u.name || "",
      email: u.email || "",
      password: "",
      confirmPassword: "",
      roleType: u.role || u.roleType || "User",
      accessLevel: u.accessLevel || "User",
      status: u.status || "Active",
      department: u.department || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const removeUser = (id) => {
    if (!window.confirm("Remove user from system?")) return;
    setUsers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    // basic validation
    if (!form.username || !form.name || !form.email) {
      setFormError("Username, full name and email are required.");
      return;
    }
    if (!editing) {
      if (!form.password || form.password.length < 6) {
        setFormError("Password required (min 6 characters) for new users.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
    } else {
      // when editing, password optional but if filled must match
      if (form.password || form.confirmPassword) {
        if (form.password.length < 6) {
          setFormError("Password must be at least 6 characters.");
          return;
        }
        if (form.password !== form.confirmPassword) {
          setFormError("Passwords do not match.");
          return;
        }
      }
    }

    setFormError("");

    if (editing) {
      setUsers((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? {
                ...p,
                username: form.username,
                name: form.name,
                email: form.email,
                role: form.roleType,
                accessLevel: form.accessLevel,
                status: form.status,
                department: form.department,
              }
            : p
        )
      );
    } else {
      const nextId = Math.max(0, ...users.map((u) => u.id || 0)) + 1;
      setUsers((prev) => [
        {
          id: nextId,
          username: form.username,
          name: form.name,
          email: form.email,
          role: form.roleType,
          accessLevel: form.accessLevel,
          status: form.status || "Active",
          department: form.department,
        },
        ...prev,
      ]);
    }

    setModalOpen(false);
    setEditing(null);
    setForm(blankForm);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Users Management</h2>
        <p className="text-sm text-slate-500 mt-1">Manage Users and Admins</p>
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
                ...users.map((u) => getRoleDisplay(u)),
              ])
            ).map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>

          {/* Status tabs: Active (default), Suspended, Locked, All */}
          <div className="flex items-center gap-2 ml-3">
            {["Active", "Suspended", "Locked"].map((s) => (
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
            onClick={() => openCreateFor("User", "User")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm"
          >
            <IoMdAdd /> New User
          </button>
          <button
            onClick={() => openCreateFor("Procurement Officer", "Admin")}
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
                <th className="text-left px-4 py-3 w-12">S/N</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Access Level</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No users match your criteria
                  </td>
                </tr>
              )}

              {filtered.map((u, idx) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  {/* Serial number */}
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                        {(u.name || "U")
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {u.name}
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
                    {getRoleDisplay(u)}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-700">
                    {getAccessDisplay(u)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="px-3 py-2 bg-white border rounded-lg text-sm"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => removeUser(u.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <div className="fixed left-1/2 -translate-x-1/2 top-20 z-50 w-[95%] max-w-2xl">
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Full name</label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
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
                  <div>
                    <label className="text-xs text-slate-500">Role Type</label>
                    <select
                      value={form.roleType}
                      onChange={(e) =>
                        setForm({ ...form, roleType: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {defaultRoleTypes.map((rt) => (
                        <option key={rt} value={rt}>
                          {rt}
                        </option>
                      ))}
                    </select>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">
                      Password{" "}
                      {editing ? (
                        <span className="text-xs text-slate-400">
                          {" "}
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
                      className="px-4 py-2 bg-[#036173] text-white rounded-lg"
                    >
                      {editing ? "Save Changes" : "Create User"}
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

export default User;
