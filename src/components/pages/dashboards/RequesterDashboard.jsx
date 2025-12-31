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
import Notification from "./Notification";
import RejectedRequest from "./RejectedRequest";
import ChatRoom from "./ChatRoom";
import Support from "./Support";

// --- Place above the RequesterDashboard component ---

function ServiceTable({ rows, setRows }) {
  const handleChange = (idx, field, value) => {
    const updated = [...rows];
    updated[idx][field] = value;
    setRows(updated);
  };
  const handleRemove = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };
  const handleAdd = () => {
    setRows([...rows, { description: "", amount: "" }]);
  };
  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-[#036173] to-teal-600 text-white font-bold px-4 py-2 rounded-t-lg">
        SERVICE AND LABOR DESCRIPTION
      </div>
      <table className="w-full border border-[#036173] bg-[#f0f4ff]">
        <thead>
          <tr className="">
            <th className="p-2 border border-[#036173] text-left">
              Description
            </th>
            <th className="p-2 border border-[#036173] text-left">Amount</th>
            <th className="p-2 border border-[#036173]"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="p-2 border border-[#036173]">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) =>
                    handleChange(idx, "description", e.target.value)
                  }
                  className="w-full bg-transparent"
                />
              </td>
              <td className="p-2 border border-[#036173]">
                <input
                  type="number"
                  value={row.amount}
                  onChange={(e) => handleChange(idx, "amount", e.target.value)}
                  className="w-full bg-transparent"
                />
              </td>
              <td className="p-2 border border-[#036173] text-center">
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-red-600 font-bold"
                  title="Remove"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 px-4 py-2 bg-[#036173] text-white rounded"
      >
        + Add Service Row
      </button>
    </div>
  );
}

function MaterialTable({ rows, setRows }) {
  const handleChange = (idx, field, value) => {
    const updated = [...rows];
    updated[idx][field] = value;
    setRows(updated);
  };
  const handleRemove = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };
  const handleAdd = () => {
    setRows([...rows, { description: "", quantity: "" }]);
  };
  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-[#036173] to-teal-600 text-white font-bold px-4 py-2 rounded-t-lg">
        PARTS AND MATERIALS DESCRIPTION
      </div>
      <table className="w-full border border-[#036173] bg-[#f0f4ff]">
        <thead>
          <tr>
            <th className="p-2 border border-[#036173] text-left">
              Description
            </th>
            <th className="p-2 border border-[#036173] text-left">Quantity</th>
            <th className="p-2 border border-[#036173]"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="p-2 border border-[#036173]">
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) =>
                    handleChange(idx, "description", e.target.value)
                  }
                  className="w-full bg-transparent"
                />
              </td>
              <td className="p-2 border border-[#036173]">
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) =>
                    handleChange(idx, "quantity", e.target.value)
                  }
                  className="w-full bg-transparent"
                />
              </td>
              <td className="p-2 border border-[#036173] text-center">
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-red-600 font-bold"
                  title="Remove"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={handleAdd}
        className="mt-2 px-4 py-2 bg-[#036173] text-white rounded"
      >
        + Add Material Row
      </button>
    </div>
  );
}

const RequesterDashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("overview");
  const [overviewActiveCard, setOverviewActiveCard] = useState("pending");
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
    priority: "normal",
    reference: "",
    purpose: "",
    jobNumber: "",
    additionalInformation: "",
    deckOrEngine: "",
  });
  const [offShoreNumber, setOffShoreNumber] = useState("");
  const [loadingOffshoreNumber, setLoadingOffshoreNumber] = useState(false);

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
  const [requestImages, setRequestImages] = useState([]); // items: { id, file, previewUrl }
  const imageInputRef = useRef(null);
  const [imageDragActive, setImageDragActive] = useState(false);

  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [invName, setInvName] = useState("");
  const [invMaker, setInvMaker] = useState("");
  const [invMakerPartNo, setInvMakerPartNo] = useState("");
  const [creatingInventory, setCreatingInventory] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mySubmittedRequests, setMySubmittedRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [requestType, setRequestType] = useState("inventory"); // "inventory" or "services"
  const [pendingUnreadCount, setPendingUnreadCount] = useState(0);
  const [rejectedUnreadCount, setRejectedUnreadCount] = useState(0); // Service Table State

  const [serviceRows, setServiceRows] = useState([
    { description: "", amount: "" },
  ]);
  const [materialRows, setMaterialRows] = useState([
    { description: "", quantity: "" },
  ]);

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

  const fetchSidebarPendingUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Fetch pending unread
      const pendingResp = await axios.get(
        `${API_BASE_URL}/requests/pending?limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const pendingUnread =
        typeof pendingResp.data.unreadCount === "number"
          ? pendingResp.data.unreadCount
          : pendingResp.data?.data?.filter?.((r) => r.isUnread).length ?? 0;

      // Fetch queried unread
      const queriedResp = await axios.get(
        `${API_BASE_URL}/requests/queried?limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const queriedUnread =
        typeof queriedResp.data.unreadCount === "number"
          ? queriedResp.data.unreadCount
          : queriedResp.data?.data?.filter?.((r) => r.isUnread).length ?? 0;

      // Combine both
      const totalUnread = pendingUnread + queriedUnread;
      setPendingUnreadCount(totalUnread);
    } catch (err) {
      setPendingUnreadCount(0);
    }
  };
  const fetchRejectedUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      // Fetch only 1 item, but get the total unread count from the API response
      const resp = await axios.get(
        `${API_BASE_URL}/requests/rejected?limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // If your API returns unreadCount, use it; otherwise, count isUnread in data
      const unread =
        resp.data?.data?.filter?.((r) => r.isUnread).length ??
        (Array.isArray(resp.data?.data) ? resp.data.data.length : 0);
      setRejectedUnreadCount(unread);
    } catch {
      setRejectedUnreadCount(0);
    }
  };
  useEffect(() => {
    if (user) {
      fetchSidebarPendingUnreadCount();
      fetchRejectedUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchSidebarPendingUnreadCount();
    }, 3000); // every 3 seconds
    return () => clearInterval(interval);
  }, [user]);
  const fetchUnreadCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const resp = await axios.get(
        "https://hdp-backend-1vcl.onrender.com/api/notifications/unread-count",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCount(resp.data?.unreadCount || 0);
    } catch (err) {
      setUnreadCount(0);
    }
  };
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchMySubmittedRequests = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(
        `${API_BASE_URL}/requests/submitted?limit=1`, // get total count only
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMySubmittedRequests(response.data.data || []);
      setMySubmittedRequestsTotal(response.data.total || 0);
    } catch (err) {
      setMySubmittedRequests([]);
      setMySubmittedRequestsTotal(0);
    }
  };

  useEffect(() => {
    if (user && (activeView === "overview" || activeView === "myrequests")) {
      fetchMySubmittedRequests();
    }
  }, [user, activeView]);
  const [mySubmittedRequestsTotal, setMySubmittedRequestsTotal] = useState(0);

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

    // compute new form state in one place
    setFormData((prev) => {
      const next = {
        ...prev,
        [name]: value,
      };

      if (name === "destination") {
        // reset vessel and project manager when destination changes
        next.vesselId = "";
        next.projectManager = "";
        // reset deckOrEngine and offShoreNumber when destination changes
        next.deckOrEngine = "";
        setOffShoreNumber("");
      }

      return next;
    });

    // If deckOrEngine changes, fetch offShoreNumber (placeholder for now)
    if (name === "deckOrEngine" && value) {
      fetchOffshoreNumber(value);
    }
  };

  // Fetch offshore request number from API
  const fetchOffshoreNumber = async (department) => {
    try {
      setLoadingOffshoreNumber(true);
      setOffShoreNumber("");

      const token = getToken();
      if (!token) {
        console.error("No token found for offshore number fetch");
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/requests/generate-offshore-id?department=${encodeURIComponent(
          department
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const offshoreId =
        response.data?.offshoreReqNumber ||
        response.data?.data?.offshoreReqNumber ||
        "";
      setOffShoreNumber(offshoreId);
      console.log("✅ Offshore Number Generated:", offshoreId);
    } catch (err) {
      console.error("❌ Error fetching offshore number:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
      });
      setOffShoreNumber("");
    } finally {
      setLoadingOffshoreNumber(false);
    }
  };
  const openAddInventoryModal = () => {
    // prefill department from current form/user department and clear fields
    setInvName("");
    setInvMaker("");
    setInvMakerPartNo("");
    setShowAddInventoryModal(true);
  };

  const closeAddInventoryModal = () => {
    setShowAddInventoryModal(false);
    setInvName("");
    setInvMaker("");
    setInvMakerPartNo("");
  };

  const submitAddInventory = async () => {
    if (!invName || invName.trim() === "") {
      alert("Name is required to add an inventory item.");
      return;
    }

    try {
      setCreatingInventory(true);
      const token = getToken();
      if (!token) {
        alert("Authentication required.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Minimal payload: department (from formData or user), name, maker, makerPartNumber, quantity default 0
      const payload = {
        department: formData.department || user?.department || "",
        name: invName.trim(),
        quantity: 0,
      };
      if (invMaker && invMaker.trim() !== "") payload.maker = invMaker.trim();
      if (invMakerPartNo && invMakerPartNo.trim() !== "")
        payload.makerPartNumber = invMakerPartNo.trim();

      const resp = await axios.post(`${API_BASE_URL}/inventory`, payload, {
        headers,
      });

      const created = resp.data?.data || resp.data;
      if (created) {
        // Add to local inventory list so dropdown shows it immediately
        setInventoryItems((prev) => [created, ...(prev || [])]);

        // Select the newly created item into the request (assume created contains id/name)
        try {
          handleAddInventoryItem(created);
        } catch (err) {
          // fallback: just close modal and refresh inventory
        }

        // Refresh server inventory to keep consistent
        fetchInventory();

        alert("Inventory added.");
        closeAddInventoryModal();
        return;
      }

      throw new Error("Unexpected create response");
    } catch (err) {
      console.error("Error creating inventory item:", err);
      alert(err?.response?.data?.message || "Failed to add inventory item");
    } finally {
      setCreatingInventory(false);
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

      const hasFiles = invoiceFiles.length > 0 || requestImages.length > 0;

      if (hasFiles) {
        const fd = new FormData();
        fd.append("department", formData.department);
        fd.append("destination", formData.destination);
        fd.append("purpose", formData.purpose || "");
        if (formData.vesselId) fd.append("vesselId", formData.vesselId);
        if (formData.priority) fd.append("priority", formData.priority);
        if (formData.reference) fd.append("reference", formData.reference);
        if (formData.company) fd.append("companyId", formData.company);
        if (formData.projectManager)
          fd.append("projectManager", formData.projectManager);

        if (formData.jobNumber) {
          fd.append("jobNumber", formData.jobNumber);
        }

        if (formData.additionalInformation) {
          fd.append("additionalInformation", formData.additionalInformation);
        }
        // Add offshore number for Marine destination
        if (formData.destination === "Marine" && offShoreNumber) {
          fd.append("offshoreReqNumber", offShoreNumber);
        }

        if (formData.destination === "Marine" && formData.deckOrEngine) {
          fd.append("deckOrEngine", formData.deckOrEngine);
        }

        // items must be a JSON string when using multipart
        fd.append("items", JSON.stringify(items));

        // attach invoice files (non-image documents)
        invoiceFiles.forEach((f) => {
          if (f && f.file) {
            fd.append("invoiceFiles", f.file);
          }
        });

        // attach request images
        requestImages.forEach((f) => {
          if (f && f.file) {
            fd.append("requestImages", f.file);
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

        if (formData.additionalInformation) {
          payload.additionalInformation = formData.additionalInformation;
        }
        if (formData.jobNumber) {
          payload.jobNumber = formData.jobNumber;
        }

        // Add offshore number for Marine destination
        if (formData.destination === "Marine" && offShoreNumber) {
          payload.offshoreReqNumber = offShoreNumber;
        }

        if (formData.destination === "Marine" && formData.deckOrEngine) {
          payload.deckOrEngine = formData.deckOrEngine;
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
        priority: "normal",
        reference: "",
        purpose: "",
        additionalInformation: "",
        jobNumber: "",
        deckOrEngine: "",
      });
      setSelectedItems([]);
      setInvoiceFiles([]);
      setRequestImages([]);
      setOffShoreNumber("");

      // Switch to My Requests view
      setActiveView("myrequests");
    } catch (err) {
      console.error("❌ Error creating request:", err);
      alert(err.response?.data?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

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
      setActionLoading(true);
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const url = `${API_BASE_URL}/requests/${encodeURIComponent(
        requestId
      )}/approve`;
      const resp = await axios.post(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (resp?.status === 200 || resp?.status === 201) {
        await fetchMyRequests();
        alert(resp.data?.message || "Request approved successfully");
        setActiveView("pending");
        return;
      }
      alert(resp.data?.message || "Unexpected response from server");
    } catch (err) {
      console.error("Error approving request:", err);
      alert(err?.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (requestId) => {
    try {
      setActionLoading(true);
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
      setActionLoading(false);
    }
  };

  const handleQuery = async (requestId) => {
    try {
      setActionLoading(true);
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
      setActionLoading(false);
    }
  };
  // ...existing code...

  const fetchPendingCount = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const resp = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pendingRequests = resp.data.data || [];
      setPendingCount(pendingRequests.length);
      setMyRequests(pendingRequests); // keep myRequests in sync if needed
    } catch (err) {
      setPendingCount(0);
      setMyRequests([]);
    }
  };

  useEffect(() => {
    if (user && (activeView === "pending" || activeView === "overview")) {
      fetchPendingCount();
    }
  }, [user, activeView]);

  // ...use pendingCount everywhere you need the count...

  const totalRequestsCount = mySubmittedRequestsTotal;
  const approvedCount = myRequests.filter(
    (r) => String(r.status).toLowerCase() === "approved"
  ).length;

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInvoiceInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invoiceEntries = [];
    const imageEntries = [];

    files.forEach((file) => {
      const entry = {
        id: `${file.name}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      };

      if (file.type.startsWith("image/")) {
        imageEntries.push(entry);
      } else {
        invoiceEntries.push(entry);
      }
    });

    if (invoiceEntries.length > 0) {
      setInvoiceFiles((prev) => [...prev, ...invoiceEntries]);
    }
    if (imageEntries.length > 0) {
      setRequestImages((prev) => [...prev, ...imageEntries]);
    }

    // reset input so same file can be selected again if needed
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length === 0) return;

    const invoiceEntries = [];
    const imageEntries = [];

    files.forEach((file) => {
      const entry = {
        id: `${file.name}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      };

      if (file.type.startsWith("image/")) {
        imageEntries.push(entry);
      } else {
        invoiceEntries.push(entry);
      }
    });

    if (invoiceEntries.length > 0) {
      setInvoiceFiles((prev) => [...prev, ...invoiceEntries]);
    }
    if (imageEntries.length > 0) {
      setRequestImages((prev) => [...prev, ...imageEntries]);
    }
  };

  const handleImageBrowseClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageInputChange = (e) => {
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
    setRequestImages((prev) => [...prev, ...entries]);
    e.target.value = null;
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setImageDragActive(false);
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
    setRequestImages((prev) => [...prev, ...entries]);
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    setImageDragActive(true);
  };

  const handleImageDragLeave = () => {
    setImageDragActive(false);
  };

  const removeRequestImage = (id) => {
    setRequestImages((prev) => {
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
  const handleItemFieldChange = (index, field, value) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
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
          pendingCount={pendingUnreadCount} // <-- for sidebar badge
          rejectedCount={rejectedUnreadCount}
          isRequester={true}
          selectedRequestOrigin={selectedRequest?.origin}
          notificationCount={unreadCount}
        />

        {activeView === "chatRoom" && <ChatRoom />}
        {activeView === "support" && <Support />}

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
                  : activeView === "myrequests"
                  ? "My Requests"
                  : activeView === "completed"
                  ? "Completed Requests"
                  : activeView === "overview"
                  ? "Overview"
                  : activeView === "rejected"
                  ? "Rejected Requests"
                  : activeView === "shipping"
                  ? "Shipping Request"
                  : activeView === "detail"
                  ? "Request Details"
                  : ""}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {activeView === "createNew"
                  ? "Fill in the details below to submit your request"
                  : activeView === "pending"
                  ? "View and track your submitted requests"
                  : activeView === "myrequests"
                  ? "View all your submitted requests"
                  : activeView === "completed"
                  ? "View completed requests"
                  : activeView === "overview"
                  ? "Requester dashboard"
                  : activeView === "shipping"
                  ? "Shipping dashboard"
                  : activeView === "detail"
                  ? "View request details"
                  : ""}
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

                  {/* Job Number - Only show when destination is NOT Marine */}
                  {formData.destination &&
                    formData.destination !== "Marine" && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                          Job Number
                        </label>
                        <input
                          type="text"
                          name="jobNumber"
                          value={formData.jobNumber}
                          onChange={handleInputChange}
                          placeholder="Enter job number"
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm"
                        />
                      </div>
                    )}

                  {/* Deck or Engine & OffShore Number - Only show when destination is Marine */}
                  {formData.destination === "Marine" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Deck or Engine - Radio Buttons */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                          Deck or Engine
                        </label>
                        <div className="flex items-center gap-6 h-12">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="deckOrEngine"
                              value="Deck"
                              checked={formData.deckOrEngine === "Deck"}
                              onChange={handleInputChange}
                              className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              Deck
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="deckOrEngine"
                              value="Engine"
                              checked={formData.deckOrEngine === "Engine"}
                              onChange={handleInputChange}
                              className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                            />
                            <span className="text-sm font-medium text-slate-700">
                              Engine
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* OffShore Number - Read-only, fetched from database */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                          OffShore Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={
                              loadingOffshoreNumber
                                ? "Loading..."
                                : offShoreNumber
                            }
                            readOnly
                            disabled
                            placeholder={
                              formData.deckOrEngine
                                ? "Fetching..."
                                : "Select Deck or Engine first"
                            }
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-600 cursor-not-allowed text-sm"
                          />
                          {loadingOffshoreNumber && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                      Request Type
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="requestType"
                          value="inventory"
                          checked={requestType === "inventory"}
                          onChange={() => setRequestType("inventory")}
                          className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Inventory
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="requestType"
                          value="services"
                          checked={requestType === "services"}
                          onChange={() => setRequestType("services")}
                          className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                        />
                        <span className="text-sm font-medium text-slate-700">
                          Services
                        </span>
                      </label>
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
                  {requestType === "inventory" && (
                    <>
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
                          {/* Dropdown */}
                          {showInventoryDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden flex flex-col overflow-x-hidden">
                              {/* Search */}
                              <div className="p-3 border-b border-slate-200">
                                <input
                                  type="text"
                                  value={searchTerm}
                                  onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                  }
                                  placeholder="Search items..."
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-400 text-sm"
                                />
                              </div>

                              {/* Items List (scrollable) */}
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
                                  filteredInventory.map((item, index) => {
                                    // Helper to insert line breaks every 40 characters
                                    const wrapText = (text, maxChars = 40) => {
                                      if (!text) return "";
                                      const str = String(text);
                                      const lines = [];
                                      for (
                                        let i = 0;
                                        i < str.length;
                                        i += maxChars
                                      ) {
                                        lines.push(str.slice(i, i + maxChars));
                                      }
                                      return lines.join("\n");
                                    };

                                    return (
                                      <button
                                        key={`${
                                          item._id || item.inventoryId || index
                                        }`}
                                        type="button"
                                        onClick={() =>
                                          handleAddInventoryItem(item)
                                        }
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 overflow-hidden"
                                      >
                                        <p className="font-medium text-slate-900 text-sm whitespace-pre-wrap">
                                          {wrapText(item.name, 40)}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">
                                          {wrapText(
                                            `${
                                              item.itemType ||
                                              item.makersType ||
                                              ""
                                            } • ${item.maker || ""} • ${
                                              item.makersPartNo || ""
                                            }`,
                                            40
                                          )}
                                        </p>
                                      </button>
                                    );
                                  })
                                )}
                              </div>

                              {/* Sticky footer: Add to inventory */}
                              <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Add a new empty editable row
                                    setSelectedItems((prev) => [
                                      ...prev,
                                      {
                                        name: "",
                                        itemType: "",
                                        maker: "",
                                        makersPartNo: "",
                                        quantity: 1,
                                        unitPrice: 0,
                                        currency: "NGN",
                                        totalPrice: 0,
                                        uniqueId: `new-${Date.now()}`,
                                        isNew: true, // mark as new
                                      },
                                    ]);
                                    setShowInventoryDropdown(false);
                                    setSearchTerm("");
                                  }}
                                  className="w-full max-w-md px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-600 font-semibold hover:bg-emerald-100 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <MdAdd className="text-xl" />
                                  Add Item
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Selected Items Table */}
                      </div>

                      {selectedItems.length > 0 && (
                        <ItemSelectionTable
                          items={selectedItems}
                          onQuantityChange={handleQuantityChange}
                          onRemoveItem={handleRemoveItem}
                          onUnitPriceChange={handleUnitPriceChange}
                          onCurrencyChange={handleCurrencyChange}
                          onFieldChange={handleItemFieldChange} // <-- pass this
                          currencies={currencies}
                        />
                      )}

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
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                          Additional Information
                        </label>
                        <input
                          type="text"
                          name="additionalInformation"
                          value={formData.additionalInformation}
                          onChange={handleInputChange}
                          placeholder="Optional additional information"
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm"
                        />
                      </div>
                    </>
                  )}
                  {requestType === "services" && (
                    <>
                      <ServiceTable
                        rows={serviceRows}
                        setRows={setServiceRows}
                      />
                      <MaterialTable
                        rows={materialRows}
                        setRows={setMaterialRows}
                      />
                    </>
                  )}

                  {/* Request Images Upload (for purchaseOrder & pettyCash) */}
                  {formData.destination && (
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                        Upload Image
                      </label>

                      <div
                        className="w-full rounded-2xl p-4 flex items-center justify-between gap-4 border-2 border-dashed border-slate-200 bg-white/50"
                        // Removed all drag/drop/click handlers here
                        style={{ cursor: "default" }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
                            📷
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {requestImages.length > 0
                                ? `${requestImages.length} image(s) selected`
                                : "Click 'Add Images' to select request image(s)"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleImageBrowseClick}
                            className="px-3 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] text-sm"
                          >
                            Add Images
                          </button>

                          {requestImages.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setRequestImages([])}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-sm"
                            >
                              Clear All
                            </button>
                          )}
                        </div>

                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageInputChange}
                          className="hidden"
                        />
                      </div>

                      {requestImages.length > 0 && (
                        <div className="mt-3 grid gap-2">
                          {requestImages.map((f) => (
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
                                      IMG
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
                                  onClick={() => removeRequestImage(f.id)}
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
            {activeView === "notifications" && (
              <Notification onUnreadCountChange={fetchUnreadCount} />
            )}
            {activeView === "detail" && selectedRequest && (
              <RequestDetailView
                request={selectedRequest}
                onBack={() => {
                  // Go back to the origin view, or default to pending
                  const origin = selectedRequest?.origin || "pending";
                  setSelectedRequest(null);
                  setActiveView(origin);
                }}
                isReadOnly={selectedRequestReadOnly}
                onApprove={handleApprove}
                onReject={handleReject}
                onQuery={handleQuery}
                vendors={vendors}
                actionLoading={actionLoading}
              />
            )}
            {(activeView === "completed" || activeView === "rejected") && (
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
                  </div>
                </div>

                {activeView === "completed" && (
                  <CompletedRequests
                    searchQuery={searchQuery}
                    filterType={filterType}
                    onOpenDetail={(req) =>
                      handleOpenDetail(req, {
                        readOnly: true,
                        origin: "completed",
                      })
                    }
                  />
                )}

                {activeView === "rejected" && (
                  <RejectedRequest
                    searchQuery={searchQuery}
                    filterType={filterType}
                    onOpenDetail={(req, opts = {}) => {
                      handleOpenDetail(req, { ...opts, origin: "rejected" });
                    }}
                    onUnreadChange={setRejectedUnreadCount}
                  />
                )}
              </>
            )}
            {activeView === "myrequests" && (
              <RequesterHistory
                searchQuery={searchQuery}
                filterType={filterType}
                onOpenDetail={(req, opts = {}) => {
                  // ensure history opens detail read-only with correct origin
                  handleOpenDetail(req, {
                    ...opts,
                    readOnly: true,
                    origin: "myrequests",
                  });
                }}
              />
            )}

            {/* My Requests View - Placeholder */}
            {activeView === "pending" && (
              <RequesterPending
                searchQuery={searchQuery}
                filterType={filterType}
                onOpenDetail={(req, opts = {}) => {
                  handleOpenDetail(req, { ...opts, origin: "pending" });
                }}
                onUnreadChange={fetchSidebarPendingUnreadCount} // <-- pass this
                setPendingUnreadCount={setPendingUnreadCount}
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
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Pending Requests Card */}
                  <button
                    onClick={() => setOverviewActiveCard("pending")}
                    className={`bg-white/90 backdrop-blur-xl border-2 rounded-2xl p-6 shadow-lg text-left transition-all duration-200 hover:shadow-xl ${
                      overviewActiveCard === "pending"
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          overviewActiveCard === "pending"
                            ? "bg-emerald-500 shadow-emerald-500/30"
                            : "bg-orange-500 shadow-orange-500/20"
                        }`}
                      >
                        <MdPendingActions className="text-2xl text-white" />
                      </div>
                      {overviewActiveCard === "pending" && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mb-1 font-semibold">
                      Pending Requests
                    </p>
                    <p className="text-slate-900 text-3xl font-bold">
                      {pendingCount}
                    </p>
                  </button>

                  {/* My Requests Card */}
                  <button
                    onClick={() => setOverviewActiveCard("myrequests")}
                    className={`bg-white/90 backdrop-blur-xl border-2 rounded-2xl p-6 shadow-lg text-left transition-all duration-200 hover:shadow-xl ${
                      overviewActiveCard === "myrequests"
                        ? "border-emerald-500 ring-2 ring-emerald-500/30"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                          overviewActiveCard === "myrequests"
                            ? "bg-emerald-500 shadow-emerald-500/30"
                            : "bg-emerald-500 shadow-emerald-500/20"
                        }`}
                      >
                        <MdDirectionsBoat className="text-2xl text-white" />
                      </div>
                      {overviewActiveCard === "myrequests" && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mb-1 font-semibold">
                      My Requests
                    </p>
                    <p className="text-slate-900 text-3xl font-bold">
                      {totalRequestsCount}
                    </p>
                  </button>

                  {/* Create Request Card - Navigates to createNew */}
                  <button
                    onClick={() => setActiveView("createNew")}
                    className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg text-left transition-all duration-200 hover:shadow-xl hover:border-purple-400 hover:ring-2 hover:ring-purple-400/30 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-200">
                        <MdAdd className="text-2xl text-white" />
                      </div>
                      <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Click to create
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mb-1 font-semibold">
                      Create Request
                    </p>
                    <p className="text-slate-900 text-lg font-bold">
                      New Request →
                    </p>
                  </button>
                </div>

                {/* Section Title */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">
                    {overviewActiveCard === "pending"
                      ? "Pending Requests"
                      : "My Requests"}
                  </h2>
                  <button
                    onClick={() =>
                      setActiveView(
                        overviewActiveCard === "pending"
                          ? "pending"
                          : "myrequests"
                      )
                    }
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    View All →
                  </button>
                </div>

                {/* Dynamic Content based on active card */}
                {overviewActiveCard === "pending" && (
                  <RequesterPending
                    searchQuery=""
                    filterType="all"
                    onOpenDetail={(req, opts = {}) => {
                      handleOpenDetail(req, { ...opts, origin: "pending" });
                    }}
                  />
                )}

                {overviewActiveCard === "myrequests" && (
                  <RequesterHistory
                    searchQuery=""
                    filterType="all"
                    onOpenDetail={(req, opts = {}) => {
                      handleOpenDetail(req, {
                        ...opts,
                        readOnly: true,
                        origin: "myrequests",
                      });
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Inventory Modal (Requester Dashboard) */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeAddInventoryModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] md:w-[520px] p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Add Inventory
              </h3>
              <button
                onClick={closeAddInventoryModal}
                className="px-3 py-1 text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-slate-500">Department</label>
                <input
                  value={formData.department || user?.department || ""}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">Name *</label>
                <input
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="Item name"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  Maker (optional)
                </label>
                <input
                  value={invMaker}
                  onChange={(e) => setInvMaker(e.target.value)}
                  placeholder="Maker"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500">
                  Maker Part No (optional)
                </label>
                <input
                  value={invMakerPartNo}
                  onChange={(e) => setInvMakerPartNo(e.target.value)}
                  placeholder="Maker part number"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeAddInventoryModal}
                className="px-4 py-2 rounded-lg border"
              >
                Cancel
              </button>
              <button
                onClick={submitAddInventory}
                disabled={creatingInventory}
                className="px-4 py-2 rounded-lg bg-[#036173] text-white"
              >
                {creatingInventory ? "Adding..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequesterDashboard;
