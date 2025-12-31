import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaSave } from "react-icons/fa";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { MdCheckCircle } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

const ProcurementTable = ({
  progressData,
  handleDeleteItem,
  handleVendorChange,
  requests,

  selectedRequest,
  onEditItem,
  showPON = false,
  canEditPON = false,
  onApprove,
  allowPriceEditing = false,
  allowEditing = false,
  showUnitPrice = false,
  unitPrices = {},
  onPriceChange = () => {},

  handleCreateVendor,
  vendors,
  canEditPRN = false,
  userRole = "procurement",
  showPRN = false,
  allowVendorSelection = false,
  showItemTypeAndDept = false,
  showVat = false,
  onSwitchInitiated,
  isPreview = false,
  readOnly = false,
  allowItemTypeChange = true,
  allowInStockChange = true,
  allowLogisticsChange = true,
  onFilesChanged = () => {},
  doVendorSplit = true,
}) => {
  const [editedRequests, setEditedRequests] = useState(
    requests.map((request) => ({
      ...request,
      itemId: request.itemId || request._id,
      currency: request.currency || "",
      destination:
        request.itemType === "pettyCash" ? request.destination || "" : "N/A",
      itemType: request.itemType || "purchaseOrder",
      discount: request.discount || "",
      vatted: request.vatted || false,
      total: request.totalPrice ?? request.total ?? 0,
      totalPrice: request.totalPrice ?? request.total ?? 0,
      inStockQuantity: request.inStockQuantity || 0,
    }))
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [deletionMode, setDeletionMode] = useState(false);
  const [deletionComment, setDeletionComment] = useState("");
  const [deletingItem, setDeletingItem] = useState(null);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [shippingFees, setShippingFees] = useState({});
  const [calculatedVat, setCalculatedVat] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const STORE_LOCATIONS = ["Store Base", "Store Jetty", "Store Vessel"];
  const [activeTableIndex, setActiveTableIndex] = useState(0);
  const tableRefs = useRef([]);
  const { getToken } = useAuth();

  const departments = [
    "marine",
    "IT",
    "account",
    "protocol",
    "compliance/qhse",
    "operation",
    "project",
    "purchase",
    "hr",
    "admin",
  ];

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";
  const vendorOptions = (vendors || []).map((v) => {
    const id = v?.vendorId ?? v?._id ?? v?.id ?? String(v);
    const label = typeof v?.name === "string" ? v.name : String(v?.name ?? id);
    return { value: id, label };
  });

  const extractVendorFromFilename = (urlOrName) => {
    try {
      const name = String(urlOrName).split("/").pop().split("?")[0];
      const base = name.replace(/\.[^/.]+$/, "");
      const token = "-requisition";
      const lowerBase = base.toLowerCase();
      const typeIdx = lowerBase.lastIndexOf(token);
      if (typeIdx > 0) {
        const before = base.substring(0, typeIdx);
        const prevHyphen = before.lastIndexOf("-");
        const vendorSegment =
          prevHyphen === -1 ? before : before.substring(prevHyphen + 1);
        return vendorSegment.replace(/_/g, " ").trim() || null;
      }
      return null;
    } catch {
      return null;
    }
  };

  const normalizeVendorKey = (vendor) =>
    String(vendor || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  // new helper: always return a string for vendor display
  const getVendorDisplayName = (vendorOrName) => {
    if (!vendorOrName) return "";
    if (typeof vendorOrName === "string") return vendorOrName;
    if (typeof vendorOrName === "object") {
      return (
        vendorOrName.name ||
        vendorOrName.vendorName ||
        vendorOrName.label ||
        vendorOrName.vendor ||
        vendorOrName.vendorId ||
        vendorOrName.id ||
        ""
      );
    }
    return String(vendorOrName);
  };

  const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const departmentOptions = departments.map((dept) => ({
    value: dept === "IT" ? "IT" : capitalizeFirstLetter(dept),
    label: dept === "IT" ? "IT" : capitalizeFirstLetter(dept),
  }));

  const handleUnifiedEdit = async (updates) => {
    try {
      setIsSaving(true);
      if (!onEditItem) {
        console.error("❌ onEditItem not provided");
        return;
      }

      const requestId = selectedRequest?.requestId;
      console.log(
        "handleUnifiedEdit - selectedRequest/requestId:",
        selectedRequest ? selectedRequest.requestId : selectedRequest
      );

      if (!requestId) {
        console.error("❌ selectedRequest.requestId missing");
        return;
      }

      const promises = updates.map(async (u) => {
        const itemId = u.itemId;
        const changes = u.changes || {};
        const payload = {
          ...changes,
          ...(changes.total !== undefined ? { totalPrice: changes.total } : {}),
          requestId,
        };

        if (payload.inStockLocation !== undefined) {
          payload.storeLocation = payload.inStockLocation;
          delete payload.inStockLocation;
        }
        const localItem =
          editedRequests.find((it) => (it.itemId || it._id) === itemId) || null;
        if (localItem) {
          if (payload.vendorId === undefined && localItem.vendorId) {
            payload.vendorId = localItem.vendorId;
          }
          // if vendor name present but vendorId not included in changes, prefer sending vendorId
          if (
            payload.vendor &&
            payload.vendorId === undefined &&
            localItem.vendorId
          ) {
            payload.vendorId = localItem.vendorId;
          }
        }

        if (
          Object.prototype.hasOwnProperty.call(payload, "inStock") &&
          payload.inStock === false
        ) {
          delete payload.storeLocation;
          delete payload.inStockQuantity;
        }
        try {
          const unitPrice = Number(
            changes.unitPrice !== undefined
              ? changes.unitPrice
              : localItem?.unitPrice || 0
          );
          const quantity = Number(
            changes.quantity !== undefined
              ? changes.quantity
              : localItem?.quantity || 0
          );
          const discountRaw =
            changes.discount !== undefined
              ? changes.discount
              : localItem?.discount ?? 0;
          const discount = discountRaw === "" ? 0 : Number(discountRaw) || 0;
          const vatted =
            changes.vatted !== undefined
              ? !!changes.vatted
              : !!localItem?.vatted;
          const shippingFee =
            changes.shippingFee !== undefined
              ? Number(changes.shippingFee)
              : Number(localItem?.shippingFee || 0);

          const baseTotal = unitPrice * quantity;
          const discountFactor =
            discount >= 0 && discount <= 100 ? (100 - discount) / 100 : 1;
          const discountedTotal = baseTotal * discountFactor;
          const vatAmount = vatted ? discountedTotal * calculatedVat : 0;
          const computedTotalPrice =
            shippingFee > 0
              ? (vatted ? discountedTotal + vatAmount : discountedTotal) +
                shippingFee
              : vatted
              ? discountedTotal + vatAmount
              : discountedTotal;

          if (!Number.isNaN(computedTotalPrice))
            payload.totalPrice = computedTotalPrice;
          if (!Number.isNaN(vatAmount)) payload.vatAmount = vatAmount;
          if (payload.destination === "N/A") {
            delete payload.destination;
          }

          // Optionally don't send destination for non-pettyCash items
          if (payload.itemType && payload.itemType !== "pettyCash") {
            delete payload.destination;
          }
        } catch (err) {
          console.warn("Failed to compute totals for payload:", err);
        }

        try {
          console.log("handleUnifiedEdit payload:", itemId, payload); // <-- ADD THIS LINE
          console.log(
            "handleUnifiedEdit payload (about to call onEditItem):",
            itemId,
            payload
          );

          const result = await onEditItem({
            ...payload,
            itemId,
          });
          return result;
        } catch (err) {
          console.error("Error updating item", itemId, err);
          throw err;
        }
      });

    const results = await Promise.all(promises);

// ✅ If parent returns the full updated request, use its items to refresh UI
const updatedRequest =
  results.find((r) => r && (r.items || r.data?.items)) || results[0] || null;

const itemsFromServer =
  updatedRequest?.items ||
  updatedRequest?.data?.items ||
  selectedRequest?.items ||
  [];

if (itemsFromServer && itemsFromServer.length > 0) {
  setEditedRequests(
    itemsFromServer.map((it) => ({
      ...it,
      itemId: it.itemId || it._id,
      total: it.totalPrice ?? it.total ?? 0,
      totalPrice: it.totalPrice ?? it.total ?? 0,
    }))
  );
} else {
  // Server didn't return items — keep local edits but clear dirty flags (they were saved)
  setEditedRequests((prev) =>
    prev.map((it) => ({
      ...it,
      _dirty: false,
      _pendingVendor: undefined,
    }))
  );
}

      console.log("✅ Autosave completed");
    } catch (error) {
      console.error("❌ Error in unified edit:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const buildChangesForItem = (editedItem) => {
    const orig =
      requests.find(
        (r) => (r.itemId || r._id) === (editedItem.itemId || editedItem._id)
      ) || {};
    const fieldsToCheck = [
      "quantity",
      "unitPrice",
      "discount",
      "vatted",
      "inStock",
      "inStockQuantity",
      "storeLocation",
      "logisticsType",
      "shippingQuantity",
      "currency",
      "purchaseReqNumber",
      "purchaseOrderNumber",
      "vendorId",
      "vendor",
      "shippingFee",
      "itemType",
      "destination",
      "vatAmount",
    ];

    const changes = {};

    fieldsToCheck.forEach((f) => {
      const a = orig[f];
      const b = editedItem[f];

      // vendorId: normalize and detect null/empty removal
      if (f === "vendorId") {
        const aNorm = a === undefined || a === null ? "" : String(a);
        const bNorm = b === undefined || b === null ? "" : String(b);
        if (aNorm !== bNorm) {
          // send explicit null when vendor cleared
          changes.vendorId = b === "" ? null : b;
        }
        return;
      }

      // vendor name: normalize
      if (f === "vendor") {
        const aNorm = a === undefined || a === null ? "" : String(a).trim();
        const bNorm = b === undefined || b === null ? "" : String(b).trim();
        if (aNorm !== bNorm) {
          changes.vendor = bNorm;
          // if vendor was cleared, ensure vendorId is also cleared
          if (bNorm === "") {
            changes.vendorId = null;
          }
        }
        return;
      }

      // numeric fields
      if (
        [
          "quantity",
          "unitPrice",
          "inStockQuantity",
          "shippingQuantity",
          "shippingFee",
          "vatAmount",
          "totalPrice",
        ].includes(f)
      ) {
        const aNum = a === "" || a === undefined ? 0 : Number(a || 0);
        const bNum = b === "" || b === undefined ? 0 : Number(b || 0);
        if (Number.isNaN(aNum) ? !Number.isNaN(bNum) : aNum !== bNum) {
          changes[f] = b === "" ? 0 : Number(b) || 0;
        }
        return;
      }

      // boolean
      if (f === "vatted" || f === "inStock") {
        if (!!a !== !!b) changes[f] = !!b;
        return;
      }

      // discount allow empty string or numeric
      if (f === "discount") {
        const aNum = a === "" || a === undefined ? "" : Number(a);
        const bNum = b === "" || b === undefined ? "" : Number(b);
        if (String(aNum) !== String(bNum))
          changes[f] = b === "" ? "" : Number(b);
        return;
      }

      // fallback: string compare
      const aStr = a === undefined || a === null ? "" : String(a);
      const bStr = b === undefined || b === null ? "" : String(b);
      if (aStr !== bStr) {
        changes[f] = b;
      }
    });

    // final safeguard: if vendor was given as cleared in vendor field but vendorId not set above, set vendorId = null
    if (
      changes.vendor !== undefined &&
      changes.vendor === "" &&
      changes.vendorId === undefined
    ) {
      changes.vendorId = null;
    }

    return changes;
  };

  const handleSaveAll = async () => {
    console.log("handleSaveAll called", {
      selectedRequest,
      requestsProp: requests && requests.length,
      editedRequestsCount: editedRequests && editedRequests.length,
      onEditItemPresent: !!onEditItem,
    });
    if (!window.confirm("Save all changes to the items?")) return;

    const dirty = editedRequests.filter((it) => it._dirty);
    console.log("handleSaveAll - editedRequests snapshot:", editedRequests);
    console.log("handleSaveAll - dirty items:", dirty);

    if (!dirty || dirty.length === 0) {
      alert("No changes to save.");
      return;
    }

    try {
      setIsSaving(true);
      console.log("DEBUG: original requests prop:", requests);
      console.log(
        "DEBUG: local editedRequests snapshot before save:",
        editedRequests
      );

      // 1) Create any new vendors that were created locally (deferred create)
      if (typeof handleCreateVendor === "function") {
        const pendingNewVendorNames = [
          ...new Set(
            editedRequests
              .filter((it) => it._dirty && it._pendingVendor?.isNew)
              .map((it) => it._pendingVendor.name)
          ),
        ];

        const createdVendorIdByName = {};
        for (const name of pendingNewVendorNames) {
          try {
            const option = await handleCreateVendor(name);
            if (option && option.value !== undefined && option.value !== null) {
              createdVendorIdByName[name] = option.value;
            }
          } catch (err) {
            console.error("Error creating vendor during Save:", name, err);
          }
        }

        if (Object.keys(createdVendorIdByName).length > 0) {
          setEditedRequests((prev) =>
            prev.map((it) =>
              it._dirty &&
              it._pendingVendor &&
              it._pendingVendor.isNew &&
              createdVendorIdByName[it._pendingVendor.name]
                ? {
                    ...it,
                    vendorId: createdVendorIdByName[it._pendingVendor.name],
                    _pendingVendor: {
                      ...it._pendingVendor,
                      id: createdVendorIdByName[it._pendingVendor.name],
                      isNew: false,
                    },
                  }
                : it
            )
          );
        }
      }

      // 2) Build updates from latest snapshot
      const snapshot = editedRequests.slice();
      const updates = snapshot
        .filter((it) => it._dirty)
        .map((it) => {
          const changes = buildChangesForItem(it);
          console.log(
            "buildChangesForItem result for item:",
            it.itemId || it._id,
            { changes, it }
          );

          if (
            changes.inStockLocation !== undefined &&
            changes.storeLocation === undefined
          ) {
            changes.storeLocation = changes.inStockLocation;
            delete changes.inStockLocation;
          }

          return {
            itemId: it.itemId || it._id,
            changes,
          };
        })
        .filter((u) => Object.keys(u.changes).length > 0);

      // debug: show payload that will be sent to server
      console.log("handleSaveAll - updates payload:", updates);

      if (updates.length === 0) {
        alert("No actual field changes detected to save.");
        setIsSaving(false);
        return;
      }

      await handleUnifiedEdit(updates);

      // clear local dirty flags and pending vendor metadata
      setEditedRequests((prev) =>
        prev.map((itm) => ({
          ...itm,
          _dirty: false,
          _pendingVendor: undefined,
        }))
      );

      alert("Saved successfully");

      // Notify parent to refresh attached-files list / live preview (no uploads here)
      try {
        if (typeof onFilesChanged === "function") onFilesChanged();
      } catch (cbErr) {
        console.error("onFilesChanged callback error after save:", cbErr);
      }
    } catch (err) {
      console.error("Error in handleSaveAll:", err);
      alert("Error saving changes. See console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (itemId, field, value) => {
    setEditedRequests((prevRequests) => {
      const newRequests = prevRequests.map((item) => {
        if (item.itemId === itemId) {
          const updatedItem = { ...item };

          if (field === "unitPrice") {
            updatedItem.unitPrice = value === "" ? 0 : parseFloat(value) || 0;
          } else if (field === "quantity") {
            updatedItem.quantity = value === "" ? 0 : parseFloat(value) || 0;
          } else if (field === "discount") {
            updatedItem.discount = value === "" ? "" : parseFloat(value) || 0;
          } else if (field === "vatted") {
            updatedItem.vatted = !!value;
          } else {
            updatedItem[field] = value;
            if (field === "inStock") {
              if (value === false) {
                updatedItem.inStockQuantity = 0;
                updatedItem.storeLocation = "";
              } else if (value === true) {
                if (
                  updatedItem.inStockQuantity === "" ||
                  updatedItem.inStockQuantity === null ||
                  parseInt(updatedItem.inStockQuantity, 10) === 0
                ) {
                  updatedItem.inStockQuantity = 1;
                }

                // Keep pricing cleared for in-stock items
                updatedItem.unitPrice = 0;
                updatedItem.currency = "";
                updatedItem.discount = "";
                updatedItem.vatted = false;
                updatedItem.total = 0;
              }

              console.log("handleChange - inStock toggle:", {
                itemId,
                value,
                updatedItem,
              });
            }
             if (field === "logisticsType" && value === "local") {
    updatedItem.shippingFee = 0;
  }
          }

          const currentUnitPrice = parseFloat(updatedItem.unitPrice) || 0;
          const currentQuantity = parseFloat(updatedItem.quantity) || 0;
          const currentDiscount =
            updatedItem.discount !== ""
              ? parseFloat(updatedItem.discount) || 0
              : 0;
          const isVatted = !!updatedItem.vatted;
          const shippingFee = parseFloat(updatedItem.shippingFee) || 0;

          const baseTotal = currentUnitPrice * currentQuantity;
          const discountFactor =
            currentDiscount >= 0 && currentDiscount <= 100
              ? (100 - currentDiscount) / 100
              : 1;
          const discountedTotal = baseTotal * discountFactor;

          // VAT calculation must happen after discountedTotal is known
          const vatAmount = isVatted ? discountedTotal * calculatedVat : 0;

          // total shown in UI (price including VAT when vatted)
          updatedItem.total = isVatted
            ? discountedTotal * (1 + calculatedVat)
            : discountedTotal;

          // canonical DB fields to be persisted
          updatedItem.vatAmount = vatAmount;
          updatedItem.totalPrice =
            shippingFee > 0
              ? (isVatted ? discountedTotal + vatAmount : discountedTotal) +
                shippingFee
              : isVatted
              ? discountedTotal + vatAmount
              : discountedTotal;

          // mark item as changed locally
          updatedItem._dirty = true;

          return updatedItem;
        }

        // Discount propagation for other items with same vendor
        if (
          field === "discount" &&
          value !== "" &&
          item.vendor === prevRequests.find((r) => r.itemId === itemId)?.vendor
        ) {
          const currentDiscount = parseFloat(value) || 0;
          const baseTotal =
            (parseFloat(item.unitPrice) || 0) *
            (parseFloat(item.quantity) || 0);
          const discountFactor =
            currentDiscount >= 0 && currentDiscount <= 100
              ? (100 - currentDiscount) / 100
              : 1;
          const discountedTotal = baseTotal * discountFactor;

          return {
            ...item,
            discount: value,
            total: item.vatted
              ? discountedTotal * (1 + calculatedVat)
              : discountedTotal,
            _dirty: true,
          };
        }

        return item;
      });

      return newRequests;
    });
  };

  const shouldShowShippingFeeForVendor = (vendorItems) => {
    return vendorItems.some((item) => item.logisticsType === "international");
  };

  const groupAndSortRequests = (requests) => {
    if (!doVendorSplit) {
      // Single table, group by vendor for sorting only
      const sorted = [...requests].sort((a, b) => {
        const va = getVendorDisplayName(a.vendor || a.vendorId || "");
        const vb = getVendorDisplayName(b.vendor || b.vendorId || "");
        if (va < vb) return -1;
        if (va > vb) return 1;
        return 0;
      });
      return [{ items: sorted }];
    }
    // Default: split by vendor
    const vendorGroups = {};
    requests.forEach((req, index) => {
      const key =
        getVendorDisplayName(
          req.shippingVendor || req.vendor || req.vendorId || "No Vendor"
        ) || "No Vendor";
      if (!vendorGroups[key]) {
        vendorGroups[key] = { order: index, items: [] };
      }
      vendorGroups[key].items.push(req);
    });
    return Object.values(vendorGroups).sort((a, b) => a.order - b.order);
  };

  const groupedRequests = groupAndSortRequests(editedRequests);
  const shouldShowItemTypeColumns =
    showItemTypeAndDept && selectedRequest?.requestType !== "pettyCash";

  const hasPRNVisible =
    showPRN &&
    editedRequests.some(
      (it) =>
        !(
          selectedRequest?.requestType === "pettyCash" &&
          it.itemType === "pettyCash"
        )
    );

  useEffect(() => {
    // ✅ Set valid currencies from documentation
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
    setCurrencies(
      validCurrencies.map((currency) => ({
        value: currency,
        label: currency,
      }))
    );
    setLoadingCurrencies(false);
  }, []);

  useEffect(() => {
    const fetchVat = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`${API_BASE_URL}/vat`, { headers });
        const value = resp?.data?.value;
        setCalculatedVat(typeof value === "number" ? value / 100 : 0);
      } catch (error) {
        console.error("Error fetching VAT:", error);
        setCalculatedVat(0);
      }
    };
    fetchVat();
  }, [getToken, selectedRequest]);

  useEffect(() => {
    // If there are local unsaved edits, don't overwrite them
    if (editedRequests.some((it) => it && it._dirty)) {
      console.log(
        "Skipping re-init of editedRequests because local edits exist"
      );
      return;
    }

    const vendorShippingFees = {};

    if (requests && requests.length > 0) {
      requests.forEach((item) => {
        const vendor = item.vendor || item.vendorId || "No Vendor";
        if (
          item.shippingFee !== undefined &&
          vendorShippingFees[vendor] === undefined
        ) {
          vendorShippingFees[vendor] = item.shippingFee;
        }
      });
    }

    setShippingFees(vendorShippingFees);

    setEditedRequests((prevRequests) => {
      const updatedRequests = requests.map((request) => {
        const existingItem = prevRequests.find(
          (item) =>
            (item.itemId || item._id) === (request.itemId || request._id)
        );

        // Resolve vendorId and vendor name:
        const resolvedVendorId =
          existingItem?.vendorId ??
          request.vendorId ??
          (request.vendor && (request.vendor.vendorId || request.vendor.id)) ??
          null;

        const vendorFromCatalog =
          resolvedVendorId && vendors && vendors.length
            ? (vendors || []).find(
                (v) =>
                  String(v.vendorId) === String(resolvedVendorId) ||
                  String(v._id) === String(resolvedVendorId) ||
                  String(v.id) === String(resolvedVendorId)
              )
            : null;

        const resolvedVendorName =
          existingItem?.vendor ||
          (vendorFromCatalog ? vendorFromCatalog.name : null) ||
          (request.vendor ? getVendorDisplayName(request.vendor) : "") ||
          request.vendorName ||
          "";

        return {
          ...request,
          itemId: request.itemId || request._id,
          vendor: resolvedVendorName,
          vendorId: resolvedVendorId,
          currency: existingItem?.currency || request.currency || "",
          destination:
            request.itemType === "pettyCash"
              ? existingItem?.destination || request.destination || ""
              : "N/A",
          itemType:
            selectedRequest?.requestType === "purchaseOrder"
              ? request.itemType === "pettyCash"
                ? "pettyCash"
                : "purchaseOrder"
              : request.itemType || "purchaseOrder",
          inStock: existingItem?.inStock || request.inStock || false,
          inStockQuantity:
            existingItem?.inStockQuantity || request.inStockQuantity || 0,
          storeLocation:
            existingItem?.storeLocation || request.storeLocation || "",
          logisticsType: existingItem?.logisticsType ?? "local",
          shippingQuantity:
            existingItem?.shippingQuantity || request.shippingQuantity || 0,
          discount: existingItem?.discount || request.discount || "",
          vatted: existingItem?.vatted || request.vatted || false,
          total:
            existingItem?.total ?? request.totalPrice ?? request.total ?? 0,
          totalPrice:
            existingItem?.totalPrice ??
            request.totalPrice ??
            request.total ??
            0,
          purchaseReqNumber:
            existingItem?.purchaseReqNumber || request.purchaseReqNumber || "",
          purchaseOrderNumber:
            existingItem?.purchaseOrderNumber ||
            request.purchaseOrderNumber ||
            "",
          shippingFee: existingItem?.shippingFee ?? 0,
        };
      });
      return updatedRequests;
    });
  }, [requests, selectedRequest, vendors]);

  const handleEditClick = (itemId) => {
    setEditingIndex(String(itemId));
  };

  const handleSaveClick = (itemId) => {
    const updatedItem = editedRequests.find((item) => item.itemId === itemId);
    if (updatedItem && onEditItem) {
      const unitPriceNum = parseFloat(updatedItem.unitPrice) || 0;
      const quantityNum = parseFloat(updatedItem.quantity) || 0;
      const discountNum =
        updatedItem.discount === "" ? 0 : parseFloat(updatedItem.discount) || 0;
      const baseTotal = unitPriceNum * quantityNum;
      const discountFactor =
        discountNum >= 0 && discountNum <= 100 ? (100 - discountNum) / 100 : 1;
      const discountedTotal = baseTotal * discountFactor;
      const vatAmt = updatedItem.vatted ? discountedTotal * calculatedVat : 0;
      const canonicalTotalPrice = updatedItem.vatted
        ? discountedTotal + vatAmt
        : discountedTotal;

      const payload = {
        ...updatedItem,
        quantity: quantityNum,
        unitPrice: unitPriceNum,
        discount: updatedItem.discount === "" ? "" : discountNum,
        vatted: !!updatedItem.vatted,
        inStock: updatedItem.inStock || false,
        totalPrice: canonicalTotalPrice,
        vatAmount: vatAmt,
        purchaseReqNumber: updatedItem.purchaseReqNumber || "",
        purchaseOrderNumber: updatedItem.purchaseOrderNumber || "",
        requestId: selectedRequest?.requestId,
      };
      payload.vendorId = updatedItem.vendorId ?? null;
      console.log("handleSaveClick -> sending payload:", payload);

      onEditItem(payload);
    }
    setEditingIndex(null);
    setRenderKey((prev) => prev + 1);
  };

  const getVendorKey = (item) => {
    const raw =
      (selectedRequest?.clearing === false &&
        selectedRequest?.shipping === true &&
        (item.shippingVendor || item.vendor)) ||
      (selectedRequest?.clearing === true && selectedRequest?.shipping === false
        ? item.shippingVendor || item.vendor
        : item.vendor) ||
      item.vendorId ||
      "No Vendor";

    // normalize to a simple display string
    return getVendorDisplayName(raw) || String(item.vendorId || "No Vendor");
  };

  const vendorGroups = {};
  editedRequests.forEach((item, idx) => {
    const key = getVendorKey(item);
    if (!vendorGroups[key]) vendorGroups[key] = [];
    vendorGroups[key].push({ ...item, _groupIndex: idx });
  });

  const getVendorInfo = (request) => {
    const vendorKey = getVendorKey(request);
    const group = vendorGroups[vendorKey];
    const rowspan = group ? group.length : 1;
    const itemIndexInGroup = group
      ? group.findIndex(
          (item) =>
            (item.itemId || item._id) === (request.itemId || request._id)
        )
      : 0;
    const isFirstRow = itemIndexInGroup === 0;
    return { rowspan, isFirstRow, vendorKey, itemIndexInGroup };
  };
  function isProcurementOfficerApproved(request) {
    return (
      Array.isArray(request.history) &&
      (request.history.some(
        (h) =>
          h.action === "APPROVE" &&
          h.role === "Procurement Officer" &&
          h.info === "Procurement Officer Approved"
      ) ||
        request.history.some(
          (h) =>
            h.action === "SPLIT" &&
            h.role === "SYSTEM" &&
            typeof h.info === "string" &&
            h.info.includes("Petty Cash items moved to Petty Cash flow")
        ))
    );
  }

  return (
    <div className="p-4 w-full mx-auto overflow-x-auto">
      {isSaving && (
        <div className="mb-4 p-2 bg-[blue-100] text-[#036173] rounded">
          Saving changes...
        </div>
      )}

      <div className="space-y-4">
        {groupAndSortRequests(editedRequests).map((vendorGroup, groupIndex) => {
          const hasAnyInStock = vendorGroup.items.some((it) => !!it.inStock);
          const hasAnyInStockQty = vendorGroup.items.some(
            (it) => !!it.inStock && parseInt(it.inStockQuantity, 10) > 0
          );
          return (
            <div
              key={groupIndex}
              className="overflow-x-auto"
              ref={(el) => {
                tableRefs.current[groupIndex] = el;
              }}
              onClick={() => {
                setActiveTableIndex(groupIndex);
              }}
            >
              {" "}
              <table className="w-full border-collapse border-2 border-slate-200  text-sm mb-4">
                <thead>
                  <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      SN
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Description
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Item Type
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Maker
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Maker's Part No
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Vendor
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Asset ID
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Quantity
                    </th>
                    {shouldShowItemTypeColumns && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Switch to Petty Cash
                      </th>
                    )}

                    {showItemTypeAndDept && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        In Stock
                      </th>
                    )}
                    {showItemTypeAndDept && hasAnyInStock && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Store Quantity
                      </th>
                    )}
                    {showItemTypeAndDept && hasAnyInStock && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Stock Location
                      </th>
                    )}
                    {showItemTypeAndDept && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Logistics Type
                      </th>
                    )}
                    {showItemTypeAndDept && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Shipping Quantity
                      </th>
                    )}
                    {showItemTypeAndDept && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Shipping Fee
                      </th>
                    )}
                    {showUnitPrice && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Unit Price
                      </th>
                    )}
                    {showUnitPrice && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Discount (%)
                      </th>
                    )}
                    {showUnitPrice && showVat && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Apply VAT
                      </th>
                    )}
                    {showUnitPrice && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Total Price
                      </th>
                    )}
                    {showUnitPrice && showVat && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        VAT Amount
                      </th>
                    )}

                    {hasPRNVisible && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        PRN
                      </th>
                    )}
                    {showPON && <th className="border p-2">PON</th>}
                  </tr>
                </thead>
                <tbody>
                  {vendorGroup.items.map((request, index) => {
                    const itemId = request.itemId || request._id;
                    return (
                      <tr
                        key={itemId}
                        className="hover:bg-emerald-50 transition-colors duration-150"
                      >
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          {index + 1}
                        </td>
                        <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                          {request.name}
                        </td>
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          {isProcurementOfficerApproved(
                            selectedRequest || request
                          )
                            ? request.makersType || request.itemType || "N/A"
                            : "N/A"}
                        </td>
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          {request.maker}
                        </td>
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "150px" }}
                        >
                          {request.makersPartNo}
                        </td>
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "150px" }}
                        >
                          {allowVendorSelection && (
                            <CreatableSelect
                              options={vendorOptions}
                              value={(() => {
                                const currentItem = editedRequests.find(
                                  (item) => item.itemId === request.itemId
                                );
                                if (!currentItem) return null;
                                const match = vendorOptions.find(
                                  (opt) =>
                                    String(opt.value) ===
                                    String(currentItem.vendorId)
                                );
                                if (match) return match;
                                return currentItem?.vendor
                                  ? {
                                      value:
                                        currentItem.vendorId ||
                                        currentItem.vendor,
                                      label: String(currentItem.vendor),
                                    }
                                  : null;
                              })()}
                              onChange={(selectedOption) => {
                                setEditedRequests((prev) =>
                                  prev.map((item) =>
                                    item.itemId === request.itemId
                                      ? {
                                          ...item,
                                          vendor: selectedOption?.label
                                            ? String(selectedOption.label)
                                            : null,
                                          vendorId:
                                            selectedOption?.value !==
                                              undefined &&
                                            selectedOption?.value !== null
                                              ? String(selectedOption.value)
                                              : null,
                                          _dirty: true,
                                          _pendingVendor: selectedOption
                                            ? {
                                                name: String(
                                                  selectedOption.label
                                                ),
                                                id:
                                                  selectedOption?.value !==
                                                    undefined &&
                                                  selectedOption?.value !== null
                                                    ? String(
                                                        selectedOption.value
                                                      )
                                                    : null,
                                                isNew: false,
                                              }
                                            : null,
                                        }
                                      : item
                                  )
                                );

                                console.log(
                                  "Vendor select changed for item",
                                  request.itemId,
                                  "selectedOption:",
                                  selectedOption
                                );
                              }}
                              onCreateOption={async (inputValue) => {
                                setEditedRequests((prev) =>
                                  prev.map((item) =>
                                    item.itemId === request.itemId
                                      ? {
                                          ...item,
                                          vendor: String(inputValue),
                                          vendorId: null,
                                          _dirty: true,
                                          _pendingVendor: {
                                            name: String(inputValue),
                                            id: null,
                                            isNew: true,
                                          },
                                        }
                                      : item
                                  )
                                );

                                console.log(
                                  "Vendor create (optimistic) for item",
                                  request.itemId,
                                  "name:",
                                  inputValue
                                );
                              }}
                              className={`w-[170px] text-black ${
                                request.itemType === "pettyCash"
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : ""
                              }`}
                              styles={{
                                control: (provided) => ({
                                  ...provided,
                                  minWidth: "100px",
                                  fontSize: "14px",
                                  backgroundColor:
                                    request.itemType === "pettyCash"
                                      ? "#e5e7eb"
                                      : provided.backgroundColor,
                                  cursor:
                                    request.itemType === "pettyCash"
                                      ? "not-allowed"
                                      : provided.cursor,
                                }),
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                              menuPortalTarget={document.body}
                              menuPlacement="auto"
                              placeholder="Select Vendor"
                              isClearable
                              isDisabled={request.itemType === "pettyCash"}
                            />
                          )}
                        </td>
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          {request.assetId || "N/A"}
                        </td>
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          {editingIndex === String(itemId) ? (
                            <input
                              type="number"
                              min="1"
                              value={
                                editedRequests.find(
                                  (item) => item.itemId === itemId
                                )?.quantity || ""
                              }
                              onChange={(e) =>
                                handleChange(itemId, "quantity", e.target.value)
                              }
                              onFocus={(e) => {
                                if (e.target.value === "1") {
                                  handleChange(itemId, "quantity", "");
                                }
                              }}
                              className="border px-2 py-1 rounded-md w-16 text-black"
                            />
                          ) : (
                            request.quantity
                          )}
                        </td>
                        {shouldShowItemTypeColumns && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            <input
                              type="checkbox"
                              checked={
                                editedRequests.find(
                                  (it) => it.itemId === request.itemId
                                )?.itemType === "pettyCash"
                              }
                              onChange={(e) => {
                                // prevent switching when item marked in stock
                                if (request.inStock) return;
                                const newItemType = e.target.checked
                                  ? "pettyCash"
                                  : "purchaseOrder";
                                handleChange(itemId, "itemType", newItemType);
                                handleChange(
                                  itemId,
                                  "destination",
                                  e.target.checked ? "" : "N/A"
                                );
                                if (e.target.checked && onSwitchInitiated) {
                                  onSwitchInitiated(itemId);
                                }
                              }}
                              disabled={
                                isPreview ||
                                readOnly ||
                                allowItemTypeChange === false ||
                                request.inStock
                              }
                              className={
                                (editedRequests.find(
                                  (it) => it.itemId === request.itemId
                                )?.itemType === "pettyCash"
                                  ? ""
                                  : "") ||
                                (request.inStock ? "cursor-not-allowed" : "")
                              }
                            />
                          </td>
                        )}

                        {showItemTypeAndDept && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            <input
                              type="checkbox"
                              checked={
                                editedRequests.find(
                                  (it) => it.itemId === request.itemId
                                )?.inStock || false
                              }
                              onChange={(e) =>
                                handleChange(
                                  itemId,
                                  "inStock",
                                  e.target.checked
                                )
                              }
                              disabled={
                                isPreview ||
                                readOnly ||
                                allowInStockChange === false
                              }
                              className={
                                isPreview ||
                                readOnly ||
                                allowInStockChange === false
                                  ? "cursor-not-allowed"
                                  : ""
                              }
                            />
                          </td>
                        )}
                        {showItemTypeAndDept && hasAnyInStock && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            {request.inStock ? (
                              <input
                                type="number"
                                min="1"
                                step="1"
                                placeholder="0"
                                value={
                                  parseInt(request.inStockQuantity, 10) > 0
                                    ? request.inStockQuantity
                                    : ""
                                }
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  // allow clearing while typing
                                  if (raw === "") {
                                    handleChange(itemId, "inStockQuantity", "");
                                    return;
                                  }
                                  // only accept digits
                                  if (!/^\d+$/.test(raw)) return;
                                  const parsed = parseInt(raw, 10);
                                  const minVal = 1;
                                  const maxVal =
                                    parseInt(request.quantity || 0, 10) || 0;
                                  let newVal = parsed;
                                  if (newVal < minVal) newVal = minVal;
                                  if (maxVal > 0 && newVal > maxVal)
                                    newVal = maxVal;
                                  handleChange(
                                    itemId,
                                    "inStockQuantity",
                                    newVal
                                  );
                                }}
                                onBlur={(e) => {
                                  const raw = e.target.value;
                                  if (raw === "" || raw === null) {
                                    handleChange(itemId, "inStockQuantity", 1);
                                    return;
                                  }
                                  if (!/^\d+$/.test(raw)) {
                                    handleChange(itemId, "inStockQuantity", 1);
                                    return;
                                  }
                                  const parsed = parseInt(raw, 10);
                                  const minVal = 1;
                                  const maxVal =
                                    parseInt(request.quantity || 0, 10) || 0;
                                  let newVal = parsed;
                                  if (newVal < minVal) newVal = minVal;
                                  if (maxVal > 0 && newVal > maxVal)
                                    newVal = maxVal;
                                  handleChange(
                                    itemId,
                                    "inStockQuantity",
                                    newVal
                                  );
                                }}
                                className="border px-2 py-1 rounded-md w-28 text-black"
                                disabled={
                                  isPreview || readOnly || !request.inStock
                                }
                              />
                            ) : (
                              <div className="text-sm text-slate-500">N/A</div>
                            )}
                          </td>
                        )}

                        {showItemTypeAndDept && hasAnyInStock && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            {request.inStock &&
                            parseInt(request.inStockQuantity, 10) > 0 ? (
                              <select
                                value={request.storeLocation || ""}
                                onChange={(e) =>
                                  handleChange(
                                    itemId,
                                    "storeLocation",
                                    e.target.value
                                  )
                                }
                                disabled={isPreview || readOnly}
                                className="border px-2 py-1 rounded-md w-40 text-black"
                              >
                                <option value="">Select store location</option>
                                {STORE_LOCATIONS.map((loc) => (
                                  <option key={loc} value={loc}>
                                    {loc}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-sm text-slate-500">N/A</div>
                            )}
                          </td>
                        )}

                        {showItemTypeAndDept && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            <select
                              value={request.logisticsType || "local"}
                              onChange={(e) => {
                                if (request.inStock) return;
                                handleChange(
                                  itemId,
                                  "logisticsType",
                                  e.target.value
                                );
                              }}
                              disabled={
                                isPreview ||
                                readOnly ||
                                allowLogisticsChange === false ||
                                request.inStock ||
                                request.itemType === "pettyCash"
                              }
                              className={`border px-2 py-1 rounded-md w-32 text-black ${
                                isPreview ||
                                request.inStock ||
                                request.itemType === "pettyCash"
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <option value="local">Local</option>
                              <option value="international">
                                International
                              </option>
                            </select>
                          </td>
                        )}
                        {showItemTypeAndDept && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={request.shippingQuantity || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "" || parseFloat(value) >= 0) {
                                  handleChange(
                                    itemId,
                                    "shippingQuantity",
                                    value
                                  );
                                }
                              }}
                              className={`border px-2 py-1 rounded-md w-20 text-black ${
                                request.logisticsType === "local"
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={request.logisticsType === "local"}
                              placeholder="0"
                            />
                          </td>
                        )}
                        {showItemTypeAndDept && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={request.shippingFee || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                // If international and other items share vendor, update all
                                if (
                                  request.logisticsType === "international" &&
                                  request.vendor
                                ) {
                                  setEditedRequests((prev) =>
                                    prev.map((item) =>
                                      item.vendor === request.vendor &&
                                      item.logisticsType === "international"
                                        ? {
                                            ...item,
                                            shippingFee: value,
                                            _dirty: true,
                                          }
                                        : item
                                    )
                                  );
                                } else {
                                  handleChange(
                                    request.itemId,
                                    "shippingFee",
                                    value
                                  );
                                }
                              }}
                              className={`border px-2 py-1 rounded-md w-24 text-black ${
                                request.logisticsType === "local"
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={request.logisticsType === "local"}
                              placeholder="0.00"
                            />
                          </td>
                        )}

                        {showUnitPrice && !loadingCurrencies && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            {allowPriceEditing ? (
                              <div className="flex items-center space-x-2">
                                <Select
                                  options={currencies}
                                  value={
                                    currencies.find(
                                      (c) =>
                                        c.value ===
                                        editedRequests.find(
                                          (item) =>
                                            item.itemId === request.itemId
                                        )?.currency
                                    ) || null
                                  }
                                  onChange={(selectedOption) => {
                                    // ignore changes when item is inStock
                                    const newCurrency =
                                      selectedOption?.value || "";

                                    setEditedRequests((prev) =>
                                      prev.map((item) =>
                                        item.itemId === request.itemId
                                          ? { ...item, currency: newCurrency }
                                          : item
                                      )
                                    );

                                    handleChange(
                                      request.itemId,
                                      "currency",
                                      newCurrency
                                    );
                                  }}
                                  className={`w-32 `}
                                  styles={{
                                    control: (provided) => ({
                                      ...provided,
                                      minWidth: "80px",
                                      fontSize: "14px",
                                      zIndex: 500,
                                    }),
                                    menuPortal: (base) => ({
                                      ...base,
                                      zIndex: 9999,
                                    }),
                                  }}
                                  menuPortalTarget={document.body}
                                  menuPlacement="auto"
                                  isClearable
                                  isDisabled={false}
                                  placeholder="Select"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  className={`border px-2 py-1 rounded-md w-24`}
                                  placeholder="Unit Price"
                                  value={
                                    editedRequests.find(
                                      (item) => item.itemId === request.itemId
                                    )?.unitPrice || ""
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      parseFloat(value) >= 0
                                    ) {
                                      handleChange(
                                        request.itemId,
                                        "unitPrice",
                                        value
                                      );
                                    }
                                  }}
                                  step="any"
                                  disabled={false}
                                />
                              </div>
                            ) : (
                              <span>
                                {`${request.unitPrice?.toFixed(2) || "0.00"} ${
                                  request.currency || ""
                                }`}
                              </span>
                            )}
                          </td>
                        )}

                        {showUnitPrice && (
                          <td
                            className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                            style={{ minWidth: "100px" }}
                          >
                            {allowPriceEditing ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={
                                    editedRequests.find(
                                      (item) => item.itemId === itemId
                                    )?.discount || ""
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      (parseFloat(value) >= 0 &&
                                        parseFloat(value) <= 100)
                                    ) {
                                      handleChange(itemId, "discount", value);
                                    }
                                  }}
                                  className={`border px-2 py-1 rounded-md w-16 text-black`}
                                  disabled={false}
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              <span>
                                {request.discount
                                  ? `${request.discount}%`
                                  : "0%"}
                              </span>
                            )}
                          </td>
                        )}

                        {showUnitPrice && showVat && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            <input
                              type="checkbox"
                              checked={
                                editedRequests.find(
                                  (item) => item.itemId === itemId
                                )?.vatted || false
                              }
                              onChange={(e) => {
                                handleChange(
                                  itemId,
                                  "vatted",
                                  e.target.checked
                                );
                              }}
                              disabled={
                                isPreview ||
                                readOnly ||
                                request.itemType === "pettyCash"
                              }
                              className={
                                isPreview ||
                                request.inStock ||
                                request.itemType === "pettyCash"
                                  ? "cursor-not-allowed"
                                  : ""
                              }
                            />
                          </td>
                        )}

                        {showUnitPrice && (
                          <td
                            className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                            style={{ minWidth: "100px" }}
                          >
                            <span
                              className={
                                request.itemType === "pettyCash"
                                  ? "text-gray-400"
                                  : ""
                              }
                            >
                              {editedRequests.find(
                                (item) => item.itemId === itemId
                              )?.currency || "NGN"}{" "}
                              {Number(
                                editedRequests.find(
                                  (item) => item.itemId === itemId
                                )?.total || 0
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </td>
                        )}
                        {showUnitPrice && showVat && (
                          <td
                            className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                            style={{ minWidth: "100px" }}
                          >
                            <span
                              className={
                                request.itemType === "pettyCash"
                                  ? "text-gray-400"
                                  : ""
                              }
                            >
                              {editedRequests.find(
                                (item) => item.itemId === itemId
                              )?.currency || "NGN"}{" "}
                              {(() => {
                                const local = editedRequests.find(
                                  (item) => item.itemId === itemId
                                );
                                if (!local) return "0";
                                const localVat = Number(local.vatAmount || 0);
                                if (localVat !== 0) {
                                  return localVat.toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  });
                                }
                                if (local.vatted) {
                                  // fallback compute if vatAmount missing
                                  const impliedBase =
                                    local.total / (1 + calculatedVat);
                                  const impliedVat =
                                    impliedBase * calculatedVat;
                                  return Number(impliedVat || 0).toLocaleString(
                                    undefined,
                                    {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 2,
                                    }
                                  );
                                }
                                return "0.00";
                              })()}
                            </span>
                          </td>
                        )}
                        {hasPRNVisible && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            <span>
                              {request.purchaseRequisitionNumber ||
                                request.purchaseReqNumber ||
                                request.prn ||
                                "N/A"}
                            </span>
                          </td>
                        )}
                        {showPON && (
                          <td className="border p-2 text-center">
                            {canEditPON ? (
                              <input
                                type="text"
                                value={
                                  editedRequests.find(
                                    (item) => item.itemId === request.itemId
                                  )?.purchaseOrderNumber || ""
                                }
                                onChange={(e) =>
                                  handleChange(
                                    request.itemId,
                                    "purchaseOrderNumber",
                                    e.target.value
                                  )
                                }
                                className={`border px-2 py-1 rounded-md w-24 ${
                                  request.itemType === "pettyCash"
                                    ? "bg-gray-200 cursor-not-allowed"
                                    : ""
                                }`}
                              />
                            ) : (
                              request.purchaseOrderNumber || "N/A"
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
      {deletionMode && deletingItem && (
        <>
          <textarea
            className="w-full border rounded-md p-2 text-black"
            placeholder="Enter reason for deleting this item..."
            value={deletionComment}
            onChange={(e) => setDeletionComment(e.target.value)}
          />
          <div className="flex gap-4 mt-2">
            <button
              className="bg-red-500 h-[40px] text-white px-4 py-2 rounded-md"
              onClick={() => {
                if (!deletingItem?.requestId || !deletingItem?.itemId) {
                  alert("❌ No item selected for deletion.");
                  return;
                }
                handleDeleteItem(
                  deletingItem.requestId,
                  deletingItem.itemId,
                  deletionComment
                );
                setDeletionMode(false);
                setDeletionComment("");
                setDeletingItem(null);
              }}
              disabled={isSubmittingDeletion}
            >
              {isSubmittingDeletion ? "Deleting..." : "Submit Deletion"}
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded-md"
              onClick={() => {
                setDeletionMode(false);
                setDeletionComment("");
                setDeletingItem(null);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      <div className="flex flex-col justify-between mt-4 space-x-4">
        <div className="flex justify-between mb-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center"
            onClick={() => {
              const el = tableRefs.current[activeTableIndex];
              if (el && typeof el.scrollBy === "function") {
                el.scrollBy({ left: -100, behavior: "smooth" });
              }
            }}
          >
            ◄
          </button>

          <div className="flex items-center justify-center">
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`px-6 h-12 flex items-center justify-center gap-2 px-4 rounded-md font-semibold ${
                isSaving
                  ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                  : "bg-[#036173] text-white hover:bg-[#024f57]"
              }`}
            >
              <MdCheckCircle className="text-lg" />

              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center"
            onClick={() => {
              const el = tableRefs.current[activeTableIndex];
              if (el && typeof el.scrollBy === "function") {
                el.scrollBy({ left: 100, behavior: "smooth" });
              }
            }}
          >
            ►
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcurementTable;
