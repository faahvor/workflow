// src/pages/dashboards/RequesterDashboard.jsx

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MdAdd,
  MdCheckCircle,
  MdDirectionsBoat,
  MdPendingActions,
  MdFilterList,
  MdExpandMore,
} from "react-icons/md";
import { IoMdSearch } from "react-icons/io";

import ItemSelectionTable from "../../shared/tables/ItemSelectionTable";
import RequesterSidebar from "../../shared/layout/RequesterSidebar";
import CompletedRequests from "./CompletedRequests";
import RequestDetailView from "./RequestDetailView";
import RequesterPending from "./RequesterPending";
import RequesterMerged from "./RequesterMerged";

import RequesterHistory from "./RequesterHistory";
import UsersSignature from "./UsersSignature";

const RequesterDashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("overview");
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const dropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedRequestReadOnly, setSelectedRequestReadOnly] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    department: user?.department || "",
    destination: "",
    company: "",
    vesselId: "",
    projectManager: "",
    requestType: "purchaseOrder",
    priority: "normal",
    reference: "",
    purpose: "",
    jobNo: "",
  });

  const [selectedItems, setSelectedItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectManagers, setProjectManagers] = useState([]);
  const [loadingProjectManagers, setLoadingProjectManagers] = useState(false);
  const [vessels, setVessels] = useState([]);
  const [loadingVessels, setLoadingVessels] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [invoiceFiles, setInvoiceFiles] = useState([]); // items: { id, file, previewUrl }
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  // Destinations list
  const destinations = [
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

  const fetchRequestFlow = async (requestId) => {
    try {
      const token = getToken();
      const resp = await axios.get(
        `${API_BASE_URL}/requests/${requestId}/flow`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return resp.data;
    } catch (err) {
      console.error("Error fetching request flow:", err);
      return null;
    }
  };

  const [companiesList, setCompaniesList] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    // Set fixed valid currencies
    const validCurrencies = [
      "NGN",
      "USD",
      "GBP",
      "EUR",
      "JPY",
      "CNY",
      "CAD",
      "AUD",
    ];
    setCurrencies(validCurrencies.map((c) => ({ value: c, label: c })));
    setLoadingCurrencies(false);
  }, []);
  // Priority options
  const priorities = [
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
  ];
  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const token = getToken();
      if (!token) {
        console.error("No token found");
        return;
      }
      const resp = await axios.get(`${API_BASE_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompaniesList(resp.data?.data || resp.data || []);
    } catch (err) {
      console.error("❌ Error fetching companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  // Fetch vessels
  const fetchVessels = async () => {
    try {
      setLoadingVessels(true);
      const token = getToken();

      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Vessels:", response.data);
      setVessels(response.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching vessels:", err);
      setError("Failed to fetch vessels");
    } finally {
      setLoadingVessels(false);
    }
  };

  // Fetch inventory items
  const fetchInventory = async () => {
    try {
      setLoadingInventory(true);
      const token = getToken();

      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Inventory Items:", response.data);
      setInventoryItems(response.data.data || response.data || []);
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch project managers (placeholder endpoint - replace when available)
  const fetchProjectManagers = async () => {
    try {
      setLoadingProjectManagers(true);
      const token = getToken();

      if (!token) {
        console.error("No token found");
        return;
      }

      // TODO: Replace with actual endpoint when available
      const response = {
        data: [
          { id: "PM-001", name: "John Doe" },
          { id: "PM-002", name: "Jane Smith" },
          { id: "PM-003", name: "Bob Wilson" },
        ],
      };

      setProjectManagers(response.data || []);
    } catch (err) {
      console.error("❌ Error fetching project managers:", err);
    } finally {
      setLoadingProjectManagers(false);
    }
  };

  const handleOpenDetail = async (request, opts = {}) => {
    const readOnly = !!opts.readOnly;
    const origin = opts.origin || null;
    try {
      const flow = await fetchRequestFlow(request.requestId);
      setSelectedRequest({ ...request, flow, origin });
      setSelectedRequestReadOnly(readOnly);
      setActiveView("detail");
    } catch (err) {
      console.error("Error opening request detail:", err);
      // fallback: still open detail with minimal data but include origin
      setSelectedRequest({ ...request, origin });
      setSelectedRequestReadOnly(readOnly);
      setActiveView("detail");
    }
  };
  // Fetch inventory and vessels on mount
  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchVessels();
    }
  }, [user]);

  // Fetch project managers when destination is Project
  useEffect(() => {
    if (formData.destination === "Project") {
      fetchProjectManagers();
    }
  }, [formData.destination]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowInventoryDropdown(false);
        setSearchTerm("");
      }
    };

    if (showInventoryDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showInventoryDropdown]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset vessel and project manager when destination changes
    if (name === "destination") {
      setFormData((prev) => ({
        ...prev,
        vesselId: "",
        projectManager: "",
      }));
    }
  };

  const handleAddInventoryItem = (item) => {
    setSelectedItems((prev) => [
      ...prev,
      {
        ...item,
        quantity: 1,
        unitPrice: 0,
        currency: "NGN",
        totalPrice: 0,
        uniqueId: `${item._id}-${Date.now()}`,
      },
    ]);
    setShowInventoryDropdown(false);
    setSearchTerm("");
  };

  // Handle quantity change
  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...selectedItems];
    const q = Number(quantity) || 0;
    updatedItems[index].quantity = q;
    const unit = Number(updatedItems[index].unitPrice || 0);
    updatedItems[index].totalPrice = Math.round(unit * q);
    setSelectedItems(updatedItems);
  };

  const handleUnitPriceChange = (index, value) => {
    const updated = [...selectedItems];
    const unit = Number(value) || 0;
    updated[index].unitPrice = unit;
    const qty = Number(updated[index].quantity || 0);
    updated[index].totalPrice = Math.round(unit * qty);
    setSelectedItems(updated);
  };

  const handleCurrencyChange = (index, currency) => {
    const updated = [...selectedItems];
    updated[index].currency = currency;
    setSelectedItems(updated);
  };

  // Handle remove item
  const handleRemoveItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Filter inventory based on search
  const filteredInventory = inventoryItems.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.makersPartNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Submit new request
// ...existing code...
const handleSubmitRequest = async (e) => {
  e.preventDefault();

  // Validation
  if (!formData.destination) {
    alert("Please select a destination");
    return;
  }

  if (!formData.company) {
    alert("Please select a company");
    return;
  }

  if (
    (formData.destination === "Marine" ||
      formData.destination === "Project") &&
    !formData.vesselId
  ) {
    alert("Please select a vessel");
    return;
  }

  if (formData.destination === "Project" && !formData.projectManager) {
    alert("Please select a project manager");
    return;
  }

  if (selectedItems.length === 0) {
    alert("Please add at least one item from inventory");
    return;
  }

  const invalidItems = selectedItems.filter(
    (item) => !item.quantity || item.quantity < 1
  );
  if (invalidItems.length > 0) {
    alert("All items must have a quantity of at least 1");
    return;
  }

  if (formData.requestType === "pettyCash") {
    const badPrice = selectedItems.find(
      (it) => !it.unitPrice || Number(it.unitPrice) <= 0
    );
    if (badPrice) {
      alert(
        "For petty cash requests each item must have a unit price greater than 0."
      );
      return;
    }
  } else {
    // If this is not pettyCash ensure each item has a positive unit price only when required
    if (formData.requestType === "pettyCash") {
      const badPrice = selectedItems.find(
        (it) => !it.unitPrice || Number(it.unitPrice) <= 0
      );
      if (badPrice) {
        alert(
          "For petty cash requests each item must have a unit price greater than 0."
        );
        return;
      }
    }
  }

  try {
    setSubmitting(true);
    const token = getToken();

    // Prepare items for API
    const items = selectedItems.map((item) => {
      const qty = Number(item.quantity || 0);
      const unit = Number(item.unitPrice || 0);
      const total = Math.round(unit * qty);

      return {
        name: item.name,
        quantity: qty,
        unitPrice: unit,
        totalPrice: total,
        inventoryId: item._id || item.itemId || null,
      };
    });

    // If pettyCash and invoice files exist, send multipart/form-data
    if (formData.requestType === "pettyCash" && invoiceFiles.length > 0) {
      if (invoiceFiles.length > 5) {
        alert("You can upload up to 5 invoice files when creating a request.");
        setSubmitting(false);
        return;
      }

      const fd = new FormData();
      fd.append("department", formData.department);
      fd.append("destination", formData.destination);
      fd.append("requestType", formData.requestType);
      fd.append("purpose", formData.purpose || "");
      if (formData.vesselId) fd.append("vesselId", formData.vesselId);
      if (formData.priority) fd.append("priority", formData.priority);
      if (formData.reference) fd.append("reference", formData.reference);
      if (formData.company) fd.append("companyId", formData.company);
      if (formData.projectManager) fd.append("projectManager", formData.projectManager);

      // items must be a JSON string when using multipart
      fd.append("items", JSON.stringify(items));

      // attach files under invoiceFiles key
      invoiceFiles.forEach((f) => {
        if (f && f.file) {
          fd.append("invoiceFiles", f.file);
        }
      });

      const response = await axios.post(`${API_BASE_URL}/requests`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("✅ Request Created (with files):", response.data);
      alert("Request created successfully!");

    } else {
      // JSON path (no files)
      const payload = {
        department: formData.department,
        destination: formData.destination,
        requestType: formData.requestType,
        purpose: formData.purpose,
        items: items,
      };

      if (formData.vesselId) {
        payload.vesselId = formData.vesselId;
      }

      if (formData.reference) {
        payload.reference = formData.reference;
      }

      if (formData.priority) {
        payload.priority = formData.priority;
      }

      if (formData.company) {
        payload.companyId = formData.company;
      }

      if (formData.projectManager) {
        payload.projectManager = formData.projectManager;
      }

      const response = await axios.post(`${API_BASE_URL}/requests`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Request Created:", response.data);
      alert("Request created successfully!");
    }

    // Reset form
    setFormData({
      department: user?.department || "",
      destination: "",
      company: "",
      vesselId: "",
      projectManager: "",
      requestType: "purchaseOrder",
      priority: "normal",
      reference: "",
      purpose: "",
    });
    setSelectedItems([]);
    setInvoiceFiles([]);

    // Switch to My Requests view
    setActiveView("pending");
  } catch (err) {
    console.error("❌ Error creating request:", err);
    alert(err.response?.data?.message || "Failed to create request");
  } finally {
    setSubmitting(false);
  }
};
// ...existing code...

  // Fetch my requests
  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();

      if (!token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ My Requests:", response.data);
      setMyRequests(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  // Load requests when switching to pending view
  useEffect(() => {
    if (user && (activeView === "pending" || activeView === "overview")) {
      fetchMyRequests();
    }
  }, [user, activeView]);

const handleApprove = async (requestId) => {
  const ok = window.confirm("Are you sure you want to approve this request?");
  if (!ok) return;

  try {
    setLoading(true);
    const token = getToken();
    console.debug("handleApprove: token present?", !!token, "requestId:", requestId);
    if (!token) {
      navigate("/login");
      return;
    }

    const url = `${API_BASE_URL}/requests/${encodeURIComponent(requestId)}/approve`;
    console.debug("handleApprove: POST ->", url);

    const resp = await axios.post(url, {}, { headers: { Authorization: `Bearer ${token}` } });

    console.debug("handleApprove: response:", resp?.status, resp?.data);
    if (resp?.status === 200 || resp?.status === 201) {
      // success: refresh lists and navigate back
      await fetchMyRequests();
      alert(resp.data?.message || "Request approved successfully");
      setActiveView("pending");
      return;
    }

    // non-2xx status
    console.warn("handleApprove: unexpected response", resp);
    alert(resp.data?.message || "Unexpected response from server");
  } catch (err) {
    console.error("Error approving request:", {
      message: err.message,
      status: err.response?.status,
      responseData: err.response?.data,
    });
    alert(err?.response?.data?.message || "Failed to approve request");
  } finally {
    setLoading(false);
  }
};

  const handleReject = async (requestId) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }
      await axios.post(
        `${API_BASE_URL}/requests/${requestId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMyRequests();
      setActiveView("pending");
    } catch (err) {
      console.error("Error rejecting request:", err);
      alert(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  const handleQuery = async (requestId) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }
      await axios.post(
        `${API_BASE_URL}/requests/${requestId}/query`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchMyRequests();
      setActiveView("pending");
    } catch (err) {
      console.error("Error querying request:", err);
      alert(err?.response?.data?.message || "Failed to send query");
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = myRequests.filter(
    (r) => String(r.status).toLowerCase() === "pending"
  ).length;
  const totalRequestsCount = myRequests.length;
  const approvedCount = myRequests.filter(
    (r) => String(r.status).toLowerCase() === "approved"
  ).length;

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInvoiceInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const entries = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    setInvoiceFiles((prev) => [...prev, ...entries]);
    // reset input so same file can be selected again if needed
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;
    const entries = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      file,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
    }));
    setInvoiceFiles((prev) => [...prev, ...entries]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const removeInvoiceFile = (id) => {
    setInvoiceFiles((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.previewUrl) {
        try {
          URL.revokeObjectURL(found.previewUrl);
        } catch (err) {
          /* ignore */
        }
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <RequesterSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          pendingCount={myRequests.length}
          isRequester={true}
          selectedRequestOrigin={selectedRequest?.origin}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2">
                {activeView === "createNew"
                  ? "Create New Request"
                  : activeView === "pending"
                  ? "Pending Requests"
                  : activeView === "overview"
                  ? "Overview"
                  : activeView === "shipping"
                  ? "Shipping Request"
                  : ""}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {activeView === "createNew"
                  ? "Fill in the details below to submit your request"
                  : activeView === "pending"
                  ? "View and track your submitted requests"
                  : activeView === "overview"
                  ? "Requester dashboard"
                  : activeView === "shipping"
                  ? "Shipping  dashboard"
                  : ``}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm md:text-base">{error}</p>
              </div>
            )}

            {/* Create New Request Form */}
            {activeView === "createNew" && (
              <form
                onSubmit={handleSubmitRequest}
                className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 md:p-8 shadow-lg"
              >
                <div className="space-y-6">
                  {/* Row 1: Department & Destination */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Department (Read-only) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        readOnly
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed text-sm"
                      />
                    </div>

                    {/* Destination */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Destination *
                      </label>
                      <select
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                        required
                      >
                        <option value="">Select Destination</option>
                        {destinations.map((dest) => (
                          <option key={dest.name} value={dest.name}>
                            {dest.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Request Type *
                      </label>
                      <select
                        name="requestType"
                        value={formData.requestType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                        required
                      >
                        <option value="purchaseOrder">Purchase Order</option>
                        <option value="pettyCash">Petty Cash</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Job Number
                      </label>
                      <input
                        type="text"
                        name="jobNo"
                        value={formData.jobNo}
                        onChange={handleInputChange}
                        placeholder="Enter job number "
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  {/* Row 2: Company & Vessel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Company Name *
                      </label>
                      <select
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                        required
                      >
                        <option value="">
                          {loadingCompanies
                            ? "Loading companies..."
                            : "Select Company"}
                        </option>
                        {companiesList.map((comp) => (
                          <option
                            key={comp.companyId || comp._id || comp.name}
                            value={comp.companyId || comp._id || comp.name}
                          >
                            {comp.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Vessel Dropdown (show only for Marine or Project) */}
                    {(formData.destination === "Marine" ||
                      formData.destination === "Project") && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                          Vessel *
                        </label>
                        <select
                          name="vesselId"
                          value={formData.vesselId}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                          required
                          disabled={loadingVessels}
                        >
                          <option value="">
                            {loadingVessels
                              ? "Loading vessels..."
                              : "Select Vessel"}
                          </option>
                          {vessels
                            .filter((vessel) => vessel.status === "active")
                            .map((vessel) => (
                              <option
                                key={vessel.vesselId}
                                value={vessel.vesselId}
                              >
                                {vessel.name}
                              </option>
                            ))}
                        </select>
                        {vessels.length === 0 && !loadingVessels && (
                          <p className="text-xs text-red-500 mt-1">
                            No vessels available
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Project Manager (show only for Project) */}
                  {formData.destination === "Project" && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Project Manager *
                      </label>
                      <select
                        name="projectManager"
                        value={formData.projectManager}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                        required
                        disabled={loadingProjectManagers}
                      >
                        <option value="">
                          {loadingProjectManagers
                            ? "Loading..."
                            : "Select Project Manager"}
                        </option>
                        {projectManagers.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Row 3: Priority & Reference */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Priority */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Priority *
                      </label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                        required
                      >
                        {priorities.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Reference */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Reference
                      </label>
                      <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleInputChange}
                        placeholder="Enter reference (optional)"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm"
                      />
                    </div>
                  </div>

                  {/* Items from Inventory */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                      Items from Inventory
                    </label>

                    {/* Add Item Button with Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() =>
                          setShowInventoryDropdown(!showInventoryDropdown)
                        }
                        className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-600 font-semibold hover:bg-emerald-100 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <MdAdd className="text-xl" />
                        Add Item from Inventory
                      </button>

                      {/* Dropdown */}
                      {showInventoryDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
                          {/* Search */}
                          <div className="p-3 border-b border-slate-200">
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search items..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-400 text-sm"
                            />
                          </div>

                          {/* Items List */}
                          <div className="overflow-y-auto flex-1">
                            {loadingInventory ? (
                              <div className="p-4 text-center text-slate-500">
                                Loading...
                              </div>
                            ) : filteredInventory.length === 0 ? (
                              <div className="p-4 text-center text-slate-500">
                                No items found
                              </div>
                            ) : (
                              filteredInventory.map((item, index) => (
                                <button
                                  key={`${item._id}-${index}`}
                                  type="button"
                                  onClick={() => handleAddInventoryItem(item)}
                                  className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                >
                                  <p className="font-medium text-slate-900 text-sm">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {item.itemType || item.makersType} •{" "}
                                    {item.maker} • {item.makersPartNo}
                                  </p>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Selected Items Table */}
                    {selectedItems.length > 0 && (
                      <ItemSelectionTable
                        items={selectedItems}
                        onQuantityChange={handleQuantityChange}
                        onRemoveItem={handleRemoveItem}
                        onUnitPriceChange={handleUnitPriceChange}
                        onCurrencyChange={handleCurrencyChange}
                        currencies={currencies}
                        requestType={formData.requestType} // <-- add this prop
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                      Purpose for Items
                    </label>
                    <textarea
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      placeholder="Describe the purpose of this request"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm resize-none"
                    />
                  </div>

                  {formData.requestType === "pettyCash" && (
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Upload Invoice(s) (optional)
                      </label>

                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={handleBrowseClick}
                        role="button"
                        tabIndex={0}
                        className={`w-full cursor-pointer rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 ${
                          dragActive
                            ? "border-2 border-emerald-400 bg-emerald-50"
                            : "border-2 border-dashed border-slate-200 bg-white/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
                            📎
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {invoiceFiles.length > 0
                                ? `${invoiceFiles.length} file(s) selected`
                                : "Drag & drop invoice(s) here, or click to browse"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleBrowseClick}
                            className="px-3 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] text-sm"
                          >
                            Add Files
                          </button>

                          {invoiceFiles.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setInvoiceFiles([])}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          multiple
                          onChange={handleInvoiceInputChange}
                          className="hidden"
                        />
                      </div>

                      {invoiceFiles.length > 0 && (
                        <div className="mt-3 grid gap-2">
                          {invoiceFiles.map((f) => (
                            <div
                              key={f.id}
                              className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                                  {f.previewUrl ? (
                                    <img
                                      src={f.previewUrl}
                                      alt={f.file.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-slate-600 text-sm px-2 text-center">
                                      {f.file.type === "application/pdf"
                                        ? "PDF"
                                        : "FILE"}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-slate-900 truncate w-56">
                                    {f.file.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {Math.round(f.file.size / 1024)} KB
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => removeInvoiceFile(f.id)}
                                  className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setActiveView("overview")}
                      className="px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
            {activeView === "detail" && selectedRequest && (
              <RequestDetailView
                request={selectedRequest}
                onBack={() => {
                  setSelectedRequest(null);
                  setActiveView("pending");
                }}
                isReadOnly={selectedRequestReadOnly}
                onApprove={handleApprove}
                onReject={handleReject}
                onQuery={handleQuery}
                vendors={vendors}
              />
            )}
            {activeView === "completed" && (
              <>
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
                      <input
                        type="text"
                        placeholder="Search by request ID, requester, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-12 pl-12 pr-10 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="all">All Types</option>
                        <option value="purchaseOrder">Purchase Orders</option>
                        <option value="pettycash">Petty Cash</option>
                      </select>
                      <MdFilterList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                      <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
                    </div>
                  </div>
                </div>

                <CompletedRequests
                  searchQuery={searchQuery}
                  filterType={filterType}
                  onOpenDetail={(req) =>
                    handleOpenDetail(req, { readOnly: true })
                  }
                />
              </>
            )}
            {activeView === "myrequests" && (
              <RequesterHistory
                searchQuery={searchQuery}
                filterType={filterType}
                onOpenDetail={(req, opts = {}) => {
                  // ensure history opens detail read-only
                  handleOpenDetail(req, { ...opts, readOnly: true });
                }}
              />
            )}

            {/* My Requests View - Placeholder */}
            {activeView === "pending" && (
              <RequesterPending
                searchQuery={searchQuery}
                filterType={filterType}
                onOpenDetail={handleOpenDetail}
              />
            )}
            
            {activeView === "merged" && (
              <RequesterMerged
                searchQuery={searchQuery}
                filterType={filterType}
              />
            )}

            {/* Signature Manager */}
            {activeView === "signature" && <UsersSignature />}

            {/* Overview - Placeholder */}
            {activeView === "overview" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <MdPendingActions className="text-2xl text-white" />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-1 font-semibold">
                      Pending Requests
                    </p>
                    <p className="text-slate-900 text-3xl font-bold">
                      {totalRequestsCount}
                    </p>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <MdDirectionsBoat className="text-2xl text-white" />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-1 font-semibold">
                      My Requests
                    </p>
                    <p className="text-slate-900 text-3xl font-bold">
                      {pendingCount}
                    </p>
                  </div>

                  <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <MdAdd className="text-2xl text-white" />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-1 font-semibold">
                      Create Request
                    </p>
                    <p className="text-slate-900 text-3xl font-bold">
                      {approvedCount}
                    </p>
                  </div>
                </div>

                {/* Search / filter bar (simple) */}
                <div className="bg-white/90 p-4 rounded-2xl border-2 border-slate-200 mb-6">
                  <div className="flex gap-4 flex-col md:flex-row">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Search by request ID, title, or vessel..."
                        className="w-full h-12 pl-4 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl"
                        disabled
                      />
                    </div>
                    <div>
                      <select
                        value=""
                        onChange={() => {}}
                        className="h-12 pl-3 pr-8 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl"
                        disabled
                      >
                        <option value="">All</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pending list (derived from myRequests) */}
                <div className="space-y-4">
                  {myRequests
                    .filter((r) => String(r.status).toLowerCase() === "pending")
                    .map((request) => (
                      <div
                        key={request.requestId || request.id}
                        className="bg-white/90 p-4 rounded-2xl border-2 border-slate-200 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs text-slate-500 font-mono">
                            {request.requestId || request.id}
                          </div>
                          <div className="text-sm font-semibold text-slate-900">
                            {request.title || request.name || "No title"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {request.vesselId || request.vessel || "N/A"} •{" "}
                            {request.createdAt
                              ? new Date(request.createdAt).toLocaleDateString()
                              : ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              // open details using existing handler if present
                              if (typeof handleOpenDetail === "function") {
                                handleOpenDetail(request);
                              } else {
                                setActiveView("pending");
                              }
                            }}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
                          >
                            View
                          </button>
                          <span className="text-xs text-orange-500 font-semibold">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}

                  {myRequests.filter(
                    (r) => String(r.status).toLowerCase() === "pending"
                  ).length === 0 && (
                    <div className="bg-white/90 p-12 rounded-2xl border-2 border-slate-200 text-center shadow-lg">
                      <p className="text-slate-700 text-lg font-semibold">
                        No pending requests
                      </p>
                      <p className="text-slate-500 text-sm mt-2">
                        Create a request or check your My Requests list
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequesterDashboard;
