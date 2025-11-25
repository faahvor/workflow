import React, { useState } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdPerson,
  MdAdd,
  MdDelete,
  MdEdit,
  MdBusiness,
  MdPhone,
  MdLocationOn,
  MdListAlt,
  MdHowToReg,
  MdFilterList,
  MdSearch,
} from "react-icons/md";

const initialRegistered = [
  {
    id: "v-001",
    name: "Oceanic Logistics Ltd",
    department: "Marine",
    type: "registered",
    phone: "0801-555-0101",
    address: "12 Harbor Lane, Port City",
    serviceType: "Logistics",
  },
  {
    id: "v-002",
    name: "Atlantic Supplies",
    department: "Marine",
    type: "registered",
    phone: "0801-555-0202",
    address: "3 Wharf Blvd, Dockside",
    serviceType: "Spare Parts",
  },
];

const initialSundry = [
  {
    id: "s-001",
    name: "Sundry Co. Lagos",
    phone: "0801-555-0303",
    address: "Market Road, Lagos",
  },
  {
    id: "s-002",
    name: "QuickFix Supplies",
    phone: "0801-555-0404",
    address: "Industrial Estate, Apapa",
  },
];

const VendorPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [registered, setRegistered] = useState(initialRegistered);
  const [sundry, setSundry] = useState(initialSundry);
  const [editingVendor, setEditingVendor] = useState(null);
  // active tab (registered | sundry) - default to Registered Table
  const [activeTab, setActiveTab] = useState("registered");
  // when registering from sundry, remember the source sundry id so we can remove it after saving
  const [sourceSundryId, setSourceSundryId] = useState(null);

  // Add form state
  const [form, setForm] = useState({
    name: "New Logistics Vendor",
    department: "Marine",
    type: "registered",
    phone: "555-123-4567",
    address: "456 Main St, City",
    serviceType: "Logistics",
  });

  const resetForm = () =>
    setForm({
      name: "New Logistics Vendor",
      department: "Marine",
      type: "registered",
      phone: "555-123-4567",
      address: "456 Main St, City",
      serviceType: "Logistics",
    });

  // Ensure registered vendors have contract dates on mount (prototype: 365 days)
  React.useEffect(() => {
    setRegistered((prev) =>
      prev.map((v) => {
        if (!v.contractStart || !v.contractEnd) {
          const start = new Date();
          const end = new Date(start);
          end.setDate(start.getDate() + 365);
          return {
            ...v,
            contractStart: v.contractStart || start.toISOString(),
            contractEnd: v.contractEnd || end.toISOString(),
          };
        }
        return v;
      })
    );
  }, []);

  const daysRemaining = (isoDate) => {
    try {
      const end = new Date(isoDate);
      const now = new Date();
      const diff = end - now;
      return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
    } catch {
      return 0;
    }
  };

  const handleAddVendor = () => {
    const id = `v-${Date.now().toString().slice(-6)}`;
    // contract dates for prototype (365 days from now)
    const start = new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + 365);

    const newVendor = {
      id,
      ...form,
      contractStart: start.toISOString(),
      contractEnd: end.toISOString(),
    };

    if (form.type === "registered") {
      setRegistered((p) => [newVendor, ...p]);
      // if this add was triggered from a sundry registration, remove the sundry entry
      if (sourceSundryId) {
        setSundry((p) => p.filter((s) => s.id !== sourceSundryId));
        setSourceSundryId(null);
      }
    } else {
      setSundry((p) => [newVendor, ...p]);
    }
    resetForm();
    setShowAdd(false);
  };

  const handleDelete = (id, type = "registered") => {
    const ok = window.confirm("Delete vendor? This action cannot be undone.");
    if (!ok) return;
    if (type === "registered")
      setRegistered((p) => p.filter((v) => v.id !== id));
    else setSundry((p) => p.filter((v) => v.id !== id));
  };

  const openEdit = (vendor, type = "registered") => {
    setEditingVendor({ ...vendor, _type: type });
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editingVendor) return;
    const { id, _type, ...rest } = editingVendor;
    if (_type === "registered") {
      setRegistered((p) => p.map((v) => (v.id === id ? { id, ...rest } : v)));
    } else {
      setSundry((p) => p.map((v) => (v.id === id ? { id, ...rest } : v)));
    }
    setShowEdit(false);
    setEditingVendor(null);
  };

  // When user clicks "Register" on a sundry supplier, open Add Vendor modal prefilled.
  const handleRegisterSundry = (id) => {
    const item = sundry.find((s) => s.id === id);
    if (!item) return;
    setForm({
      name: item.name || "",
      department: "", // sundry typically has no department by default
      type: "registered",
      phone: item.phone || "",
      address: item.address || "",
      serviceType: "Sundry",
    });
    setSourceSundryId(id);
    setShowAdd(true);
    // switch view to Registered so user knows what they're creating
    setActiveTab("registered");
  };

  const stats = {
    totalRegistered: registered.length,
    totalSundry: sundry.length,
    activeContracts: registered.filter((r) => r.serviceType).length,
  };

  const filteredRegistered = registered.filter((v) =>
    `${v.name} ${v.address} ${v.phone}`
      .toLowerCase()
      .includes(filterQuery.toLowerCase())
  );
  const filteredSundry = sundry.filter((v) =>
    `${v.name} ${v.address} ${v.phone}`
      .toLowerCase()
      .includes(filterQuery.toLowerCase())
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated orbs & background like NewDashboard */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        />
      </div>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full">
        {/* Sidebar - same style as NewDashboard */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#1a1a1a] border-r border-gray-800/50 transform transition-transform duration-300 ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="p-6 border-b border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Gemz Software</h1>
                <p className="text-gray-400 text-xs">Vendor Management</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50">
                <MdDashboard className="text-xl" />
                <span className="font-medium text-sm">Overview</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
                <MdListAlt className="text-xl" />
                <span className="font-medium text-sm">Vendors</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50">
                <MdHistory className="text-xl" />
                <span className="font-medium text-sm">Activity</span>
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                VM
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  Vendor Manager
                </p>
                <p className="text-gray-400 text-xs truncate">
                  vendor@gemz.com
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* mobile toggle */}
        <button
          onClick={() => setIsSidebarOpen((s) => !s)}
          className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white"
        >
          {isSidebarOpen ? (
            <IoMdClose className="text-2xl" />
          ) : (
            <IoMdMenu className="text-2xl" />
          )}
        </button>

        {/* Main content */}
        <main className="flex-1 overflow-auto ml-0  p-8">
          {/* Make content span full available width (no centered max-width) */}
          <div className="w-full">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  Vendors
                </h2>
                <p className="text-slate-500 mt-1">
                  Manage registered vendors and sundry suppliers
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-3 text-slate-400 text-lg" />
                  <input
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search vendors..."
                    className="pl-10 pr-4 h-11 rounded-xl border-2 border-slate-200 bg-slate-50"
                  />
                </div>

                <button
                  onClick={() => setShowAdd(true)}
                  className="px-4 py-2 bg-[#036173] text-white rounded-xl flex items-center gap-2 shadow-lg"
                >
                  <MdAdd /> Add Vendor
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                role="button"
                onClick={() => setActiveTab("registered")}
                className={`cursor-pointer ${
                  activeTab === "registered"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "bg-white/90 backdrop-blur-xl border-2 border-slate-200"
                } rounded-2xl p-6 flex items-center gap-4 transition`}
              >
                <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl text-emerald-600">
                  <MdBusiness />
                </div>
                <div>
                  <div className="text-xs text-slate-500">
                    Registered Vendors
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      activeTab === "registered"
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {stats.totalRegistered}
                  </div>
                </div>
              </div>

              <div
                role="button"
                onClick={() => setActiveTab("sundry")}
                className={`cursor-pointer ${
                  activeTab === "sundry"
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg"
                    : "bg-white/90 backdrop-blur-xl border-2 border-slate-200"
                } rounded-2xl p-6 flex items-center gap-4 transition`}
              >
                <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl text-yellow-600">
                  <MdListAlt />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Sundry Suppliers</div>
                  <div
                    className={`text-2xl font-bold ${
                      activeTab === "sundry" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {stats.totalSundry}
                  </div>
                </div>
              </div>

              <div
                className={`bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg flex items-center gap-4`}
              >
                <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl text-purple-600">
                  <MdCheckCircle />
                </div>
                <div>
                  <div className="text-xs text-slate-500">Active Contracts</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.activeContracts}
                  </div>
                </div>
              </div>
            </div>

            {/* Tables - show registered or sundry depending on activeTab */}
            {activeTab === "registered" ? (
              <section className="mb-8">
                {/* Registered Vendors Table */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MdBusiness /> Registered Vendors
                  </h3>
                  <div className="text-xs text-slate-500">
                    Manage suppliers you work with
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Address</th>
                        <th className="px-4 py-3">Contract (days left)</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRegistered.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                                {v.name
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {v.name}
                                </div>
                                <div className="text-xs text-slate-400">
                                  ID: {v.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{v.serviceType}</td>
                          <td className="px-4 py-3">{v.phone}</td>
                          <td className="px-4 py-3">{v.address}</td>
                          <td className="px-4 py-3">
                            {v.contractEnd ? (
                              <span className="text-sm font-medium text-slate-900">
                                {daysRemaining(v.contractEnd)} days
                              </span>
                            ) : (
                              <span className="text-sm text-slate-500">
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEdit(v, "registered")}
                                className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2"
                              >
                                <MdEdit /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(v.id, "registered")}
                                className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
                              >
                                <MdDelete /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredRegistered.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No registered vendors found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              /* Sundry Suppliers Table (compact: only name + actions) */
              <section className="mb-16">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MdListAlt /> Sundry Suppliers
                  </h3>
                  <div className="text-xs text-slate-500">
                    Register or remove temporary suppliers
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-500">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSundry.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold">{s.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRegisterSundry(s.id)}
                                className="px-3 py-1 rounded-md bg-[#036173] text-white hover:bg-[#024f57] flex items-center gap-2"
                              >
                                <MdHowToReg /> Register
                              </button>
                              <button
                                onClick={() => handleDelete(s.id, "sundry")}
                                className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
                              >
                                <MdDelete /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredSundry.length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-8 text-center text-slate-500"
                          >
                            No sundry suppliers found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Add Vendor Slide-over Modal */}
            {showAdd && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => {
                    setShowAdd(false);
                    setSourceSundryId(null);
                  }}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[720px] p-6 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Add Vendor</h3>
                    <button
                      onClick={() => {
                        setShowAdd(false);
                        setSourceSundryId(null);
                      }}
                      className="p-2"
                    >
                      <IoMdClose />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">Name</label>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Department
                      </label>
                      <input
                        value={form.department}
                        onChange={(e) =>
                          setForm({ ...form, department: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Type</label>
                      <select
                        value={form.type}
                        onChange={(e) =>
                          setForm({ ...form, type: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="registered">Registered</option>
                        <option value="sundry">Sundry (Unregistered)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Phone</label>
                      <input
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500">Address</label>
                      <input
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500">
                        Service Type
                      </label>
                      <input
                        value={form.serviceType}
                        onChange={(e) =>
                          setForm({ ...form, serviceType: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        resetForm();
                        setShowAdd(false);
                        setSourceSundryId(null);
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddVendor}
                      className="px-4 py-2 rounded-lg bg-[#036173] text-white"
                    >
                      Add Vendor
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Vendor Modal */}
            {showEdit && editingVendor && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setShowEdit(false)}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[680px] p-6 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Edit Vendor</h3>
                    <button onClick={() => setShowEdit(false)} className="p-2">
                      <IoMdClose />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">Name</label>
                      <input
                        value={editingVendor.name}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Department
                      </label>
                      <input
                        value={editingVendor.department || ""}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            department: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Phone</label>
                      <input
                        value={editingVendor.phone || ""}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Service Type
                      </label>
                      <input
                        value={editingVendor.serviceType || ""}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            serviceType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-slate-500">Address</label>
                      <input
                        value={editingVendor.address || ""}
                        onChange={(e) =>
                          setEditingVendor({
                            ...editingVendor,
                            address: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowEdit(false);
                        setEditingVendor(null);
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 rounded-lg bg-[#036173] text-white"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Vendor Slide-over Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowAdd(false);
              setSourceSundryId(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[720px] p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add Vendor</h3>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setSourceSundryId(null);
                }}
                className="p-2"
              >
                <IoMdClose />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
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
              <div>
                <label className="text-xs text-slate-500">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="registered">Registered</option>
                  <option value="sundry">Sundry (Unregistered)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Address</label>
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Service Type</label>
                <input
                  value={form.serviceType}
                  onChange={(e) =>
                    setForm({ ...form, serviceType: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowAdd(false);
                  setSourceSundryId(null);
                }}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVendor}
                className="px-4 py-2 rounded-lg bg-[#036173] text-white"
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEdit && editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowEdit(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[680px] p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Vendor</h3>
              <button onClick={() => setShowEdit(false)} className="p-2">
                <IoMdClose />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">Name</label>
                <input
                  value={editingVendor.name}
                  onChange={(e) =>
                    setEditingVendor({ ...editingVendor, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Department</label>
                <input
                  value={editingVendor.department || ""}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      department: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Phone</label>
                <input
                  value={editingVendor.phone || ""}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      phone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Service Type</label>
                <input
                  value={editingVendor.serviceType || ""}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      serviceType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Address</label>
                <input
                  value={editingVendor.address || ""}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      address: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowEdit(false);
                  setEditingVendor(null);
                }}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-[#036173] text-white"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorPage;
