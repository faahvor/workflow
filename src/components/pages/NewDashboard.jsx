import React, { useState, useMemo } from "react";
import { IoMdMenu, IoMdClose, IoMdAdd } from "react-icons/io";
import {
  MdDashboard,
  MdPeople,
  MdOutlineInventory,
  MdStorefront,
  MdAssessment,
  MdSettings,
  MdHistory,
  MdLock,
  MdPersonAdd,
  MdEdit,
  MdOutlineMonetizationOn,
  MdDirectionsBoat,
} from "react-icons/md";
import RequestManagement from "./RequestManagement";
import AdminLogs from "./AdminLogs";
import User from "./User";
import Vessel from "./Vessel"; // new vessel page
import SettingsPanel from "./SettingsPanel";

/*
  AdminDashboard - public prototype replacement for NewDashboard.jsx
  - Left sidebar navigation with many admin sections
  - User Management (Admins + Users) with status filters (Active / Suspended / Locked)
  - Create / Edit user modal (local mock)
  - Settings -> VAT management prototype
  - Other sidebar items show simple prototype panels on the right
  - Visual language based on NewDashboard styling
*/

const generateMockUsers = () =>
  [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@gemz.com",
      role: "Admin",
      status: "Active",
      department: "Procurement",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@gemz.com",
      role: "User",
      status: "Active",
      department: "Marine",
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "m.brown@gemz.com",
      role: "User",
      status: "Suspended",
      department: "Operations",
    },
    {
      id: 4,
      name: "Emma Davis",
      email: "emma.d@gemz.com",
      role: "Admin",
      status: "Locked",
      department: "Accounts",
    },
    {
      id: 5,
      name: "David Wilson",
      email: "d.wilson@gemz.com",
      role: "User",
      status: "Active",
      department: "IT",
    },
  ].map((u, i) => ({ ...u, id: u.id || i + 1 }));

