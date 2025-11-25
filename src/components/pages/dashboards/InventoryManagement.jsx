import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { IoMdClose } from "react-icons/io";
import {
  MdSearch,
  MdAdd,
  MdCloudUpload,
  MdBusiness,
  MdInventory,
  MdWarning,
  MdEdit,
  MdDelete,
} from "react-icons/md";

const API_BASE = "https://hdp-backend-1vcl.onrender.com/api";
const PAGE_SIZE = 50;

export default function InventoryManagement() {
  const { getToken } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    department: "Marine",
    name: "",
    quantity: 0,
    maker: "",
    makerPartNumber: "",
  });

  const [activeStat, setActiveStat] = useState("all"); // 'all' | 'low'
  const searchDebounceRef = useRef(null);

  const fetchInventory = async (p = 1, q = "", dept = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const params = [`page=${p}`, `limit=${PAGE_SIZE}`];
      if (q) params.push(`search=${encodeURIComponent(q)}`);
      if (dept) params.push(`department=${encodeURIComponent(dept)}`);

      const url = `${API_BASE}/inventory?${params.join("&")}`;
      const resp = await axios.get(url, { headers });

      const body = resp.data || {};
      const data = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];
      setInventory(data.map((d) => ({ ...d })));
      setPage(body.page ?? p);
      setPages(
        body.pages ??
          Math.max(1, Math.ceil((body.total ?? data.length) / PAGE_SIZE))
      );
      setTotal(body.total ?? data.length);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setError(err.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory(page, search, department);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // debounce search input
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      fetchInventory(1, search, department);
    }, 450);
    return () => clearTimeout(searchDebounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, department]);

  const stats = {
    totalItems: inventory.length === 0 && page === 1 ? total : total, // prefer server total
    totalQuantity: inventory.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
    lowStock: (Array.isArray(inventory) ? inventory : []).filter(
      (i) => Number(i.quantity) <= 10
    ).length,
  };

  // Add item (POST /api/inventory)
  const handleAdd = async () => {
    try {
      setLoading(true);
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        department: form.department,
        name: form.name,
        quantity: Number(form.quantity) || 0,
        maker: form.maker,
        makerPartNumber: form.makerPartNumber,
      };
      const resp = await axios.post(`${API_BASE}/inventory`, payload, {
        headers,
      });
      const created = resp.data?.data || resp.data;
      if (created) {
        // optimistic: reload current page
        fetchInventory(1, search, department);
        setShowAdd(false);
        setForm({
          department: "Marine",
          name: "",
          quantity: 0,
          maker: "",
          makerPartNumber: "",
        });
        alert("Inventory added.");
      } else {
        throw new Error("Invalid create response");
      }
    } catch (err) {
      console.error("Error creating inventory:", err);
      alert(err.response?.data?.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      department: item.department || "",
      name: item.name || "",
      quantity: item.quantity ?? 0,
      maker: item.maker || "",
      makerPartNumber: item.makerPartNumber || "",
    });
    setShowEdit(true);
  };

  // Save edit (PATCH /api/inventory/:inventoryId)
  const handleSaveEdit = async () => {
    if (!editing?.inventoryId) return;
    try {
      setLoading(true);
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payload = {
        department: form.department,
        name: form.name,
        quantity: Number(form.quantity) || 0,
        maker: form.maker,
        makerPartNumber: form.makerPartNumber,
      };
      const resp = await axios.patch(
        `${API_BASE}/inventory/${encodeURIComponent(editing.inventoryId)}`,
        payload,
        { headers }
      );
      const updated = resp.data?.data || resp.data;
      // optimistic update: refetch current page
      fetchInventory(page, search, department);
      setShowEdit(false);
      setEditing(null);
            alert("Inventory updated.");

    } catch (err) {
      console.error("Error updating inventory:", err);
      alert(err.response?.data?.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  // Delete (DELETE /api/inventory/:inventoryId)
  const handleDelete = async (inventoryId) => {
    if (!window.confirm("Delete inventory item? This action cannot be undone."))
      return;
    try {
      setLoading(true);
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(
        `${API_BASE}/inventory/${encodeURIComponent(inventoryId)}`,
        { headers }
      );
      // optimistic: reload current page (if last item on page and page>1, step back)
      const remaining = inventory.length - 1;
      const newPage = remaining === 0 && page > 1 ? page - 1 : page;
      fetchInventory(newPage, search, department);
            alert("Inventory deleted.");

    } catch (err) {
      console.error("Error deleting inventory:", err);
      alert(err.response?.data?.message || "Failed to delete item");
    } finally {
      setLoading(false);
    }
  };

  // filtered view by activeStat (if low selected, show <=10)
  const visible =
    activeStat === "low"
      ? inventory.filter((i) => Number(i.quantity) <= 10)
      : inventory;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Inventory</h2>
          <p className="text-slate-500 mt-1">Central inventory — live</p>
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
            onClick={() => {
              setShowAdd(true);
              setForm({
                department: "Marine",
                name: "",
                quantity: 0,
                maker: "",
                makerPartNumber: "",
              });
            }}
            className="px-4 py-2 bg-[#036173] text-white rounded-xl flex items-center gap-2 shadow-lg"
          >
            <MdAdd /> Add
          </button>

          <button
            onClick={() =>
              alert("Upload (prototype) — Excel import coming soon")
            }
            className="px-4 py-2 bg-white/90 rounded-xl flex items-center gap-2 border border-slate-200"
          >
            <MdCloudUpload className="text-emerald-600" /> Upload
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
            className={`${
              activeStat === "all"
                ? "bg-white/10 text-white"
                : "bg-emerald-500/20 text-emerald-600"
            } w-14 h-14 rounded-xl flex items-center justify-center text-2xl`}
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
              {stats.totalItems ?? 0}
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 flex items-center gap-4 transition bg-white/90 backdrop-blur-xl border-2 border-slate-200">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-yellow-500/20 text-yellow-600">
            <MdInventory />
          </div>
          <div>
            <div className="text-slate-500 text-xs">Total Quantity</div>
            <div className="text-2xl font-bold text-slate-900">
              {stats.totalQuantity}
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
            className={`${
              activeStat === "low"
                ? "bg-white/10 text-white"
                : "bg-red-500/20 text-red-600"
            } w-14 h-14 rounded-xl flex items-center justify-center text-2xl`}
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
      </div>

      {/* Table */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-slate-600">
            Loading inventory...
          </div>
        ) : error ? (
          <div className="py-6 text-center text-rose-600">{error}</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Maker</th>
                  <th className="px-4 py-3">Maker PN</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      No inventory items found.
                    </td>
                  </tr>
                ) : (
                  visible.map((it) => (
                    <tr key={it.inventoryId} className="hover:bg-slate-50">
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
                              Number(it.quantity) <= 10
                                ? "bg-red-100 text-red-600"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {it.quantity}
                          </div>
                          {Number(it.quantity) <= 10 && (
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
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Page {page} of {pages} — Total: {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  className="px-3 py-1 rounded bg-white border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
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
                <label className="text-xs text-slate-500">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, maker: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">Maker Part No</label>
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
                onClick={() => setShowAdd(false)}
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
                  value={editing.inventoryId}
                  disabled
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100"
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
                <label className="text-xs text-slate-500">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, maker: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Maker Part No</label>
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
  );
}
