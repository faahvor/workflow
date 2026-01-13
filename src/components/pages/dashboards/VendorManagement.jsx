import React, { useEffect, useState, useRef } from "react";
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
  MdAttachFile,
  MdChevronLeft,
  MdChevronRight,
  MdInsertDriveFile,
  MdVisibility,
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
  const [sundry, setSundry] = useState([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    type: "registered",
    phone: "",
    address: { street: "", city: "", state: "" },
    serviceType: "",
  });
  const [sourceSundryId, setSourceSundryId] = useState(null);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]); // selected files for upload
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // pagination state (page size = 50)
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;
  const [sundryPage, setSundryPage] = useState(1);
  const [sundryTotalPages, setSundryTotalPages] = useState(1);
  const [sundryTotal, setSundryTotal] = useState(0);
  const [sundryLoading, setSundryLoading] = useState(false);
  const [vendorDocsOpen, setVendorDocsOpen] = useState(false);
  const [vendorDocsList, setVendorDocsList] = useState([]); // array of URLs
  const [vendorDocsIndex, setVendorDocsIndex] = useState(0);

  const openVendorDocs = (vendor) => {
    const docs = Array.isArray(vendor?.documents) ? vendor.documents : [];
    if (!docs.length) return;
    setVendorDocsList(docs);
    setVendorDocsIndex(0);
    setVendorDocsOpen(true);
  };

  const closeVendorDocs = () => {
    setVendorDocsOpen(false);
    setVendorDocsList([]);
    setVendorDocsIndex(0);
  };

  const vendorDocsNext = () => {
    setVendorDocsIndex((i) => Math.min(vendorDocsList.length - 1, i + 1));
  };

  const vendorDocsPrev = () => {
    setVendorDocsIndex((i) => Math.max(0, i - 1));
  };

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

  // helper: normalize address input (string or object) -> { street, city, state }
  const normalizeAddress = (value) => {
    if (!value) return { street: "", city: "", state: "" };
    if (typeof value === "object") {
      return {
        street: value.street || "",
        city: value.city || "",
        state: value.state || "",
      };
    }
    // best-effort split for legacy string addresses: "street, city, state"
    const parts = String(value)
      .split(",")
      .map((p) => p.trim());
    return {
      street: parts[0] || "",
      city: parts[1] || "",
      state: parts[2] || "",
    };
  };

  // helper: convert address object to single string for display/search
  const addressToString = (addr) => {
    const a = normalizeAddress(addr);
    return [a.street, a.city, a.state].filter(Boolean).join(", ");
  };
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
        // normalize address to object shape
        address: normalizeAddress(r.address),
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

  // ...existing code...
  // fetch unregistered vendors (sundry) from backend with same endpoint but type=unregistered
  const fetchUnregistered = async (p = 1, search = "") => {
    setSundryLoading(true);
    setError(null);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get(
        `${API_BASE_URL}/vendors?page=${p}&limit=${PAGE_SIZE}&type=unregistered${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`,
        { headers }
      );
      const body = resp.data || {};
      const dataArr = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];
      const filled = dataArr.map((r) => ({
        ...r,
        address: normalizeAddress(r.address),
      }));
      setSundry(filled);
      setSundryPage(body.page ?? p);
      setSundryTotalPages(
        body.pages ??
          Math.max(1, Math.ceil((body.total ?? dataArr.length) / PAGE_SIZE))
      );
      setSundryTotal(body.total ?? dataArr.length);
    } catch (err) {
      console.error("Error fetching unregistered vendors:", err);
      setError("Failed to load un-registered vendors (see console).");
    } finally {
      setSundryLoading(false);
    }
  };

  // ...existing code...
