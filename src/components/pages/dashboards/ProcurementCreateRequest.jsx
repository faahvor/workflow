// src/components/pages/dashboards/ProcurementCreateRequest.jsx

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MdAdd } from "react-icons/md";
import ItemSelectionTable from "../../shared/tables/ItemSelectionTable";
import { useAuth } from "../../context/AuthContext";
import ProcurementSelectionTable from "../../shared/tables/ProcurementSelectionTable";
import { useGlobalAlert } from "../../shared/GlobalAlert";

// --- ServiceTable and MaterialTable (copied from RequesterDashboard) ---
function ServiceTable({ rows, setRows }) {
  const { showAlert } = useGlobalAlert();
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
          <tr>
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
                  className="w-full bg-transparent outline-none"
                />
              </td>
              <td className="p-2 border border-[#036173]">
                <input
                  type="number"
                  value={row.amount}
                  onChange={(e) => handleChange(idx, "amount", e.target.value)}
                  className="w-full bg-transparent outline-none"
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
                  className="w-full bg-transparent outline-none"
                />
              </td>
              <td className="p-2 border border-[#036173]">
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) =>
                    handleChange(idx, "quantity", e.target.value)
                  }
                  className="w-full bg-transparent outline-none"
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

const ProcurementCreateRequest = ({ onRequestCreated }) => {
  const { user, getToken } = useAuth();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  // Destinations/Departments list
  const departments = [
    { name: "Purchase" },
    { name: "Marine" },
    { name: "IT" },
    { name: "Account" },
    { name: "Legal" },
    { name: "QHSE" },
    { name: "Operations" },
    { name: "Project" },
    { name: "Vessel/Catering" },
    { name: "Protocol" },
    { name: "Store" },
    { name: "HR" },
    { name: "Admin" },
  ];

  const destinations = [
    { name: "Marine" },
    { name: "IT" },
    { name: "Account" },
    { name: "Legal" },
    { name: "QHSE" },
    { name: "Operations" },
    { name: "Project" },
    { name: "Vessel/Catering" },
    { name: "Purchase" },
    { name: "Protocol" },
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
    department: "Purchase",
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
  const [nextApproverAfterVesselManager, setNextApproverAfterVesselManager] =
    useState("");
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [invName, setInvName] = useState("");
  const [invMaker, setInvMaker] = useState("");
  const [invMakerPartNo, setInvMakerPartNo] = useState("");
  const [creatingInventory, setCreatingInventory] = useState(false);

  // --- NEW STATE for feature parity with RequesterDashboard ---
  const [requestType, setRequestType] = useState("inventory"); // "inventory" or "services"
  const [serviceRows, setServiceRows] = useState([
    { description: "", amount: "" },
  ]);
  const [materialRows, setMaterialRows] = useState([
    { description: "", quantity: "" },
  ]);
  const [servicePurpose, setServicePurpose] = useState("");
  const [deckOrEngine, setDeckOrEngine] = useState("");
  const [offShoreNumber, setOffShoreNumber] = useState("");
  const [loadingOffshoreNumber, setLoadingOffshoreNumber] = useState(false);
  const [uploadType, setUploadType] = useState("image"); // "image" or "file"
  const [quotationFiles, setQuotationFiles] = useState([]);
  // Set fixed valid currencies
  useEffect(() => {
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

  // --- Deck/Engine and OffShore Number logic ---
  useEffect(() => {
    if (formData.destination === "Marine") {
      setDeckOrEngine(formData.deckOrEngine || "");
      setOffShoreNumber("");
    }
  }, [formData.destination]);

  useEffect(() => {
    if (formData.destination === "Marine" && deckOrEngine) {
      fetchOffshoreNumber(deckOrEngine);
    }
    // eslint-disable-next-line
  }, [deckOrEngine]);

  const fetchOffshoreNumber = async (department) => {
    try {
      setLoadingOffshoreNumber(true);
      setOffShoreNumber("");
      const token = await getToken();
      if (!token) return;
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
    } catch (err) {
      setOffShoreNumber("");
    } finally {
      setLoadingOffshoreNumber(false);
    }
  };

  // --- handleInputChange: update deckOrEngine and reset offShoreNumber as needed ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "destination") {
        next.vesselId = "";
        next.projectManager = "";
        next.deckOrEngine = "";
        setDeckOrEngine("");
        setOffShoreNumber("");
      }
      if (name === "deckOrEngine") {
        setDeckOrEngine(value);
      }
      return next;
    });

    if (name === "destination" && value !== "IT" && invoiceFiles.length > 0) {
      setInvoiceFiles([]);
    }

    const newDestination =
      name === "destination" ? value : formData.destination || "";
    const newRequestType =
      name === "requestType" ? value : formData.requestType || "";
    const shouldShowApprovalPick =
      newDestination === "Marine" && newRequestType === "pettyCash";

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
      showAlert("Name is required to add an inventory item.");
      return;
    }

    try {
      setCreatingInventory(true);
      const token = await getToken();
      if (!token) {
        showAlert("Authentication required.");
        return;
      }

      const payload = {
        department: formData.department || "Purchase",
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
        showAlert("Inventory added.");
        closeAddInventoryModal();
        return;
      }
      throw new Error("Unexpected create response");
    } catch (err) {
      console.error("Error creating inventory item:", err);
      showAlert(err?.response?.data?.message || "Failed to add inventory item");
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
      showAlert("Please select a department");
      return;
    }

    if (!formData.destination) {
      showAlert("Please select a destination");
      return;
    }

    if (!formData.company) {
      showAlert("Please select a company");
      return;
    }

    if (
      (formData.destination === "Marine" ||
        formData.destination === "Project") &&
      !formData.vesselId
    ) {
      showAlert("Please select a vessel");
      return;
    }

    if (formData.destination === "Project" && !formData.projectManager) {
      showAlert("Please select a project manager");
      return;
    }

    if (
      formData.destination === "Marine" &&
      formData.requestType === "pettyCash" &&
      !nextApproverAfterVesselManager
    ) {
      showAlert(
        "Please select Approval Pick (Technical Manager or Fleet Manager)."
      );
      return;
    }

    // --- SERVICES REQUEST VALIDATION ---
    if (requestType === "services") {
      const hasService = serviceRows.some(
        (row) => row.description && row.amount
      );
      const hasMaterial = materialRows.some(
        (row) => row.description && row.quantity
      );
      if (!hasService && !hasMaterial) {
        showAlert("Please add at least one service or material item.");
        return;
      }
    } else {
      // --- INVENTORY REQUEST VALIDATION ---
      if (selectedItems.length === 0) {
        showAlert("Please add at least one item from inventory");
        return;
      }
      const invalidItems = selectedItems.filter(
        (item) => !item.quantity || item.quantity < 1
      );
      if (invalidItems.length > 0) {
        showAlert("All items must have a quantity of at least 1");
        return;
      }
    }

    if (isPettyCashForIT) {
      const badPrice = selectedItems.find(
        (it) => !it.unitPrice || Number(it.unitPrice) <= 0
      );
      if (badPrice) {
        showAlert(
          "For petty cash requests to IT each item must have a unit price greater than 0."
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const token = await getToken();

      // --- SERVICES REQUEST LOGIC ---
      if (requestType === "services") {
        const serviceItems = serviceRows
          .filter((row) => row.description && row.amount)
          .map((row) => ({
            name: row.description,
            quantity: 1,
            unitPrice: Number(row.amount),
            description: row.description,
          }));
        const materialItems = materialRows
          .filter((row) => row.description && row.quantity)
          .map((row) => ({
            name: row.description,
            quantity: Number(row.quantity),
            unitPrice: 0,
          }));

        // Build procurement payload
        const payload = {
          department: "Purchase",
          destinationDepartment: formData.destination,
          companyId: formData.company,
          vesselId: formData.vesselId || undefined,
          purpose: servicePurpose,
          priority: formData.priority,
          isService: true,
          serviceItems,
          materialItems,
          workflowId: "PROCUREMENT_WORKFLOW",
          requestType: formData.requestType || "purchaseOrder",
        };
        if (formData.reference) payload.reference = formData.reference;
        if (formData.projectManager)
          payload.projectManager = formData.projectManager;
        if (formData.additionalInformation)
          payload.additionalInformation = formData.additionalInformation;
        if (formData.jobNumber) payload.jobNumber = formData.jobNumber;
        if (formData.destination === "Marine" && offShoreNumber) {
          payload.offshoreReqNumber = offShoreNumber;
        }
        if (formData.destination === "Marine" && deckOrEngine) {
          payload.deckOrEngine = deckOrEngine;
        }
        if (formData.destination === "Marine") {
          payload.nextApproverAfterVesselManager =
            nextApproverAfterVesselManager;
        }

        // If there are images, use FormData
        if (requestImages.length > 0) {
          const fd = new FormData();
          Object.entries(payload).forEach(([key, value]) => {
            if (Array.isArray(value) || typeof value === "object") {
              fd.append(key, JSON.stringify(value));
            } else if (value !== undefined) {
              fd.append(key, value);
            }
          });
          requestImages.forEach((f) => {
            if (f && f.file) fd.append("requestImages", f.file);
          });
                  console.log("FormData keys:", Array.from(fd.keys()));

          await axios.post(`${API_BASE_URL}/procurement/create`, fd, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
             console.log("Payload keys:", Object.keys(payload));
        console.log("Payload:", payload);
          await axios.post(`${API_BASE_URL}/procurement/create`, payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        showAlert("Service request created successfully!");
        // Reset form
        setFormData({
          department: "Purchase",
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
        setServicePurpose("");
        setNextApproverAfterVesselManager("");
        setServiceRows([{ description: "", amount: "" }]);
        setMaterialRows([{ description: "", quantity: "" }]);
        setRequestImages([]);
        setOffShoreNumber("");
        if (typeof onRequestCreated === "function") onRequestCreated();
        setSubmitting(false);
        return;
      }

      // --- INVENTORY REQUEST LOGIC ---
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
          // ...other fields if needed...
        };
      });

      const hasFiles =
        (formData.requestType === "purchaseOrder"
          ? quotationFiles.length > 0
          : invoiceFiles.length > 0) || requestImages.length > 0;

      // Build procurement payload for inventory
      const basePayload = {
        department: "Purchase",
        destinationDepartment: formData.destination,
        companyId: formData.company,
        vesselId: formData.vesselId || undefined,
        purpose: formData.purpose,
        priority: formData.priority,
        reference: formData.reference,
        items: items,
        workflowId: "PROCUREMENT_WORKFLOW",
        requestType: formData.requestType || "purchaseOrder",
      };
      if (formData.projectManager)
        basePayload.projectManager = formData.projectManager;
      if (formData.additionalInformation)
        basePayload.additionalInformation = formData.additionalInformation;
      if (formData.jobNumber) basePayload.jobNumber = formData.jobNumber;
      if (formData.destination === "Marine" && offShoreNumber) {
        basePayload.offshoreReqNumber = offShoreNumber;
      }
      if (formData.destination === "Marine" && deckOrEngine) {
        basePayload.deckOrEngine = deckOrEngine;
      }
      if (formData.destination === "Marine") {
        basePayload.nextApproverAfterVesselManager =
          nextApproverAfterVesselManager;
      }

      if (hasFiles) {
        
        const fd = new FormData();
        Object.entries(basePayload).forEach(([key, value]) => {
          if (Array.isArray(value) || typeof value === "object") {
            fd.append(key, JSON.stringify(value));
          } else if (value !== undefined) {
            fd.append(key, value);
          }
        });

        // Upload correct files
        if (formData.requestType === "purchaseOrder") {
          quotationFiles.forEach((f) => {
            if (f && f.file) fd.append("quotationFiles", f.file);
          });
        } else {
          invoiceFiles.forEach((f) => {
            if (f && f.file) fd.append("invoiceFiles", f.file);
          });
        }
        requestImages.forEach((f) => {
          if (f && f.file) fd.append("requestImages", f.file);
        });
  const allowedFields = [
    "department",
    "destinationDepartment",
    "companyId",
    "vesselId",
    "purpose",
    "priority",
    "items",
    "workflowId",
    "requestType",
    "serviceItems",
    "materialItems",
    "isService",
    "reference",
    "projectManager",
    "additionalInformation",
    "jobNumber",
    "offshoreReqNumber",
    "deckOrEngine",
    "nextApproverAfterVesselManager",
    "quotationFiles",
    "invoiceFiles",
    "requestImages"
  ];
  const fdKeys = Array.from(fd.keys());
  const unexpected = fdKeys.filter((k) => !allowedFields.includes(k));
  if (unexpected.length > 0) {
    console.warn("UNEXPECTED FIELDS in FormData:", unexpected);
  }
  console.log("FormData keys:", fdKeys);

  await axios.post(`${API_BASE_URL}/procurement/create`, fd, {
    headers: { Authorization: `Bearer ${token}` },
  });
} else {
             console.log("Payload keys:", Object.keys(basePayload));
      console.log("Payload:", basePayload);
        await axios.post(`${API_BASE_URL}/procurement/create`, basePayload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      showAlert("Request created successfully!");
      setFormData({
        department: "Purchase",
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
      setOffShoreNumber("");
      if (typeof onRequestCreated === "function") onRequestCreated();
   } catch (err) {
      // Log the full error object for detailed debugging
      console.error("Detailed error:", err);
      if (err.response) {
        console.error("Backend response data:", err.response.data);
        console.error("Backend response status:", err.response.status);
        console.error("Backend response headers:", err.response.headers);
      }
      showAlert(err.response?.data?.message || "Failed to create request");
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

    if (invoiceEntries.length > 0)
      setInvoiceFiles((prev) => [...prev, ...invoiceEntries]);
    if (imageEntries.length > 0)
      setRequestImages((prev) => [...prev, ...imageEntries]);
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

    if (invoiceEntries.length > 0)
      setInvoiceFiles((prev) => [...prev, ...invoiceEntries]);
    if (imageEntries.length > 0)
      setRequestImages((prev) => [...prev, ...imageEntries]);
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

  const handleAddBlankInventoryItem = () => {
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
        isNew: true,
      },
    ]);
    setShowInventoryDropdown(false);
    setSearchTerm("");
  };
  const handleItemFieldChange = (index, field, value) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmitRequest}
        className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 md:p-8 shadow-lg"
      >
        <div className="space-y-6">
          {/* Row 1: Department & Destination */}
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

          {/* Job Number (if not Marine) */}
          {formData.destination && formData.destination !== "Marine" && (
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

          {/* Deck/Engine & OffShore Number (Marine only) */}
          {formData.destination === "Marine" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      checked={deckOrEngine === "Deck"}
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
                      checked={deckOrEngine === "Engine"}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Engine
                    </span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  OffShore Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={
                      loadingOffshoreNumber ? "Loading..." : offShoreNumber
                    }
                    readOnly
                    disabled
                    placeholder={
                      deckOrEngine
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

          {/* Request Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
              Request Type
            </label>
            <div className="flex flex-wrap items-center gap-6">
              {/* Main Request Type */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mainRequestType"
                  value="inventory"
                  checked={requestType === "inventory"}
                  onChange={() => {
                    setRequestType("inventory");
                    setFormData((prev) => ({
                      ...prev,
                      requestType: "purchaseOrder", // default to purchaseOrder
                    }));
                  }}
                  className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                />
                <span className="text-sm font-medium text-slate-700">
                  Inventory
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mainRequestType"
                  value="services"
                  checked={requestType === "services"}
                  onChange={() => {
                    setRequestType("services");
                    setFormData((prev) => ({
                      ...prev,
                      requestType: "purchaseOrder", // reset to default for services
                    }));
                  }}
                  className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                />
                <span className="text-sm font-medium text-slate-700">
                  Services
                </span>
              </label>

              {/* Inventory Subtype (Purchase Order / Petty Cash) */}
              {requestType === "inventory" && (
                <div className="flex gap-6 ml-8">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      value="purchaseOrder"
                      checked={formData.requestType === "purchaseOrder"}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Purchase Order
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      value="pettyCash"
                      checked={formData.requestType === "pettyCash"}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-emerald-500 border-2 border-slate-300 focus:ring-emerald-400"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Petty Cash
                    </span>
                  </label>
                </div>
              )}
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

            {formData.destination === "Marine" &&
              formData.requestType === "pettyCash" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                    Approval Pick *
                  </label>
                  <select
                    name="nextApproverAfterVesselManager"
                    value={nextApproverAfterVesselManager}
                    onChange={(e) =>
                      setNextApproverAfterVesselManager(e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm appearance-none bg-white"
                    required
                  >
                    <option value="">Select Approver</option>
                    <option value="Technical Manager">Technical Manager</option>
                    <option value="Fleet Manager">Fleet Manager</option>
                  </select>
                </div>
              )}

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

          {/* Inventory Request UI */}
          {requestType === "inventory" && (
            <>
              {/* Items from Inventory */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Items from Inventory
                </label>
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
                  {showInventoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden flex flex-col overflow-x-hidden">
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
                              key={`${item._id || item.inventoryId || index}`}
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
                      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={handleAddBlankInventoryItem}
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
                  <ProcurementSelectionTable
                    items={selectedItems}
                    onFieldChange={handleItemFieldChange}
                    onQuantityChange={handleQuantityChange}
                    onRemoveItem={handleRemoveItem}
                    onUnitPriceChange={handleUnitPriceChange}
                    onCurrencyChange={handleCurrencyChange}
                    onVatChange={(index, checked) => {
                      setSelectedItems((prev) => {
                        const updated = [...prev];
                        updated[index].vatted = checked;
                        return updated;
                      });
                    }}
                    onDiscountChange={(index, value) => {
                      setSelectedItems((prev) => {
                        const updated = [...prev];
                        updated[index].discount = value;
                        return updated;
                      });
                    }}
                    onLogisticsTypeChange={(index, value) => {
                      setSelectedItems((prev) => {
                        const updated = [...prev];
                        updated[index].logisticsType = value;
                        return updated;
                      });
                    }}
                    onVendorChange={(index, value) => {
                      setSelectedItems((prev) => {
                        const updated = [...prev];
                        updated[index].vendor = value;
                        return updated;
                      });
                    }}
                    vendors={[]} // You can fetch and pass your vendor list here
                    currencies={currencies.map((c) => c.value)}
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
            </>
          )}

          {/* Services Request UI */}
          {requestType === "services" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                  Purpose for Service *
                </label>
                <textarea
                  value={servicePurpose}
                  onChange={(e) => setServicePurpose(e.target.value)}
                  placeholder="Describe the purpose of this service request"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 text-sm resize-none"
                />
              </div>
              <ServiceTable rows={serviceRows} setRows={setServiceRows} />
              <MaterialTable rows={materialRows} setRows={setMaterialRows} />
            </>
          )}

          {/* Upload Request Images - Always available */}
          <div className="mb-2 flex flex-col gap-8 items-center">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Upload Type
            </label>
            <div className="flex gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  value="image"
                  checked={uploadType === "image"}
                  onChange={() => setUploadType("image")}
                  className="w-4 h-4 text-emerald-500 border-2 border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
                  Image Upload
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="uploadType"
                  value="file"
                  checked={uploadType === "file"}
                  onChange={() => setUploadType("file")}
                  className="w-4 h-4 text-emerald-500 border-2 border-slate-300"
                />
                <span className="text-sm font-medium text-slate-700">
                  {formData.requestType === "purchaseOrder"
                    ? "Quotation File"
                    : "Invoice File"}
                </span>
              </label>
            </div>
          </div>

          {/* Image Upload UI */}
          {uploadType === "image" && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                Upload Images
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
                <div className="mt-3 grid gap-2">
                  {requestImages.map((img) => (
                    <div
                      key={img.id}
                      className="flex items-center justify-between bg-white border border-slate-100 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                          {img.previewUrl ? (
                            <img
                              src={img.previewUrl}
                              alt={img.file.name}
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
                            {img.file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {Math.round(img.file.size / 1024)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRequestImage(img.id)}
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

          {/* File Upload UI */}
          {uploadType === "file" && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">
                {formData.requestType === "purchaseOrder"
                  ? "Upload Quotation File(s)"
                  : "Upload Invoice File(s)"}
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
                      {(formData.requestType === "purchaseOrder"
                        ? quotationFiles.length
                        : invoiceFiles.length) > 0
                        ? `${
                            formData.requestType === "purchaseOrder"
                              ? quotationFiles.length
                              : invoiceFiles.length
                          } file(s) selected`
                        : "Drag & drop file(s) here, or click to browse"}
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
                  {(formData.requestType === "purchaseOrder"
                    ? quotationFiles.length
                    : invoiceFiles.length) > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        formData.requestType === "purchaseOrder"
                          ? setQuotationFiles([])
                          : setInvoiceFiles([]);
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
                  onChange={
                    formData.requestType === "purchaseOrder"
                      ? (e) => {
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
                          setQuotationFiles((prev) => [...prev, ...entries]);
                          e.target.value = null;
                        }
                      : handleInvoiceInputChange
                  }
                  className="hidden"
                />
              </div>
              {(formData.requestType === "purchaseOrder"
                ? quotationFiles.length
                : invoiceFiles.length) > 0 && (
                <div className="mt-3 grid gap-2">
                  {(formData.requestType === "purchaseOrder"
                    ? quotationFiles
                    : invoiceFiles
                  ).map((f) => (
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
                      <button
                        type="button"
                        onClick={() =>
                          formData.requestType === "purchaseOrder"
                            ? setQuotationFiles((prev) =>
                                prev.filter((q) => q.id !== f.id)
                              )
                            : removeInvoiceFile(f.id)
                        }
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

      {/* Add Inventory Modal (updated style) */}
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
                  value={formData.department || ""}
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
    </>
  );
};

export default ProcurementCreateRequest;
