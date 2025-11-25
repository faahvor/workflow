import React, { useEffect, useState } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdInventory,
  MdAdd,
  MdEdit,
  MdDelete,
  MdCloudUpload,
  MdSearch,
  MdWarning,
  MdStorage,
  MdBusiness,
  MdFilterList,
} from "react-icons/md";

/*
  Inventory Management prototype page
  - Styled to match NewDashboard visuals (orbs, grid pattern, blurred cards)
  - Left sidebar (same look/feel), main content on right
  - Local prototype data from provided JSON
  - Add / Upload (placeholder), Edit modal, Delete with confirmation
*/

const initialData = [
  {
    inventoryId: "I-123456",
    department: "Marine",
    name: "Engine Filter",
    quantity: 50,
    maker: "Wartsila",
    makerPartNumber: "W-FILTER-001",
  },
  {
    inventoryId: "I-123457",
    department: "Marine",
    name: "Hydraulic Oil",
    quantity: 120,
    maker: "Shell",
    makerPartNumber: "SH-HYD-68",
  },
  {
    inventoryId: "I-123458",
    department: "IT",
    name: "Laptop Battery",
    quantity: 8,
    maker: "Panasonic",
    makerPartNumber: "P-BA100",
  },
];

const Inventory = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [inventory, setInventory] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    inventoryId: "",
    department: "",
    name: "",
    quantity: 0,
    maker: "",
    makerPartNumber: "",
  });
  const [activeStat, setActiveStat] = useState("all"); // active stat: 'all' = show all SKUs, 'low' = show low-stock only (<= 10)

  // load prototype data on mount
  useEffect(() => {
    setInventory(initialData);
  }, []);

  const stats = {
    totalItems: inventory.length,
    totalQuantity: inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    lowStock: inventory.filter((i) => Number(i.quantity) <= 10).length, // include 0..10
  };

  const resetForm = () =>
    setForm({
      inventoryId: `I-${Date.now().toString().slice(-6)}`,
      department: "Marine",
      name: "",
      quantity: 0,
      maker: "",
      makerPartNumber: "",
    });

  const openAdd = () => {
    resetForm();
    setShowAdd(true);
  };

  const handleAdd = () => {
    setInventory((p) => [{ ...form }, ...p]);
    setShowAdd(false);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ ...item });
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    setInventory((p) =>
      p.map((it) => (it.inventoryId === form.inventoryId ? { ...form } : it))
    );
    setShowEdit(false);
    setEditing(null);
  };

  const handleDelete = (id) => {
    const ok = window.confirm(
      "Delete inventory item? This action cannot be undone."
    );
    if (!ok) return;
    setInventory((p) => p.filter((it) => it.inventoryId !== id));
  };

  const filtered = inventory
    .filter((it) => {
      // apply active stat filter
      if (activeStat === "low") {
        return Number(it.quantity) <= 10;
      }
      return true;
    })
    .filter((it) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        String(it.name).toLowerCase().includes(q) ||
        String(it.inventoryId).toLowerCase().includes(q) ||
        String(it.maker).toLowerCase().includes(q)
      );
    });

  const handleUploadPlaceholder = () => {
    // placeholder for Excel upload integration
    alert("Upload (prototype) — this will accept an Excel file in the future.");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Background orbs */}
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

      {/* Grid overlay */}
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
        {/* Sidebar */}
        <aside
          className={`bg-[#0a0a0a] border-r border-gray-800/50 ${
            sidebarOpen ? "w-72" : "w-20"
          } transition-all duration-300 p-6 flex flex-col`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-white font-bold">Gemz Software</h1>
                <p className="text-gray-400 text-xs">Inventory</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-2">
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                sidebarOpen
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdDashboard className="text-xl" />
              {sidebarOpen && <span className="font-medium">Overview</span>}
            </button>

            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              {sidebarOpen ? (
                <IoMdClose className="text-xl" />
              ) : (
                <IoMdMenu className="text-xl" />
              )}
              {sidebarOpen && <span className="font-medium">Toggle</span>}
            </button>

            <div className="mt-4">
              {sidebarOpen && (
                <>
                  <div className="text-xs text-gray-400 uppercase mb-2">
                    Modules
                  </div>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50">
                    <MdInventory className="text-xl" />
                    <span>Inventory</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50">
                    <MdStorage className="text-xl" />
                    <span>Stockrooms</span>
                  </button>
                </>
              )}
            </div>
          </nav>

          <div className="mt-6 pt-4 border-t border-gray-800/50">
            {sidebarOpen && (
              <div className="text-sm text-gray-400">
                <div className="font-medium text-white">Vendor Manager</div>
                <div className="text-xs mt-1">inventory@gemz.com</div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="w-full">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">
                  Inventory
                </h2>
                <p className="text-slate-500 mt-1">
                  Marine inventory management — prototype
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <MdSearch className="absolute left-3 top-3 text-slate-400 text-lg" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search inventory..."
                    className="pl-10 pr-4 h-11 rounded-xl border-2 border-slate-200 bg-slate-50"
                  />
                </div>

                <button
                  onClick={openAdd}
                  className="px-4 py-2 bg-[#036173] text-white rounded-xl flex items-center gap-2 shadow-lg"
                >
                  <MdAdd /> Add
                </button>

                <button
                  onClick={handleUploadPlaceholder}
                  className="px-4 py-2 bg-white/90 rounded-xl flex items-center gap-2 border border-slate-200"
                >
                  <MdCloudUpload className="text-emerald-600" /> Upload
                </button>
              </div>
            </div>

            {/* Stats: Total SKUs, Total Quantity, Low Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                role="button"
                onClick={() => setActiveStat("all")}
                className={`rounded-2xl p-6 flex items-center gap-4 cursor-pointer transition ${
                  activeStat === "all"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "bg-white/90 backdrop-blur-xl border-2 border-slate-200"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    activeStat === "all"
                      ? "bg-white/10 text-white"
                      : "bg-emerald-500/20 text-emerald-600"
                  }`}
                >
                  <MdBusiness />
                </div>
                <div>
                  <div
                    className={`${
                      activeStat === "all" ? "text-white/90" : "text-slate-500"
                    } text-xs`}
                  >
                    Total SKUs
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      activeStat === "all" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {stats.totalItems}
                  </div>
                </div>
              </div>

              <div
                role="button"
                onClick={() => setActiveStat("low")}
                className={`rounded-2xl p-6 flex items-center gap-4 cursor-pointer transition ${
                  activeStat === "low"
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg"
                    : "bg-white/90 backdrop-blur-xl border-2 border-slate-200"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    activeStat === "low"
                      ? "bg-white/10 text-white"
                      : "bg-red-500/20 text-red-600"
                  }`}
                >
                  <MdWarning />
                </div>
                <div>
                  <div
                    className={`${
                      activeStat === "low" ? "text-white/90" : "text-slate-500"
                    } text-xs`}
                  >
                    Low Stock
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      activeStat === "low" ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {stats.lowStock}
                  </div>
                </div>
              </div>
              <div
                role="button"
                onClick={() => setActiveStat("all")}
                className={`rounded-2xl p-6 flex items-center gap-4 cursor-pointer transition ${"bg-white/90 backdrop-blur-xl border-2 border-slate-200"}`}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-yellow-500/20 text-yellow-600`}
                >
                  <MdInventory />
                </div>
                <div>
                  <div className={"text-slate-500 text-xs"}>Total Quantity</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stats.totalQuantity}
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Maker</th>
                    <th className="px-4 py-3">Maker PN</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((it) => (
                    <tr key={it.inventoryId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {it.inventoryId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {it.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {it.department}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <div
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              it.quantity < 10
                                ? "bg-red-100 text-red-600"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {it.quantity}
                          </div>
                          {it.quantity < 10 && (
                            <span className="text-xs text-red-500">Low</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{it.maker}</td>
                      <td className="px-4 py-3">{it.makerPartNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(it)}
                            className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2"
                          >
                            <MdEdit /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(it.inventoryId)}
                            className="px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-2"
                          >
                            <MdDelete /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        No inventory items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Modal */}
            {showAdd && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setShowAdd(false)}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[720px] p-6 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <MdAdd /> Add Inventory
                    </h3>
                    <button onClick={() => setShowAdd(false)} className="p-2">
                      <IoMdClose />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">SKU</label>
                      <input
                        value={form.inventoryId}
                        onChange={(e) =>
                          setForm({ ...form, inventoryId: e.target.value })
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
                      <label className="text-xs text-slate-500">Quantity</label>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) =>
                          setForm({ ...form, quantity: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Maker</label>
                      <input
                        value={form.maker}
                        onChange={(e) =>
                          setForm({ ...form, maker: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Maker Part No
                      </label>
                      <input
                        value={form.makerPartNumber}
                        onChange={(e) =>
                          setForm({ ...form, makerPartNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowAdd(false);
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAdd}
                      className="px-4 py-2 rounded-lg bg-[#036173] text-white"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEdit && editing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setShowEdit(false)}
                />
                <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[720px] p-6 z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <MdEdit /> Edit Inventory
                    </h3>
                    <button onClick={() => setShowEdit(false)} className="p-2">
                      <IoMdClose />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500">SKU</label>
                      <input
                        value={form.inventoryId}
                        onChange={(e) =>
                          setForm({ ...form, inventoryId: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled
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
                      <label className="text-xs text-slate-500">Quantity</label>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) =>
                          setForm({ ...form, quantity: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Maker</label>
                      <input
                        value={form.maker}
                        onChange={(e) =>
                          setForm({ ...form, maker: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">
                        Maker Part No
                      </label>
                      <input
                        value={form.makerPartNumber}
                        onChange={(e) =>
                          setForm({ ...form, makerPartNumber: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowEdit(false);
                        setEditing(null);
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
    </div>
  );
};

export default Inventory;