useEffect(() => {
  // fetch both registered and unregistered on mount
  fetchRegistered(page, filterQuery);
  fetchUnregistered(1, ""); // fetch unregistered count on initial load
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  // fetch registered when page changes
  fetchRegistered(page, filterQuery);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [page])

  // fetch unregistered when sundryPage changes (run only when on sundry tab)
  useEffect(() => {
    if (activeTab === "sundry") {
      fetchUnregistered(sundryPage, filterQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sundryPage]);

  // when filter/search changes, reset the appropriate page and fetch the active tab
  useEffect(() => {
    if (activeTab === "registered") {
      setPage(1);
      fetchRegistered(1, filterQuery);
    } else {
      setSundryPage(1);
      fetchUnregistered(1, filterQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterQuery, activeTab]);

  // when switching tabs, trigger fetch for the newly active tab (so counts update)
  useEffect(() => {
    if (activeTab === "registered") {
      setPage(1);
      fetchRegistered(1, filterQuery);
    } else {
      setSundryPage(1);
      fetchUnregistered(1, filterQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  // ...existing code...

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

  const filteredRegistered = registered.filter((v) =>
    `${v.name} ${addressToString(v.address)} ${v.phone || ""}`
      .toLowerCase()
      .includes(filterQuery.toLowerCase())
  );
  const filteredSundry = sundry.filter((s) =>
    `${s.name} ${addressToString(s.address)} ${s.phone || ""}`
      .toLowerCase()
      .includes(filterQuery.toLowerCase())
  );
  // Open edit modal prefilled
  const openEdit = (vendor) => {
    setEditingVendor({
      ...vendor,
      address: normalizeAddress(vendor.address),
    });
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editingVendor.email || !editingVendor.email.trim()) {
      alert("Email is required.");
      return;
    }
    if (!emailRegex.test(editingVendor.email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      const payload = {
        name: editingVendor.name,
        email: editingVendor.email.trim(),

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
    if (!form.name || !form.name.trim()) {
      alert("Vendor name is required.");
      return;
    }

    // Validate email is required and has valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email || !form.email.trim()) {
      alert("Email is required.");
      return;
    }
    if (!emailRegex.test(form.email.trim())) {
      alert("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      // use available token (admin or normal user)
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      if (!token) {
        alert("Authentication required to create a vendor.");
        return;
      }

      // build multipart payload per docs
      const formData = new FormData();
      formData.append("name", form.name || "");
      formData.append("email", form.email.trim());

      formData.append("department", form.department || "");
      formData.append("type", form.type || "registered");
      if (form.phone) formData.append("phone", form.phone);
      // address as nested fields
      const addr = normalizeAddress(form.address);
      formData.append("address[street]", addr.street || "");
      formData.append("address[city]", addr.city || "");
      formData.append("address[state]", addr.state || "");
      if (form.serviceType)
        formData.append("serviceType", form.serviceType || "");

      // append files (key: documents) - server accepts multiple entries
      if (documents && documents.length > 0) {
        documents.forEach((file) => {
          formData.append("documents", file);
        });
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        // NOTE: do not set Content-Type here; axios will set the proper multipart boundary
      };

      const resp = await axios.post(`${API_BASE_URL}/admin/vendors`, formData, {
        headers,
      });

      const created = resp?.data?.data || resp?.data || null;
      if (created) {
        const filled = {
          ...created,
          contractStart: created.contractStart || new Date().toISOString(),
          contractEnd:
            created.contractEnd ||
            new Date(
              new Date().setDate(new Date().getDate() + 365)
            ).toISOString(),
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
        err?.response?.data?.message ||
        JSON.stringify(err?.response?.data) ||
        err.message;
      alert(serverMsg || "Failed to create vendor (check console).");
    } finally {
      setLoading(false);
    }
  };
  // ...existing code...

  const deleteVendor = async (vendorId) => {
    if (!vendorId) return;
    if (
      !window.confirm(
        "Permanently delete this vendor? This action cannot be undone."
      )
    )
      return;
    setLoading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      if (!token) {
        alert("Authentication required to delete a vendor.");
        return;
      }

      const resp = await axios.delete(
        `${API_BASE_URL}/admin/vendors/${vendorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert(resp?.data?.message || "Vendor deleted successfully.");
      setRegistered((prev) =>
        prev.filter((v) => getVendorId(v) !== vendorId && v.id !== vendorId)
      );
    } catch (err) {
      console.error("Error deleting vendor:", err);
      alert(
        err?.response?.data?.message ||
          "Failed to delete vendor (check console)."
      );
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
      phone: item.phone || "",
      address: normalizeAddress(item.address),
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
      email: "",
      department: "",
      type: "registered",
      phone: "",
      address: { street: "", city: "", state: "" },
      serviceType: "",
    });

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleFilesSelected = (filesList) => {
    if (!filesList) return;
    const arr = Array.from(filesList);
    // merge while avoiding duplicates by name+size
    setDocuments((prev) => {
      const existing = prev || [];
      const merged = [...existing];
      arr.forEach((f) => {
        const exists = existing.some(
          (e) =>
            e.name === f.name &&
            e.size === f.size &&
            e.lastModified === f.lastModified
        );
        if (!exists) merged.push(f);
      });
      return merged;
    });
  };

  const removeDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dt = e.dataTransfer;
    if (dt && dt.files) handleFilesSelected(dt.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
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

  // Format ISO date to readable string (e.g., 24 Nov 2026)
  const formatDate = (iso) => {
    try {
      if (!iso) return "N/A";
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900">Vendors</h2>
          <p className="text-slate-500 mt-1">
            Manage registered vendors and Un-Registered Vendors
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
            <div className="text-xs text-slate-500">Un-Registered Vendors</div>
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
                    <th className="px-4 py-3">Contract</th>
                    <th className="px-4 text-center py-3">Actions</th>
                    <th className="px-4 py-3">Documents</th>
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
                            {v.email && (
                              <div className="text-xs text-gray-400">
                                {v.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{v.serviceType || "N/A"}</td>
                      <td className="px-4 py-3">{v.phone || "N/A"}</td>
                      <td className="px-4 py-3">
                        {" "}
                        {addressToString(v.address) || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {v.expiryDate || v.contractEnd ? (
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {formatDate(v.expiryDate ?? v.contractEnd)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {daysRemaining(v.expiryDate ?? v.contractEnd)}{" "}
                              days left
                            </div>
                          </div>
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
                      <td className="px-4 py-3 text-center">
                        {Array.isArray(v.documents) &&
                        v.documents.length > 0 ? (
                          <button
                            onClick={() => openVendorDocs(v)}
                            title={`View ${v.documents.length} document${
                              v.documents.length > 1 ? "s" : ""
                            }`}
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white border hover:bg-slate-50"
                          >
                            <MdInsertDriveFile className="text-lg text-slate-700" />
                            {v.documents.length > 1 && (
                              <span className="text-xs text-slate-500">
                                {v.documents.length}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
              <MdListAlt /> Un-Registered Vendors
            </h3>
          </div>

          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg overflow-x-auto">
            {sundryLoading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSundry.map((s) => (
                    <tr
                      key={s.vendorId ?? s._id ?? s.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-semibold">{s.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleRegisterSundry(s.vendorId ?? s._id ?? s.id)
                            }
                            className="px-3 py-1 rounded-md bg-[#036173] text-white hover:bg-[#024f57] flex items-center gap-2"
                          >
                            <MdHowToReg /> Register
                          </button>
                          <button
                            onClick={() =>
                              handleLocalDelete(
                                s.vendorId ?? s._id ?? s.id,
                                "sundry"
                              )
                            }
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
            )}
          </div>
        </section>
      )}

      {/* Vendor Documents Preview Modal */}
      {vendorDocsOpen && vendorDocsList && vendorDocsList.length > 0 && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeVendorDocs}
          />
          <div className="fixed left-1/2 transform -translate-x-1/2 top-12 z-50 w-[95%] md:w-[90%] lg:w-[70%] max-h-[85vh]">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-slate-900 truncate max-w-[520px]">
                    Vendor Document {vendorDocsIndex + 1} of{" "}
                    {vendorDocsList.length}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closeVendorDocs}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4 relative">
                {/* Navigation arrows */}
                {vendorDocsList.length > 1 && (
                  <>
                    <button
                      onClick={vendorDocsPrev}
                      disabled={vendorDocsIndex === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white border rounded-full p-2 z-20 shadow"
                    >
                      <MdChevronLeft />
                    </button>
                    <button
                      onClick={vendorDocsNext}
                      disabled={vendorDocsIndex === vendorDocsList.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white border rounded-full p-2 z-20 shadow"
                    >
                      <MdChevronRight />
                    </button>
                  </>
                )}

                <div
                  style={{
                    minHeight: "60vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {(() => {
                    const url = vendorDocsList[vendorDocsIndex];
                    const ext = (url || "")
                      .split(".")
                      .pop()
                      .split(/\#|\?/)[0]
                      .toLowerCase();
                    if (ext === "pdf") {
                      return (
                        <iframe
                          title={`doc-${vendorDocsIndex}`}
                          src={url}
                          style={{
                            width: "100%",
                            height: "70vh",
                            border: "none",
                          }}
                        />
                      );
                    }
                    if (
                      ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)
                    ) {
                      return (
                        <img
                          src={url}
                          alt={`doc-${vendorDocsIndex}`}
                          className="max-h-[70vh] w-full object-contain"
                        />
                      );
                    }
                    // fallback to iframe for other types
                    return (
                      <iframe
                        title={`doc-${vendorDocsIndex}`}
                        src={url}
                        style={{
                          width: "100%",
                          height: "70vh",
                          border: "none",
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </>
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
              ></button>
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
                <label className="text-xs text-slate-500">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="vendor@example.com"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div>
                    <input
                      placeholder="Street"
                      value={normalizeAddress(form.address).street}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: {
                            ...(typeof form.address === "object"
                              ? form.address
                              : normalizeAddress(form.address)),
                            street: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      placeholder="City"
                      value={normalizeAddress(form.address).city}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: {
                            ...(typeof form.address === "object"
                              ? form.address
                              : normalizeAddress(form.address)),
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      placeholder="State"
                      value={normalizeAddress(form.address).state}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: {
                            ...(typeof form.address === "object"
                              ? form.address
                              : normalizeAddress(form.address)),
                            state: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
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
             

              {/* Document upload dropzone (Add Vendor) */}
              <div className="md:col-span-2">
                <label className="text-xs text-slate-500">
                  Supporting Documents
                </label>
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={`mt-2 flex flex-col gap-2 p-4 rounded-lg border-2 transition-colors ${
                    dragOver
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="*/*"
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  <div
                    role="button"
                    onClick={triggerFilePicker}
                    className="flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <MdAttachFile className="text-xl" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          Drag & drop files here or click to select
                        </div>
                        <div className="text-xs text-slate-500">
                          You can upload multiple files (pdf, images, docs)
                        </div>
                      </div>
                    </div>
                  </div>

                  {documents && documents.length > 0 && (
                    <div className="mt-2 grid gap-2">
                      {documents.map((f, idx) => (
                        <div
                          key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                          className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white/60 flex items-center justify-center text-slate-600 text-sm font-medium">
                              {String(f.name || "")
                                .split(".")
                                .pop()
                                ?.slice(0, 3) || ""}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {f.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {formatBytes(f.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeDocument(idx)}
                            className="p-1 rounded-md text-rose-600 hover:bg-rose-50"
                          >
                            <MdOutlineCancel />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              <button
                onClick={() => setShowEdit(false)}
                className="p-2"
              ></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-500">
                  Name <span className="text-red-500">*</span>
                </label>
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
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editingVendor.email || ""}
                  onChange={(e) =>
                    setEditingVendor({
                      ...editingVendor,
                      email: e.target.value,
                    })
                  }
                  placeholder="vendor@example.com"
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <div>
                    <input
                      placeholder="Street"
                      value={normalizeAddress(editingVendor.address).street}
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          address: {
                            ...(typeof editingVendor.address === "object"
                              ? editingVendor.address
                              : normalizeAddress(editingVendor.address)),
                            street: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      placeholder="City"
                      value={normalizeAddress(editingVendor.address).city}
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          address: {
                            ...(typeof editingVendor.address === "object"
                              ? editingVendor.address
                              : normalizeAddress(editingVendor.address)),
                            city: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <input
                      placeholder="State"
                      value={normalizeAddress(editingVendor.address).state}
                      onChange={(e) =>
                        setEditingVendor({
                          ...editingVendor,
                          address: {
                            ...(typeof editingVendor.address === "object"
                              ? editingVendor.address
                              : normalizeAddress(editingVendor.address)),
                            state: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
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
