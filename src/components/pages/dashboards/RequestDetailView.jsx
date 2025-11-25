// src/components/pages/RequestDetailView.jsx

import React, { useEffect, useState, useRef } from "react";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdDescription,
  MdCancel,
  MdHelp,
  MdCheckCircle,
  MdArrowBack,
  MdAttachFile,
  MdDirectionsBoat, // added icon
} from "react-icons/md";
import RequestWorkflow from "../../shared/RequestWorkflow";
import FleetManagerTable from "../../shared/tables/FleetManagerTable";
import { useAuth } from "../../context/AuthContext";
import VesselManagerTable from "../../shared/tables/VesselManagerTable";
import axios from "axios";
import ProcurementTable from "../../shared/tables/ProcurementTable";
import AccountTable from "../../shared/tables/AccountTable";
import ProcurementMTable from "../../shared/tables/ProcurementMTable";
import MDTable from "../../shared/tables/MDTable";
import DeliveryTable from "../../shared/tables/DeliveryTable";
import CompletedTable from "../../shared/tables/CompletedTable";
import RequesterTable from "../../shared/tables/RequesterTable";
import StoreDeliveryTable from "../../shared/tables/StoreDeliverytable";
import Select from "react-select";
import AttachedDocuments from "../../shared/AttachedDocuments";
import OperationsManagerTable from "../../shared/tables/OperationsManagerTable";
import DirectOfOpTable from "../../shared/tables/DirectOfOpTable";
import ShippingTable from "../../shared/tables/ShippingTable";
import { generateAndUploadRequisition } from "../../shared/generateAndUploadRequisition";



