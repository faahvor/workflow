// src/components/pages/dashboards/ProcurementCreateRequest.jsx

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MdAdd } from "react-icons/md";
import ItemSelectionTable from "../../shared/tables/ItemSelectionTable";
import { useAuth } from "../../context/AuthContext";

const ProcurementCreateRequest = ({ onRequestCreated }) => {
  const { user, getToken } = useAuth();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  // Destinations/Departments list
  const departments = [
    { name: "Procurement" },
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

  const priorities = [
    { value: "normal", label: "Normal" },
    { value: "high", label: "High" },
  ];

  // Form state
  const [formData, setFormData] = useState({
    department: "Procurement",
    destination: "",
    company: "",
    vesselId: "",
    projectManager: "",
    requestType: "purchaseOrder",
    priority: "normal",
    reference: "",
    purpose: "",
    jobNumber: "",
    additionalInformation: "",
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
  const [companiesList, setCompaniesList] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [invoiceFiles, setInvoiceFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [requestImages, setRequestImages] = useState([]);
  const [imageDragActive, setImageDragActive] = useState(false);
  const [nextApproverAfterVesselManager, setNextApproverAfterVesselManager] = useState("");
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [invName, setInvName] = useState("");
  const [invMaker, setInvMaker] = useState("");
  const [invMakerPartNo, setInvMakerPartNo] = useState("");
  const [creatingInventory, setCreatingInventory] = useState(false);

  // Set fixed valid currencies
  useEffect(() => {
    const validCurrencies = ["NGN", "USD", "GBP", "EUR", "JPY", "CNY", "CAD", "AUD"];
    setCurrencies(validCurrencies.map((c) => ({ value: c, label: c })));
  }, []);

  const isPettyCashForIT =
    formData.requestType === "pettyCash" && formData.destination === "IT";

  const displayRequestType =
    formData.requestType === "pettyCash" && formData.destination !== "IT"
      ? "purchaseOrder"
      : formData.requestType;

  // Fetch companies
  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const token = await getToken();
      if (!token) return;
      const resp = await axios.get(`${API_BASE_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompaniesList(resp.data?.data || resp.data || []);
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Fetch vessels
  const fetchVessels = async () => {
    try {
      setLoadingVessels(true);
      const token = await getToken();
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVessels(response.data.data || []);
    } catch (err) {
      console.error("Error fetching vessels:", err);
    } finally {
      setLoadingVessels(false);
    }
  };

  // Fetch inventory items
  const fetchInventory = async () => {
    try {
      setLoadingInventory(true);
      const token = await getToken();
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems(response.data.data || response.data || []);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Fetch project managers
  const fetchProjectManagers = async () => {
    try {
      setLoadingProjectManagers(true);
      const response = {
        data: [
          { id: "PM-001", name: "John Doe" },
          { id: "PM-002", name: "Jane Smith" },
          { id: "PM-003", name: "Bob Wilson" },
        ],
      };
      setProjectManagers(response.data || []);
    } catch (err) {
      console.error("Error fetching project managers:", err);
    } finally {
      setLoadingProjectManagers(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInventory();
      fetchVessels();
      fetchCompanies();
    }
  }, [user]);

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

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "destination") {
        next.vesselId = "";
        next.projectManager = "";
      }
      return next;
    });

    if (name === "destination" && value !== "IT" && invoiceFiles.length > 0) {
      setInvoiceFiles([]);
    }

    const newDestination = name === "destination" ? value : formData.destination || "";
    const newRequestType = name === "requestType" ? value : formData.requestType || "";
    const shouldShowApprovalPick = newDestination === "Marine" && newRequestType === "pettyCash";

    if (!shouldShowApprovalPick && nextApproverAfterVesselManager) {
      setNextApproverAfterVesselManager("");
    }
  };

  const openAddInventoryModal = () => {
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
      const token = await getToken();
      if (!token) {
        alert("Authentication required.");
        return;
      }

      const payload = {
        department: formData.department || "Procurement",
        name: invName.trim(),
        quantity: 0,
      };
      if (invMaker && invMaker.trim() !== "") payload.maker = invMaker.trim();
      if (invMakerPartNo && invMakerPartNo.trim() !== "")
        payload.makerPartNumber = invMakerPartNo.trim();

      const resp = await axios.post(`${API_BASE_URL}/inventory`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const created = resp.data?.data || resp.data;
      if (created) {
        setInventoryItems((prev) => [created, ...(prev || [])]);
        handleAddInventoryItem(created);
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

  const handleRemoveItem = (index) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

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

    if (!formData.department) {
      alert("Please select a department");
      return;
    }

    if (!formData.destination) {
      alert("Please select a destination");
      return;
    }

    if (!formData.company) {
      alert("Please select a company");
      return;
    }

    if (
      (formData.destination === "Marine" || formData.destination === "Project") &&
      !formData.vesselId
    ) {
      alert("Please select a vessel");
      return;
    }

    if (formData.destination === "Project" && !formData.projectManager) {
      alert("Please select a project manager");
      return;
    }

    if (
      formData.destination === "Marine" &&
      formData.requestType === "pettyCash" &&
      !nextApproverAfterVesselManager
    ) {
      alert("Please select Approval Pick (Technical Manager or Fleet Manager).");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please add at least one item from inventory");
      return;
    }

    const invalidItems = selectedItems.filter((item) => !item.quantity || item.quantity < 1);
    if (invalidItems.length > 0) {
      alert("All items must have a quantity of at least 1");
      return;
    }

    if (isPettyCashForIT) {
      const badPrice = selectedItems.find((it) => !it.unitPrice || Number(it.unitPrice) <= 0);
      if (badPrice) {
        alert("For petty cash requests to IT each item must have a unit price greater than 0.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = await getToken();

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
        fd.append("requestType", formData.requestType);
        fd.append("purpose", formData.purpose || "");
        if (formData.vesselId) fd.append("vesselId", formData.vesselId);
        if (formData.priority) fd.append("priority", formData.priority);
        if (formData.reference) fd.append("reference", formData.reference);
        if (formData.company) fd.append("companyId", formData.company);
        if (formData.projectManager) fd.append("projectManager", formData.projectManager);
        if (nextApproverAfterVesselManager) {
          fd.append("nextApproverAfterVesselManager", nextApproverAfterVesselManager);
        }
        if (formData.jobNumber) fd.append("jobNumber", formData.jobNumber);
        if (formData.additionalInformation) {
          fd.append("additionalInformation", formData.additionalInformation);
        }
        fd.append("items", JSON.stringify(items));

        invoiceFiles.forEach((f) => {
          if (f && f.file) fd.append("invoiceFiles", f.file);
        });
        requestImages.forEach((f) => {
          if (f && f.file) fd.append("requestImages", f.file);
        });

        await axios.post(`${API_BASE_URL}/requests`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const payload = {
          department: formData.department,
          destination: formData.destination,
          requestType: formData.requestType,
          purpose: formData.purpose,
          items: items,
        };

        if (formData.vesselId) payload.vesselId = formData.vesselId;
        if (formData.reference) payload.reference = formData.reference;
        if (formData.priority) payload.priority = formData.priority;
        if (formData.company) payload.companyId = formData.company;
        if (formData.projectManager) payload.projectManager = formData.projectManager;
        if (nextApproverAfterVesselManager) {
          payload.nextApproverAfterVesselManager = nextApproverAfterVesselManager;
        }
        if (formData.additionalInformation) {
          payload.additionalInformation = formData.additionalInformation;
        }
        if (formData.jobNumber) payload.jobNumber = formData.jobNumber;

        await axios.post(`${API_BASE_URL}/requests`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      alert("Request created successfully!");

      // Reset form
      setFormData({
        department: "Procurement",
        destination: "",
        company: "",
        vesselId: "",
        projectManager: "",
        requestType: "purchaseOrder",
        priority: "normal",
        reference: "",
        purpose: "",
        additionalInformation: "",
        jobNumber: "",
      });
      setSelectedItems([]);
      setInvoiceFiles([]);
      setRequestImages([]);
      setNextApproverAfterVesselManager("");

      // Callback to parent
      if (typeof onRequestCreated === "function") {
        onRequestCreated();
      }
    } catch (err) {
      console.error("Error creating request:", err);
      alert(err.response?.data?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  // File handling
  const handleBrowseClick = () => fileInputRef.current?.click();
  const handleImageBrowseClick = () => imageInputRef.current?.click();

  const handleInvoiceInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invoiceEntries = [];
    const imageEntries = [];

    files.forEach((file) => {
      const entry = {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      };

      if (file.type.startsWith("image/")) {
        imageEntries.push(entry);
      } else {
        invoiceEntries.push(entry);
      }
    });

    if (invoiceEntries.length > 0) setInvoiceFiles((prev) => [...prev, ...invoiceEntries]);
    if (imageEntries.length > 0) setRequestImages((prev) => [...prev, ...imageEntries]);
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
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      };

      if (file.type.startsWith("image/")) {
        imageEntries.push(entry);
      } else {
        invoiceEntries.push(entry);
      }
    });

    if (invoiceEntries.length > 0) setInvoiceFiles((prev) => [...prev, ...invoiceEntries]);
    if (imageEntries.length > 0) setRequestImages((prev) => [...prev, ...imageEntries]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };
  const handleDragLeave = () => setDragActive(false);

  const handleImageInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const entries = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
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
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setRequestImages((prev) => [...prev, ...entries]);
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    setImageDragActive(true);
  };
  const handleImageDragLeave = () => setImageDragActive(false);

  const removeInvoiceFile = (id) => {
    setInvoiceFiles((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.previewUrl) {
        try {
          URL.revokeObjectURL(found.previewUrl);
        } catch {}
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const removeRequestImage = (id) => {
    setRequestImages((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.previewUrl) {
        try {
          URL.revokeObjectURL(found.previewUrl);
        } catch {}
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmitRequest}
        className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 md:p-8 shadow-lg"
      >
        <div className="space-y-6">
          {/* Row 1: Department (dropdown) & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                required
              >
                {departments.map((dept) => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
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
                Job Number/Offshore Number
              </label>
              <input
                type="text"
                name="jobNumber"
                value={formData.jobNumber}
                onChange={handleInputChange}
                placeholder="Enter job number/offshore number"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Row 2: Company & Vessel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {loadingCompanies ? "Loading companies..." : "Select Company"}
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

            {formData.destination === "Marine" && formData.requestType === "pettyCash" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Approval Pick *
                </label>
                <select
                  name="nextApproverAfterVesselManager"
                  value={nextApproverAfterVesselManager}
                  onChange={(e) => setNextApproverAfterVesselManager(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                  required
                >
                  <option value="">Select Approver</option>
                  <option value="Technical Manager">Technical Manager</option>
                  <option value="Fleet Manager">Fleet Manager</option>
                </select>
              </div>
            )}

            {(formData.destination === "Marine" || formData.destination === "Project") && (
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
                    {loadingVessels ? "Loading vessels..." : "Select Vessel"}
                  </option>
                  {vessels
                    .filter((vessel) => vessel.status === "active")
                    .map((vessel) => (
                      <option key={vessel.vesselId} value={vessel.vesselId}>
                        {vessel.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

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
                  {loadingProjectManagers ? "Loading..." : "Select Project Manager"}
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

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowInventoryDropdown(!showInventoryDropdown)}
                className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-600 font-semibold hover:bg-emerald-100 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MdAdd className="text-xl" />
                Add Item from Inventory
              </button>

              {showInventoryDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-slate-200">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search items..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-400 text-sm"
                    />
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {loadingInventory ? (
                      <div className="p-4 text-center text-slate-500">Loading...</div>
                    ) : filteredInventory.length === 0 ? (
                      <div className="p-4 text-center text-slate-500">No items found</div>
                    ) : (
                      filteredInventory.map((item, index) => (
                        <button
                          key={`${item._id || item.inventoryId || index}`}
                          type="button"
                          onClick={() => handleAddInventoryItem(item)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                        >
                          <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.itemType || item.makersType} • {item.maker} • {item.makersPartNo}
                          </p>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={openAddInventoryModal}
                      className="w-full max-w-md px-4 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-emerald-600 font-semibold hover:bg-emerald-100 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <MdAdd className="text-xl" />
                      Add Item
                    </button>
                  </div>
                </div>
              )}
            </div>

            {selectedItems.length > 0 && (
              <ItemSelectionTable
                items={selectedItems}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                onUnitPriceChange={handleUnitPriceChange}
                onCurrencyChange={handleCurrencyChange}
                currencies={currencies}
                requestType={displayRequestType}
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

          {/* Upload Invoices - Only for Petty Cash to IT */}
          {isPettyCashForIT && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Upload Invoices
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                    className="px-3 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] text-sm"
                  >
                    Add Files
                  </button>

                  {invoiceFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInvoiceFiles([]);
                      }}
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
                              {f.file.type === "application/pdf" ? "PDF" : "FILE"}
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
                      <button
                        type="button"
                        onClick={() => removeInvoiceFile(f.id)}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload Request Images - Always available */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Upload Images (Optional)
            </label>

            <div
              onDrop={handleImageDrop}
              onDragOver={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onClick={handleImageBrowseClick}
              role="button"
              tabIndex={0}
              className={`w-full cursor-pointer rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 ${
                imageDragActive
                  ? "border-2 border-emerald-400 bg-emerald-50"
                  : "border-2 border-dashed border-slate-200 bg-white/50"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
                  🖼️
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {requestImages.length > 0
                      ? `${requestImages.length} image(s) selected`
                      : "Drag & drop image(s) here, or click to browse"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageBrowseClick();
                  }}
                  className="px-3 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] text-sm"
                >
                  Add Images
                </button>

                {requestImages.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRequestImages([]);
                    }}
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
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {requestImages.map((f) => (
                  <div
                    key={f.id}
                    className="relative bg-white border border-slate-100 rounded-lg p-2"
                  >
                    <div className="w-full h-24 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                      {f.previewUrl ? (
                        <img
                          src={f.previewUrl}
                          alt={f.file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-600 text-sm px-2 text-center">IMG</div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 truncate">{f.file.name}</p>
                    <button
                      type="button"
                      onClick={() => removeRequestImage(f.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full px-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                submitting
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#036173] to-teal-600 hover:from-[#024f5c] hover:to-teal-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating Request...
                </span>
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Add Inventory Modal */}
      {showAddInventoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add New Inventory Item</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Name *
                </label>
                <input
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  placeholder="Item name"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Maker
                </label>
                <input
                  type="text"
                  value={invMaker}
                  onChange={(e) => setInvMaker(e.target.value)}
                  placeholder="Maker (optional)"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Maker's Part No
                </label>
                <input
                  type="text"
                  value={invMakerPartNo}
                  onChange={(e) => setInvMakerPartNo(e.target.value)}
                  placeholder="Part number (optional)"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeAddInventoryModal}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAddInventory}
                disabled={creatingInventory}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all ${
                  creatingInventory
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-[#036173] hover:bg-[#024f5c]"
                }`}
              >
                {creatingInventory ? "Adding..." : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProcurementCreateRequest;