import React, { useEffect, useState } from "react";
import {
  MdDashboard,
  MdHistory,
  MdListAlt,
  MdBusiness,
  MdCheckCircle,
  MdAdd,
  MdEdit,
  MdDelete,
  MdHowToReg,
  MdSearch,
  MdOutlineCancel,
} from "react-icons/md";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const prototypeSundry = [
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

const VendorManagement = () => {
  const { getToken, user } = useAuth();
  const [activeTab, setActiveTab] = useState("registered");
  const [registered, setRegistered] = useState([]);
  const [sundry, setSundry] = useState(prototypeSundry);
  const [filterQuery, setFilterQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [form, setForm] = useState({
    name: "",
    department: "",
    type: "registered",
    phone: "",
    address: "",
    serviceType: "",
  });
  const [sourceSundryId, setSourceSundryId] = useState(null);
  const [error, setError] = useState(null);

  // pagination state (page size = 50)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;
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

  // helper: normalize vendor id (vendorId preferred)
  const getVendorId = (v) => v.vendorId ?? v._id ?? v.id;

  // fetch registered vendors (supports pagination & search)
  const fetchRegistered = async (p = 1, search = "") => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Request paginated list with limit=50
      const resp = await axios.get(
        `${API_BASE_URL}/vendors?page=${p}&limit=${PAGE_SIZE}${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`,
        { headers }
      );
      // Response could be { data: [...], page, pages, total }
      const body = resp.data || {};
      const dataArr = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];
      const regs = dataArr.filter(
        (d) => (d.type || "").toLowerCase() === "registered"
      );
      // ensure contract dates for prototype behaviour if missing
      const filled = regs.map((r) => ({
        ...r,
        contractStart: r.contractStart || new Date().toISOString(),
        contractEnd:
          r.contractEnd ||
          new Date(
            new Date().setDate(new Date().getDate() + 365)
          ).toISOString(),
      }));
      setRegistered(filled);
      // pagination meta
      setPage(body.page ?? p);
      setTotalPages(
        body.pages ??
          Math.max(1, Math.ceil((body.total ?? dataArr.length) / PAGE_SIZE))
      );
      setTotal(body.total ?? dataArr.length);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendors (see console).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetch on mount and when page or search changes
    fetchRegistered(page, filterQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
    fetchRegistered(1, filterQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterQuery]);

  const stats = {
    totalRegistered: registered.length,
    totalSundry: sundry.length,
    activeContracts: registered.filter((r) => r.serviceType).length,
  };

  const daysRemaining = (iso) => {
    try {
      const end = new Date(iso);
      const now = new Date();
      const diff = end - now;
      return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
    } catch {
      return 0;
    }
  };

  const filteredRegistered = registered.filter((v) =>
    `${v.name} ${v.address || ""} ${v.phone || ""}`
      .toLowerCase()
      .includes(filterQuery.toLowerCase())
  );
  const filteredSundry = sundry.filter((s) =>
    `${s.name} ${s.address || ""} ${s.phone || ""}`
      .toLowerCase()
      .includes(filterQuery.toLowerCase())
  );

  // Open edit modal prefilled
  const openEdit = (vendor) => {
    setEditingVendor(vendor);
    setShowEdit(true);
  };

  // Save edit -> attempt admin endpoint, fallback to general endpoint
  const saveEdit = async () => {
    if (!editingVendor) return;
    const vendorId = editingVendor.vendorId ?? getVendorId(editingVendor);
    if (!vendorId) {
      alert("Vendor ID missing; cannot update via API.");
      return;
    }
    setLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const payload = {
        name: editingVendor.name,
        phone: editingVendor.phone,
        address: editingVendor.address,
        type: editingVendor.type,
        department: editingVendor.department,
        serviceType: editingVendor.serviceType,
      };

      // 1) Try admin endpoint first
      try {
        if (token) {
          const resp = await axios.patch(
            `${API_BASE_URL}/admin/vendors/${vendorId}`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const updated = resp.data?.data || resp.data || null;
          setRegistered((prev) =>
            prev.map((r) =>
              getVendorId(r) === vendorId ? { ...r, ...updated } : r
            )
          );
          setShowEdit(false);
          setEditingVendor(null);
          return;
        }
        throw new Error("No token to attempt admin update");
      } catch (adminErr) {
        console.warn(
          "Admin update failed or not allowed, attempting user endpoint fallback:",
          adminErr?.response?.status || adminErr.message
        );
        // 2) Fallback: try general user update endpoint (if exists) - best-effort
        try {
          const tokenUser = getToken
            ? getToken()
            : sessionStorage.getItem("userToken");
          if (!tokenUser)
            throw new Error("No token available for fallback update");
          const fallbackResp = await axios.patch(
            `${API_BASE_URL}/vendors/${vendorId}`,
            payload,
            {
              headers: { Authorization: `Bearer ${tokenUser}` },
            }
          );
          const updated = fallbackResp.data?.data || fallbackResp.data || null;
          setRegistered((prev) =>
            prev.map((r) =>
              getVendorId(r) === vendorId ? { ...r, ...updated } : r
            )
          );
          setShowEdit(false);
          setEditingVendor(null);
          return;
        } catch (fallbackErr) {
          console.error("Fallback update also failed:", fallbackErr);
          throw fallbackErr;
        }
      }
    } catch (err) {
      console.error("Error updating vendor:", err);
      alert(
        err.response?.data?.message || "Failed to update vendor (check console)"
      );
    } finally {
      setLoading(false);
    }
  };

 // ...existing code...
const addVendor = async () => {
  setLoading(true);
  try {
    // use available token (admin or normal user)
    const token = getToken ? getToken() : sessionStorage.getItem("userToken");
    if (!token) {
      alert("Authentication required to create a vendor.");
      return;
    }

    // build exact payload per docs
    const payload = {
      name: form.name,
      department: form.department,
      type: form.type,
      phone: form.phone,
      address: form.address,
      serviceType: form.serviceType,
    };

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const resp = await axios.post(`${API_BASE_URL}/admin/vendors`, payload, {
      headers,
    });

    const created = resp?.data?.data || resp?.data || null;
    if (created) {
      const filled = {
        ...created,
        contractStart: created.contractStart || new Date().toISOString(),
        contractEnd:
          created.contractEnd ||
          new Date(new Date().setDate(new Date().getDate() + 365)).toISOString(),
      };
      setRegistered((p) => [filled, ...p]);

      if (sourceSundryId) {
        setSundry((p) => p.filter((s) => s.id !== sourceSundryId));
        setSourceSundryId(null);
      }

      resetForm();
      setShowAdd(false);
      alert("Vendor created.");
      return;
    }

    throw new Error("Create vendor returned unexpected response.");
  } catch (err) {
    console.error("Error creating vendor:", err);
    const serverMsg =
      err?.response?.data?.message || JSON.stringify(err?.response?.data) || err.message;
    alert(serverMsg || "Failed to create vendor (check console).");
  } finally {
    setLoading(false);
  }
};
// ...existing code...

const deleteVendor = async (vendorId) => {
  if (!vendorId) return;
  if (!window.confirm("Permanently delete this vendor? This action cannot be undone.")) return;
  setLoading(true);
  try {
    const token = getToken ? getToken() : sessionStorage.getItem("userToken");
    if (!token) {
      alert("Authentication required to delete a vendor.");
      return;
    }

    const resp = await axios.delete(`${API_BASE_URL}/admin/vendors/${vendorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    alert(resp?.data?.message || "Vendor deleted successfully.");
    setRegistered((prev) => prev.filter((v) => getVendorId(v) !== vendorId && v.id !== vendorId));
  } catch (err) {
    console.error("Error deleting vendor:", err);
    alert(err?.response?.data?.message || "Failed to delete vendor (check console).");
  } finally {
    setLoading(false);
  }
};

  const handleRegisterSundry = (id) => {
    const item = sundry.find((s) => s.id === id);
    if (!item) return;
    setForm({
      name: item.name || "",
      department: "",
      type: "registered",
      phone: "",
      address: "",
      serviceType: "",
    });
    setSourceSundryId(id);
    setShowAdd(true);
    setActiveTab("registered");
  };

  const handleLocalDelete = (id, type = "registered") => {
    if (
      !window.confirm(
        "Delete vendor locally? This will not remove it from server in prototype."
      )
    )
      return;
    if (type === "registered")
      setRegistered((p) =>
        p.filter((v) => getVendorId(v) !== id && v.id !== id)
      );
    else setSundry((p) => p.filter((s) => s.id !== id));
  };

  const resetForm = () =>
    setForm({
      name: "",
      department: "",
      type: "registered",
      phone: "",
      address: "",
      serviceType: "",
    });

  // Return only the inner content — the parent (ManagerDashboard) provides the page background and Sidebar
  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Vendors</h2>
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
            onClick={() => {
              resetForm();
              setShowAdd(true);
            }}
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
            <div className="text-xs text-slate-500">Registered Vendors</div>
            <div
              className={`text-2xl font-bold ${
                activeTab === "registered" ? "text-white" : "text-slate-900"
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

        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg flex items-center gap-4">
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

      {/* Tables */}
      {activeTab === "registered" ? (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <MdBusiness /> Registered Vendors
            </h3>
            <div className="text-xs text-slate-500">
              Manage suppliers you work with
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg overflow-x-auto">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : error ? (
              <p className="text-sm text-rose-600">{error}</p>
            ) : (
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
                    <tr
                      key={getVendorId(v) || v.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
                            {String(v.name || "")
                              .split(" ")
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">
                              {v.name}
                            </div>
                            
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{v.serviceType || "N/A"}</td>
                      <td className="px-4 py-3">{v.phone || "N/A"}</td>
                      <td className="px-4 py-3">{v.address || "N/A"}</td>
                      <td className="px-4 py-3">
                        {v.contractEnd ? (
                          <span className="text-sm font-medium text-slate-900">
                            {daysRemaining(v.contractEnd)} days
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(v)}
                            className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-2"
                          >
                            <MdEdit /> Edit
                          </button>
                          <button
                             onClick={() => deleteVendor(getVendorId(v) || v.id)}

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
            )}
          </div>
        </section>
      ) : (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <MdListAlt /> Sundry Suppliers
            </h3>
            <div className="text-xs text-slate-500">
              Register or remove temporary suppliers (prototype)
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
                          onClick={() => handleLocalDelete(s.id, "sundry")}
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

      {/* Add Vendor Modal */}
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
              <div>
                <label className="text-xs text-slate-500">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="registered">Registered</option>
                  <option value="sundry">Sundry</option>
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
                onClick={addVendor}
                className="px-4 py-2 rounded-lg bg-[#036173] text-white"
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
                <label className="text-xs text-slate-500">Department</label>
                <select
                  value={editingVendor.department || ""}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      department: e.target.value,
                    })
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
                onClick={saveEdit}
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

export default VendorManagement;