const RequestDetailView = ({
  request,
  onBack,
  onApprove,
  onReject,
  onQuery,
  actionLoading,
  isReadOnly = false,
    vendors: vendorsProp = [],
}) => {
  const { user } = useAuth();

  const [vessels, setVessels] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [vendors, setVendors] = useState([]);
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";
  const { getToken } = useAuth();
  const [canApproveDelivery, setCanApproveDelivery] = useState(true);
  const [filesRefreshCounter, setFilesRefreshCounter] = useState(0);

  // Attach-from-other-request state + helpers (shipping-only UI will use these)
  const [attachSearchTerm, setAttachSearchTerm] = useState("");
  const [attachSearching, setAttachSearching] = useState(false);
  const [attachSearchResults, setAttachSearchResults] = useState([]);
  const [attachSourceItems, setAttachSourceItems] = useState([]);
  const [attachSelectedItemIds, setAttachSelectedItemIds] = useState([]);
  const [attachSourceMeta, setAttachSourceMeta] = useState(null);
  

  // --- Quotation upload state & refs (REPLACED to support multiple files)
  const fileInputRef = useRef(null);
  const [quotationFiles, setQuotationFiles] = useState([]); // [{ id, file, previewUrl, progress, uploaded }]
  const [isUploading, setIsUploading] = useState(false);
  const userRole = user?.role?.toLowerCase() || "";
  const deliveryOptions = [
    { value: "Delivery Base", label: "Delivery Base" },
    { value: "Delivery Jetty", label: "Delivery Jetty" },
    { value: "Delivery Vessel", label: "Delivery Vessel" },
  ];
  const [deliveryTarget, setDeliveryTarget] = useState(null);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  useEffect(() => {
    // sync deliveryTarget from request data when details load
    const loc =
      (selectedRequest && selectedRequest.deliveryLocation) ||
      (request && request.deliveryLocation) ||
      null;
    const found = deliveryOptions.find((o) => o.value === loc) || null;
    setDeliveryTarget(found);
  }, [selectedRequest, request]);

  const handleDeliveryChange = async (option) => {
    // update UI immediately
    setDeliveryTarget(option);

    const prev =
      (selectedRequest && selectedRequest.deliveryLocation) ||
      (request && request.deliveryLocation) ||
      null;

    // determine payload value (null if cleared)
    const payloadValue = option ? option.value : null;

    try {
      setIsSavingDelivery(true);
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      await axios.patch(
        `${API_BASE_URL}/requests/${request.requestId}`,
        { deliveryLocation: payloadValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // update local request copy
      setSelectedRequest((prevReq) => ({
        ...(prevReq || {}),
        deliveryLocation: payloadValue,
      }));
    } catch (err) {
      console.error("Error saving delivery location:", err);
      alert(err?.response?.data?.message || "Failed to save delivery location");
      // revert selection on error
      const prevOption = deliveryOptions.find((o) => o.value === prev) || null;
      setDeliveryTarget(prevOption);
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const canUploadQuotation =
    userRole === "procurement" || userRole === "procurement officer";

  if (!request) return null;

  const handleDeliveryStatusChange = (allFullyDelivered) => {
    setCanApproveDelivery(allFullyDelivered);
  };

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = getToken(); // ✅ USE THIS INSTEAD
        if (!token) {
          console.error("❌ No token available");
          return;
        }
        const response = await axios.get(
          "https://hdp-backend-1vcl.onrender.com/api/vendors",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendors(response.data.data || []);
      } catch (error) {
        console.error("❌ Error fetching vendors:", error);
      }
    };
    fetchVendors();
  }, []); // ✅ Add getToken to dependencies if needed

  const fetchRequestDetails = async () => {
   try {
    const token = getToken();
    if (!token) {
      console.error("❌ No token available");
      return null;
    }
    const response = await axios.get(
      `${API_BASE_URL}/requests/${request.requestId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    // API may return the object at response.data.data or response.data
    const data = response.data?.data ?? response.data;
    setSelectedRequest(data);
    return data; // return for callers
  } catch (error) {
    console.error("Error fetching request:", error);
    throw error;
  }
};
  useEffect(() => {
    if (request?.requestId) {
      fetchRequestDetails().catch((err) => {
        console.error("Failed to load request details on mount:", err);
      });
    }
  }, [request?.requestId]);

  const handleFilesChanged = async () => {
    try {
      // re-fetch latest request details (silent)
      await fetchRequestDetails();
      // bump counter so AttachedDocuments can show a local spinner and react
      setFilesRefreshCounter((c) => c + 1);
    } catch (err) {
      console.error("Failed to refresh files after upload:", err);
    }
  };

  const uploadEntryImmediate = async (entry) => {
    if (!entry) return;
    const id = entry.id;
    try {
      setIsUploading(true);

      // ensure entry exists in state so progress UI updates
      setQuotationFiles((prev) => {
        if (prev.find((p) => p.id === id)) return prev;
        return [...prev, entry];
      });

      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 0, uploaded: false } : p
        )
      );

      const token = getToken();
      const formData = new FormData();
      formData.append("files", entry.file);

      const resp = await axios.post(
        `${API_BASE_URL}/requests/${request.requestId}/quotations`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setQuotationFiles((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))
            );
          },
        }
      );

      // mark uploaded
      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 100, uploaded: true } : p
        )
      );

      // refresh request details so AttachedDocuments sees the new file
      if (typeof fetchRequestDetails === "function")
        await fetchRequestDetails();
      if (typeof handleFilesChanged === "function") handleFilesChanged();

      // remove the temporary entry after successful upload (keeps UI clean)
      setQuotationFiles((prev) => {
        const toRemove = prev.find((p) => p.id === id);
        if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
    } catch (err) {
      console.error("Error uploading quotation (immediate):", err);
      alert(err?.response?.data?.message || "Upload failed");
      // keep entry in list for retry and mark uploaded=false
      setQuotationFiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, uploaded: false } : p))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const fetchVessels = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVessels(response.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching vessels:", err);
    }
  };

  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId; // Fallback to vesselId if name not found
  };

  // Fetch vessels on mount
  useEffect(() => {
    fetchVessels();
  }, []);

  // attached files function

  const performAttachSearch = async () => {
    const q = (attachSearchTerm || "").trim();
    if (!q) return;
    setAttachSearching(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const resp = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = resp.data?.data || [];
      const lowered = q.toLowerCase();
      const results = all.filter((r) => {
        const vendor = (r.vendor || r.requester?.displayName || "")
          .toString()
          .toLowerCase();
        const po = (r.purchaseOrderNumber || r.reference || r.requestId || "")
          .toString()
          .toLowerCase();
        return vendor.includes(lowered) || po.includes(lowered);
      });
      setAttachSearchResults(results);
    } catch (err) {
      console.error("Attach search error:", err);
      setAttachSearchResults([]);
    } finally {
      setAttachSearching(false);
    }
  };

const loadSourceRequestItems = async (sourceRequestId) => {
  try {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    const resp = await axios.get(
      `${API_BASE_URL}/requests/${sourceRequestId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const src = resp.data?.data ?? resp.data ?? {};
    // Use only src.items for all cases
    const items = src.items || [];
    setAttachSourceItems(items);
    setAttachSelectedItemIds(
      items.map((it) => it.itemId || it._id).filter(Boolean)
    );
    setAttachSourceMeta({
      requestId: src.requestId || sourceRequestId,
      vendor: src.vendor || src.requester?.displayName || "",
    });
  } catch (err) {
    console.error("Error loading source request items:", err);
    alert(err?.response?.data?.message || "Failed to load request items");
  }
};

  const toggleAttachSelect = (itemId) => {
    setAttachSelectedItemIds((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      return [...prev, itemId];
    });
  };

  const selectAllAttachItems = () => {
    setAttachSelectedItemIds(
      attachSourceItems.map((it) => it.itemId || it._id).filter(Boolean)
    );
  };

  const clearAttachSelection = () => {
    setAttachSourceItems([]);
    setAttachSelectedItemIds([]);
    setAttachSourceMeta(null);
    setAttachSearchResults([]);
    setAttachSearchTerm("");
  };

  const attachSelectedToTarget = async (targetRequestId, purpose = "") => {
    if (!targetRequestId) return;
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const payload = {
        sourceRequestId: attachSourceMeta?.requestId || null,
        itemIds: attachSelectedItemIds || [],
        purpose,
      };
      const resp = await axios.post(
        `${API_BASE_URL}/requests/${targetRequestId}/attach`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(resp.data?.message || "Request attached successfully");
      // refresh current request details so UI updates
      await fetchRequestDetails();
      clearAttachSelection();
    } catch (err) {
      console.error("Attach error:", err);
      alert(err?.response?.data?.message || "Failed to attach items");
    }
  };

  const currentRequest = selectedRequest || request;

  const renderItemsTable = () => {
    const userRole = user?.role?.toLowerCase();

  // determine if this request is a shipping request (tag === "shipping")
  const isShippingTag = String(currentRequest?.tag || "").toLowerCase().includes("shipping");

   const itemsSource = currentRequest?.items || [];


  // normalize fields so downstream tables can render consistently
  const items = (itemsSource || []).map((it, idx) => ({
    itemId: it.itemId || it._id || it.id || `gen-${idx}`,
    name: it.name || it.description || it.title || "N/A",
    itemType: it.itemType || it.makersType || it.type || "",
    maker: it.maker || it.manufacturer || "",
    makersPartNo:
      it.makersPartNo || it.makerPartNumber || it.partNumber || "",
    vendor:
      it.vendor || it.vendorName || it.supplier || it.vendorId || "",
    quantity: it.quantity || it.qty || it.requestedQuantity || 0,
    unitPrice: it.unitPrice || it.unit_price || it.price || null,
    total:
      it.total ||
      (it.unitPrice && it.quantity
        ? Number(it.unitPrice) * Number(it.quantity)
        : null),
    purchaseReqNumber: it.purchaseReqNumber || it.prn || it.prNumber || "",
    purchaseOrderNumber:
      it.purchaseOrderNumber || it.PON || it.pon || it.purchaseOrder || "",
    currency: it.currency || "NGN",
    __raw: it,
  }));

    // When viewing approved/completed set tables to read-only (also consider actionLoading)
  const tableReadOnly = isReadOnly || actionLoading;

    if (isReadOnly) {
      return <CompletedTable items={items} userRole={userRole} />;
    }

    // Role-based table selection
    switch (userRole) {
      case "vesselmanager":
      case "vessel manager":
      case "vmanager":
        return (
          <VesselManagerTable
            items={items}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            requestId={request.requestId}
            isReadOnly={tableReadOnly}
            currentState={request.flow?.currentState}
               vendors={vendors} 
          />
        );

      case "fleetmanager":
      case "fleet manager":
        return (
          <FleetManagerTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
               vendors={vendors} 
          />
        );

      case "managingdirector":
      case "managing director":
        return (
          <MDTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
               vendors={vendors} 
          />
        );

      case "procurementmanager":
      case "procurement manager":
        return (
          <ProcurementMTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
               vendors={vendors} 
          />
        );
      case "storebase":
      case "store base":
        return (
          <StoreDeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );
      case "storejetty":
      case "store jetty":
        return (
          <StoreDeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );
      case "storevessel":
      case "store vessel":
        return (
          <StoreDeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );

      case "accountingofficer":
      case "accounting officer":
        return (
          <AccountTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            showPaymentStatus={true}
            allowPaymentEditing={true} 
               vendors={vendors} 
          />
        );

      case "operationsmanager":
      case "operations manager":
        return (
          <OperationsManagerTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );
      case "directorofoperations":
      case "director of operations":
        return (
          <DirectOfOpTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );

      case "deliverybase":
      case "delivery base":
      case "deliveryjetty":
      case "delivery jetty":
      case "deliveryvessel":
      case "delivery vessel":
        return (
          <DeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            userRole="deliverybase"
            requestId={request.requestId}
            onDeliveryQuantityChange={handleDeliveryQuantityChange}
            onDeliveryStatusChange={handleDeliveryStatusChange}
          />
        );
     case "requester":
      case "Requester":
          if (isShippingTag) {
          return (
            <ShippingTable
              items={items}
              userRole={userRole}
              isReadOnly={tableReadOnly}
              vendors={vendors}
              selectedRequest={currentRequest}
              onEditItem={handleEditItem}
              handleCreateVendor={handleCreateVendor}
              handleVendorChange={handleVendorChange}
              onFilesChanged={handleFilesChanged}
            />
          );
        }
        return (
          <RequesterTable
            items={items}
            userRole={userRole}
            isReadOnly={tableReadOnly}
          />
        );

      case "procurement":
      case "procurement officer":
        return (
          <ProcurementTable
            requests={items}
            selectedRequest={currentRequest}
            vendors={vendors || []}
            onEditItem={handleEditItem}
            handleDeleteItem={handleDeleteItem}
            handleVendorChange={handleVendorChange}
            handleCreateVendor={handleCreateVendor}
            showUnitPrice={true}
            showVat={true}
            showPRN={true}
            showPON={false}
            showItemTypeAndDept={true}
            allowPriceEditing={!tableReadOnly}
            allowEditing={!tableReadOnly}
            canEditPRN={!tableReadOnly}
            canEditPON={false}
            allowVendorSelection={!tableReadOnly}
            allowItemTypeChange={!tableReadOnly}
            allowInStockChange={!tableReadOnly}
            allowLogisticsChange={!tableReadOnly}
            isPreview={false}
            readOnly={tableReadOnly}
            onSwitchInitiated={(itemId) => {}}
            onFilesChanged={handleFilesChanged}
          />
        );
    }
  };

  // Handle edit item
  const handleEditItem = async (item) => {
    try {
      const token = getToken();
      if (!token) {
        console.error("❌ No token available");
        throw new Error("No token");
      }

      const itemId = item.itemId || item._id;
      const requestId = request.requestId;

      // Build payload: send only item fields (remove internal/meta fields)
      const payload = { ...item };
      delete payload.itemId;
      delete payload._id;
      delete payload._groupIndex;
      delete payload.requestId;

      const response = await axios.patch(
        `${API_BASE_URL}/requests/${requestId}/items/${itemId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        // Refresh local request details to reflect server changes
        await fetchRequestDetails();
        return response.data;
      } else {
        console.error("Unexpected response editing item:", response);
        throw new Error("Failed to update item");
      }
    } catch (error) {
      console.error(
        "Error editing item:",
        error.response?.data || error.message
      );
      throw error;
    }
  };

  // Handle delete item
  const handleDeleteItem = async (requestId, itemId, reason) => {
    try {
      // TODO: Implement API call to delete item
      // You'll need to add the API endpoint here
      // const response = await axios.delete(`/api/requests/${requestId}/items/${itemId}`, { data: { reason } });
      return { status: 200 };
    } catch (error) {
      console.error("Error deleting item:", error);
      throw error;
    }
  };

  const canProceedToApprove = () => {
    const items = currentRequest?.items || [];
    const missingQty = items.find(
      (it) => it.inStock && !(parseInt(it.inStockQuantity, 10) > 0)
    );
    if (missingQty) {
      alert(
        `Cannot approve: item "${
          missingQty.name || missingQty.itemId
        }" provide Instock quantity.`
      );
      return false;
    }
    const missingLocation = items.find(
      (it) => it.inStock && (!it.storeLocation || it.storeLocation === "")
    );
    if (missingLocation) {
      alert(
        `Cannot approve: item "${
          missingLocation.name || missingLocation.itemId
        }" Provide a store location.`
      );
      return false;
    }
    return true;
  };

  // Handle delivery quantity change
  const handleDeliveryQuantityChange = (requestId, itemId, quantity) => {
    // TODO: Implement API call to update delivery quantity
  };

  // ✅ ADD THIS - Handle Vendor Change
  const handleVendorChange = async (itemId, selectedOption) => {
    try {
      const payload = {
        itemId,
        vendor: selectedOption?.label || null,
        vendorId: selectedOption?.value || null,
        requestId: request.requestId,
      };

      await handleEditItem(payload);

      // Refresh details so UI shows latest values immediately
      await fetchRequestDetails();
    } catch (error) {
      console.error(
        "❌ Error updating vendor:",
        error.response?.data || error.message || error
      );
    }
  };

  const handleCreateVendor = async (vendorName, index) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/vendors`,
        { name: vendorName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const created = response.data?.data || response.data;
      if (!created) throw new Error("Invalid vendor response");

      setVendors((prev) => [...(prev || []), created]);

      return {
        value:
          created.vendorId || created.vendorId === 0
            ? created.vendorId
            : created._id || created.id,
        label: created.name || vendorName,
      };
    } catch (error) {
      console.error("❌ Error creating vendor:", error);
      throw error;
    }
  };

  // --- Helpers for quotation upload (REPLACED to handle multiple files)
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) processSelectedFiles(files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target?.files || []);
    if (files.length) processSelectedFiles(files);
    // reset input so same file can be selected again if needed
    e.target.value = null;
  };

  const processSelectedFiles = (files) => {
    const maxSize = 10 * 1024 * 1024;
    const newEntries = files
      .map((file, idx) => {
        if (file.size > maxSize) {
          alert(`${file.name} is too large. Max 10MB per file.`);
          return null;
        }
        const id = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${idx}`;
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null;
        return { id, file, previewUrl, progress: 0, uploaded: false };
      })
      .filter(Boolean);

    if (newEntries.length === 0) return;

    // add to UI so user can see items (failed uploads remain for retry)
    setQuotationFiles((prev) => [...prev, ...newEntries]);

    // start uploads immediately (do not await; uploadEntryImmediate handles state & errors)
    newEntries.forEach((entry) => {
      // slight delay so state updates before upload begins (optional)
      setTimeout(() => uploadEntryImmediate(entry), 50);
    });
  };

  const handleRemoveFile = (id) => {
    setQuotationFiles((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleUploadFile = async (id) => {
    const entry = quotationFiles.find((e) => e.id === id);
    if (!entry) return;
    try {
      setIsUploading(true);
      // reset progress for this file when (re)uploading
      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 0, uploaded: false } : p
        )
      );

      const token = getToken();
      const formData = new FormData();
      formData.append("files", entry.file); // API accepts array, sending single file in "files"

      const resp = await axios.post(
        `${API_BASE_URL}/requests/${request.requestId}/quotations`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setQuotationFiles((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))
            );
          },
        }
      );

      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 100, uploaded: true } : p
        )
      );
      // refresh request details to pick up persisted quotation URLs
      if (typeof fetchRequestDetails === "function")
        await fetchRequestDetails();
      alert(resp.data?.message || "File uploaded.");
    } catch (err) {
      console.error("Error uploading quotation:", err);
      alert(err.response?.data?.message || "Upload failed");
      setQuotationFiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, uploaded: false } : p))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAll = async () => {
    // Upload sequentially to update progress per-file reliably
    for (const entry of [...quotationFiles]) {
      if (!entry.uploaded) {
        // eslint-disable-next-line no-await-in-loop
        await handleUploadFile(entry.id);
      }
    }
  };

  useEffect(() => {
    return () => {
      // cleanup preview urls
      quotationFiles.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, []); // run once on unmount

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        <MdArrowBack className="text-xl" />
        Back to Requests
      </button>

      {/* Workflow Progress - Now a separate component */}
      {request.flow?.path && (
        <div className="mb-8">
          <RequestWorkflow workflowPath={request.flow.path} />
        </div>
      )}

      {/* Request Information */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Request Details
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Request ID
            </p>
            <p className="text-sm text-slate-900 font-semibold font-mono">
              {request.requestId}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Company</p>
            <p className="text-sm text-slate-900 font-semibold font-mono">
              {request.company || "N/A"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Requester
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.requester?.displayName || "N/A"}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Department
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.department}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            {" "}
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Destination
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.destination}
            </p>
          </div>

          {request.vesselId && (
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Vessel
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {getVesselName(request.vesselId)}
              </p>
            </div>
          )}
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Submitted Date
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Request Type
            </p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                {request.requestType === "purchaseOrder"
                  ? "Purchase Order"
                  : "Petty Cash"}
              </span>
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Asset ID
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.assetId || "N/A"}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200"></div>
          <div className="px-4 py-3 border-b border-r border-slate-200"></div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Job Number{" "}
            </p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                {request.jobNumber || "N/A"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Purpose */}
      {request.purpose && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdDescription className="text-xl" />
            Purpose
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <p className="text-slate-700 leading-relaxed">{request.purpose}</p>
          </div>
        </div>
      )}

      {/* Quotation Upload - inserted ABOVE Requested Items (UPDATED for multiple files) */}
      {(canUploadQuotation ||
        String(currentRequest?.tag || "").toLowerCase().includes("shipping")) &&
        !isReadOnly && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MdAttachFile className="text-xl" />
              Upload Quotation
            </h3>

            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                role="button"
                tabIndex={0}
                onClick={handleBrowseClick}
                className="w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors duration-200 p-6 flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
                    📎
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {quotationFiles.length > 0
                        ? `${quotationFiles.length} file(s) selected`
                        : "Drag & drop quotation(s) here, or click to browse"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                    className="px-4 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] transition"
                  >
                    Add Files
                  </button>

                  {quotationFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadAll();
                      }}
                      disabled={isUploading}
                      className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition text-sm"
                    >
                      Upload All
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleInputChange}
                  multiple
                  className="hidden"
                />
              </div>

              {/* Files list & per-file actions */}
              {quotationFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  {quotationFiles.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border">
                        {entry.previewUrl ? (
                          <img
                            src={entry.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-600 text-sm px-2 text-center">
                            {entry.file.type === "application/pdf"
                              ? "PDF"
                              : "FILE"}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 truncate w-72">
                              {entry.file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUploadFile(entry.id);
                              }}
                              disabled={isUploading || entry.uploaded}
                              className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isUploading || entry.uploaded
                                  ? "bg-gray-200 text-slate-600 cursor-not-allowed"
                                  : "bg-emerald-500 text-white hover:bg-emerald-600"
                              }`}
                            >
                              {entry.uploaded ? "Uploaded" : "Upload"}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(entry.id);
                              }}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 bg-emerald-500 transition-all"
                              style={{ width: `${entry.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {entry.progress}%{" "}
                            {isUploading && entry.progress < 100
                              ? "• uploading"
                              : entry.uploaded
                              ? "• complete"
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      {/* ===== End Quotation Upload ===== */}

      {/* ===== attaching of request to another request ===== */}

      {String(currentRequest?.tag || "").toLowerCase() === "shipping" &&
        !isReadOnly && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              🔗 Attach Items from Another Request
            </h3>

            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
              <div className="flex gap-3 items-start">
                <input
                  value={attachSearchTerm}
                  onChange={(e) => setAttachSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") performAttachSearch();
                  }}
                  placeholder="Search by vendor name or PON and press Enter / Search"
                  className="flex-1 px-4 py-3 border rounded-xl"
                />
                <button
                  onClick={performAttachSearch}
                  disabled={attachSearching || !attachSearchTerm.trim()}
                  className="px-4 py-3 bg-[#036173] text-white rounded-xl"
                >
                  {attachSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {attachSearchResults.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {attachSearchResults.map((res) => (
                    <div
                      key={res.requestId || res.id}
                      className="p-3 rounded-lg border hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {res.summary ||
                            res.requestId ||
                            res.purchaseOrderNumber ||
                            res.reference}
                        </div>
                        <div className="text-xs text-slate-500">
                          {res.vendor ||
                            res.requester?.displayName ||
                            "Unknown vendor"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            loadSourceRequestItems(res.requestId || res.id)
                          }
                          className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700"
                        >
                          View Items
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {attachSourceItems.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">
                        Source: {attachSourceMeta?.requestId}
                      </div>
                      <div className="text-xs text-slate-500">
                        {attachSourceMeta?.vendor}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllAttachItems}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAttachSelection}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-md"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {attachSourceItems.map((it) => {
                      const iid = it.itemId || it._id || it.id;
                      return (
                        <label
                          key={iid}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-semibold">
                              {it.name || it.description || iid}
                            </div>
                            <div className="text-xs text-slate-500">
                              Qty: {it.quantity || it.qty || "N/A"}
                            </div>
                          </div>
                          <div>
                            <input
                              type="checkbox"
                              checked={attachSelectedItemIds.includes(iid)}
                              onChange={() => toggleAttachSelect(iid)}
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      placeholder="Purpose (optional)"
                      className="flex-1 px-3 py-2 border rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const p = e.target.value.trim();
                          const confirmed = window.confirm(
                            "Attach selected items to this request?"
                          );
                          if (confirmed)
                            attachSelectedToTarget(currentRequest.requestId, p);
                        }
                      }}
                      id="attach-purpose-input"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          "attach-purpose-input"
                        );
                        const purpose = el ? el.value.trim() : "";
                        const confirmed = window.confirm(
                          "Attach selected items to this request?"
                        );
                        if (confirmed)
                          attachSelectedToTarget(
                            currentRequest.requestId,
                            purpose
                          );
                      }}
                      disabled={attachSelectedItemIds.length === 0}
                      className="px-4 py-2 bg-[#036173] text-white rounded-lg"
                    >
                      Attach Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Items List - Role-based table */}
        {currentRequest?.items && currentRequest.items.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdShoppingCart className="text-xl" />
            Requested Items
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
            {renderItemsTable()}
          </div>
        </div>
      )}

      {user?.role?.toLowerCase() === "procurement officer" && !isReadOnly && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdDirectionsBoat className="text-xl" />
            Assign Delivery
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <div className="max-w-md">
              <Select
                options={deliveryOptions}
                value={deliveryTarget}
                onChange={handleDeliveryChange}
                isClearable
                placeholder="Select delivery target..."
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "48px",
                    borderRadius: 12,
                    boxShadow: "none",
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                menuPortalTarget={document.body}
              />
              {deliveryTarget && (
                <p className="mt-3 text-sm text-slate-600">
                  Selected:{" "}
                  <span className="font-semibold">{deliveryTarget.label}</span>
                  {isSavingDelivery && (
                    <span className="ml-3 text-xs text-slate-500">
                      Saving...
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attached Documents (quotationFiles from request) */}
      <AttachedDocuments
        requestId={request.requestId}
        files={currentRequest?.quotationFiles || []}
        requestData={currentRequest}
        filesRefreshCounter={filesRefreshCounter} // <-- added: signal to trigger attached-docs refresh
      />

      {/* Action Footer */}
      {!isReadOnly && (
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-6 md:px-8 py-6 shadow-lg sticky bottom-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">
              Review the request details and take action
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => onReject(request.requestId)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-6 h-12 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MdCancel className="text-lg" />
                Reject
              </button>
              <button
                onClick={() => onQuery(request.requestId)}
                disabled={actionLoading}
                className="w-full sm:w-auto px-6 h-12 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <MdHelp className="text-lg" />
                Query
              </button>
              <button
                onClick={() => {
                  if (!canProceedToApprove()) return;
                  onApprove(request.requestId);
                }}
                disabled={
                  actionLoading ||
                  ([
                    "delivery base",
                    "delivery jetty",
                    "delivery vessel",
                  ].includes(user?.role?.toLowerCase()) &&
                    !canApproveDelivery)
                }
                className={`w-full sm:w-auto px-6 h-12 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  [
                    "delivery base",
                    "delivery jetty",
                    "delivery vessel",
                  ].includes(user?.role?.toLowerCase()) && !canApproveDelivery
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-[#036173] to-emerald-600 text-white hover:shadow-xl hover:shadow-emerald-500/30"
                } disabled:opacity-50`}
              >
                <MdCheckCircle className="text-lg" />
                {actionLoading ? "Processing..." : "Approve Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailView;