const StatusPill = ({ status }) => {
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

const IconButton = ({ children, className = "", ...rest }) => (
  <button
    {...rest}
    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold ${className}`}
  >
    {children}
  </button>
);

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [users, setUsers] = useState(generateMockUsers());
  const [userFilterRole, setUserFilterRole] = useState("All"); // All / Admin / User
  const [userStatusTab, setUserStatusTab] = useState("Active"); // Active / Suspended / Locked
  const [query, setQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [openUserModalFor, setOpenUserModalFor] = useState(null); // triggers UserManagement modal
  const [vatRate, setVatRate] = useState(7.5); // example VAT

  // Create / Edit form state
  const blankForm = {
    name: "",
    email: "",
    role: "User",
    status: "Active",
    department: "",
  };
  const [form, setForm] = useState(blankForm);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (userFilterRole !== "All" && u.role !== userFilterRole) return false;
      if (userStatusTab && u.status !== userStatusTab) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (u.name + " " + u.email + " " + u.department)
        .toLowerCase()
        .includes(q);
    });
  }, [users, userFilterRole, userStatusTab, query]);

  // --- Prototype metrics & small UI helpers for Overview ---
  const vendorCount = 24;
  const inventoryCount = 1240;
  const reportsCount = 18;
  const logsCount = 432;
  const adminsCount = users.filter((u) => u.role === "Admin").length;
  const totalUsers = users.length;

  const Sparkline = ({ data = [2, 6, 4, 8, 6, 10], color = "#10b981" }) => (
    <svg viewBox="0 0 100 24" className="w-full h-6">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={data
          .map(
            (v, i) =>
              `${(i / (data.length - 1)) * 100},${
                24 - (v / Math.max(...data)) * 20
              }`
          )
          .join(" ")}
      />
    </svg>
  );

  const MiniStatCard = ({
    title,
    subtitle,
    value,
    icon,
    gradient = "from-[#036173] to-emerald-600",
    onClick,
  }) => (
    <button onClick={onClick} className="w-full text-left group">
      <div
        className={`bg-gradient-to-r ${gradient} text-white rounded-2xl p-5 shadow-xl transform hover:-translate-y-1 transition-all duration-200`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase opacity-90">
              {title}
            </div>
            <div className="mt-2 text-2xl font-extrabold">{value}</div>
            {subtitle && (
              <div className="mt-1 text-sm opacity-90">{subtitle}</div>
            )}
          </div>
          <div className="text-3xl opacity-90">{icon}</div>
        </div>
        <div className="mt-3 opacity-80">
          <Sparkline />
        </div>
      </div>
    </button>
  );

  const openCreate = (role = "User") => {
    setForm({ ...blankForm, role });
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const openEdit = (u) => {
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.department,
    });
    setEditingUser(u);
    setShowCreateModal(true);
  };

  const saveUser = () => {
    if (!form.name || !form.email) {
      alert("Please provide name and email");
      return;
    }
    if (editingUser) {
      setUsers((prev) =>
        prev.map((p) => (p.id === editingUser.id ? { ...p, ...form } : p))
      );
    } else {
      const id = Math.max(0, ...users.map((u) => u.id)) + 1;
      setUsers((prev) => [{ id, ...form }, ...prev]);
    }
    setShowCreateModal(false);
    setEditingUser(null);
    setForm(blankForm);
  };

  const changeUserStatus = (id, status) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
  };

  const removeUser = (id) => {
    if (!window.confirm("Remove user from system?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Sidebar items
  const navItems = [
    { id: "overview", label: "Overview", icon: <MdDashboard /> },
    { id: "users", label: "User Management", icon: <MdPeople /> },
    { id: "vessels", label: "Vessel Management", icon: <MdDirectionsBoat /> },
    { id: "vendors", label: "Vendors", icon: <MdStorefront /> },
    { id: "inventory", label: "Inventory", icon: <MdOutlineInventory /> },
    { id: "requests", label: "Request Management", icon: <MdAssessment /> },
    { id: "settings", label: "Settings", icon: <MdSettings /> },
    { id: "logs", label: "Logs", icon: <MdHistory /> },
  ];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* decorative orbs */}
      <div className="absolute top-12 left-12 w-72 h-72 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-12 right-12 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse" />

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-72" : "w-20"
          } bg-[#1a1a1a] border-r border-gray-800/50 transition-all duration-300 flex flex-col`}
        >
          <div className="p-6 border-b border-gray-800/50 flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">G</span>
                </div>
                <div>
                  <h1 className="text-white font-semibold text-lg">
                    Gemz Admin
                  </h1>
                  <p className="text-gray-400 text-xs">Admin Console</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="text-gray-400 p-2 rounded-lg hover:bg-gray-800/50"
            >
              {sidebarOpen ? (
                <IoMdClose className="text-xl" />
              ) : (
                <IoMdMenu className="text-xl" />
              )}
            </button>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              {navItems.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setActiveSection(it.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeSection === it.id
                      ? "bg-gray-800/80 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <div className="text-lg">{it.icon}</div>
                  {sidebarOpen && (
                    <span className="font-medium">{it.label}</span>
                  )}
                </button>
              ))}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  Admin User
                </p>
                <p className="text-gray-400 text-xs truncate">gemz@company</p>
              </div>
            </div>
            <button className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium text-sm transition-all duration-200 border border-red-500/20">
              Logout
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Sections */}
            

            {activeSection === "users" && (
              <User
                users={users}
                setUsers={setUsers}
                openUserModalFor={openUserModalFor}
                setOpenUserModalFor={setOpenUserModalFor}
              />
            )}

            {activeSection === "vessels" && <Vessel users={users} />}

            {activeSection === "vendors" && (
              <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Vendors (Prototype)
                </h3>
                <p className="text-slate-600">
                  Vendor management prototype content goes here — searchable
                  vendor list, onboarding flows, rating, etc.
                </p>
              </div>
            )}

            {activeSection === "inventory" && (
              <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Inventory (Prototype)
                </h3>
                <p className="text-slate-600">
                  Inventory management preview — stock levels, stores, and
                  replenishment settings.
                </p>
              </div>
            )}

            {activeSection === "requests" && <RequestManagement />}

            {activeSection === "settings" && (
              <SettingsPanel vatRate={vatRate} setVatRate={setVatRate} />
            )}

            {activeSection === "logs" && <AdminLogs />}
          </div>
        </div>
      </div>

      {/* Create / Edit User Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => {
              setShowCreateModal(false);
              setEditingUser(null);
            }}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-24 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="text-sm font-semibold">
                  {editingUser ? "Edit User" : "Create User / Admin"}
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
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
                    <label className="text-xs text-slate-500">Email</label>
                    <input
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">Role</label>
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option>User</option>
                      <option>Admin</option>
                    </select>
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
                      <option>Suspended</option>
                      <option>Locked</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Department</label>
                    <input
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingUser(null);
                    }}
                    className="px-4 py-2 bg-white border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveUser}
                    className="px-4 py-2 bg-[#036173] text-white rounded-lg"
                  >
                    {editingUser ? "Save Changes" : "Create User"}
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

export default AdminDashboard;
