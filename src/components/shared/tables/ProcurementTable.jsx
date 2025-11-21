import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaSave } from "react-icons/fa";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import axios from "axios";
import { MdCheckCircle } from "react-icons/md";
import { generateAndUploadRequisition } from "../generateAndUploadRequisition";
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
        if (
          Object.prototype.hasOwnProperty.call(payload, "inStock") &&
          payload.inStock === false
        ) {
          delete payload.storeLocation;
          delete payload.inStockQuantity;
        }

        try {
          console.log("handleUnifiedEdit payload:", itemId, payload); // <-- ADD THIS LINE

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

      // Try to use returned updated request(s) to refresh UI immediately
      // onEditItem (RequestDetailView.handleEditItem) returns the full updated request object
      const updatedRequest =
        results.find((r) => r && (r.items || r.data)) || results[0] || null;

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
      } else if (selectedRequest?.items) {
        setEditedRequests(
          selectedRequest.items.map((it) => ({
            ...it,
            itemId: it.itemId || it._id,
            total: it.totalPrice ?? it.total ?? 0,
            totalPrice: it.totalPrice ?? it.total ?? 0,
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

  // Build minimal changes for an edited item by comparing to original requests prop
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
    ];

    const changes = {};
    fieldsToCheck.forEach((f) => {
      const a = orig[f];
      const b = editedItem[f];
      // normalize numbers/strings for comparison
      const aNorm =
        typeof a === "number" ? Number(a) : a === undefined ? "" : String(a);
      const bNorm =
        typeof b === "number" ? Number(b) : b === undefined ? "" : String(b);
      if (aNorm !== bNorm) {
        // prefer numeric types when appropriate
        if (
          [
            "quantity",
            "unitPrice",
            "inStockQuantity",
            "shippingQuantity",
            "shippingFee",
          ].includes(f)
        ) {
          changes[f] = b === "" ? 0 : Number(b) || 0;
        } else if (f === "discount") {
          changes[f] = b === "" ? "" : Number(b);
        } else if (f === "vatted" || f === "inStock") {
          changes[f] = !!b;
        } else {
          changes[f] = b;
        }
      }
    });

    return changes;
  };

  const handleSaveAll = async () => {
    if (!window.confirm("Save all changes to the items?")) return;

    const dirty = editedRequests.filter((it) => it._dirty);
    if (!dirty || dirty.length === 0) {
      alert("No changes to save.");
      return;
    }

    try {
      setIsSaving(true);

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
          return {
            itemId: it.itemId || it._id,
            changes,
          };
        })
        .filter((u) => Object.keys(u.changes).length > 0);

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

      // --- after save: delete old requisition files not referenced and replace where needed ---
      (async () => {
        try {
          const token = getToken
            ? getToken()
            : sessionStorage.getItem("userToken") || null;
          const reqId = selectedRequest?.requestId;
          if (!reqId) return;

          const groups = groupAndSortRequests(editedRequests || []);

          // helper to resolve vendor name (from item or vendorId via vendors prop)
          const resolveVendorName = (itOrIdOrName) => {
            if (!itOrIdOrName) return null;
            // if it's an item-like object
            if (typeof itOrIdOrName === "object") {
              if (
                itOrIdOrName.vendor &&
                String(itOrIdOrName.vendor).trim() !== ""
              )
                return itOrIdOrName.vendor;
              const vid = itOrIdOrName.vendorId || itOrIdOrName.vendor || null;
              if (!vid) return null;
              const found = (vendors || []).find(
                (v) =>
                  String(v.vendorId) === String(vid) ||
                  String(v._id) === String(vid) ||
                  String(v.id) === String(vid)
              );
              return found?.name || String(vid);
            }
            // if it's a bare id or name string
            const s = String(itOrIdOrName);
            if (s.indexOf("v-") === 0 || s.match(/^[0-9a-fA-F]{24}$/)) {
              const found = (vendors || []).find(
                (v) =>
                  String(v.vendorId) === s ||
                  String(v._id) === s ||
                  String(v.id) === s
              );
              return found?.name || s;
            }
            return s;
          };

          // vendors we will upload for (persisted vendorId present) -> normalize names
          const vendorsToUploadNorm = new Set(
            groups
              .map((g) => {
                const it = g.items[0];
                // only upload for groups with a persisted vendorId
                if (!it?.vendorId) return null;
                return normalizeVendorKey(resolveVendorName(it));
              })
              .filter(Boolean)
          );

          // fetch latest request items (server) to know accurate vendor presence
          let serverItems = [];
          try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const resp = await axios.get(`${API_BASE_URL}/requests/${reqId}`, {
              headers,
            });
            const data = resp.data?.data ?? resp.data ?? resp.data;
            serverItems = data?.items || data?.request?.items || [];
          } catch (err) {
            console.warn(
              "Could not fetch latest request items, falling back to local editedRequests",
              err
            );
            serverItems = [];
          }

          const vendorsPresentList =
            serverItems && serverItems.length > 0
              ? serverItems.map((it) => resolveVendorName(it)).filter(Boolean)
              : groups
                  .map((g) => resolveVendorName(g.items[0]))
                  .filter(Boolean);

          const vendorsPresentNorm = new Set(
            vendorsPresentList.map((v) => normalizeVendorKey(v))
          );

          // fetch existing requisition files (primary endpoint)
          let existingUrls = [];
          try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const resp = await axios.get(
              `${API_BASE_URL}/requests/${reqId}/requisition-files`,
              { headers }
            );
            const data = resp.data?.data ?? resp.data ?? resp.data;
            if (Array.isArray(data) && data.length > 0) existingUrls = data;
            else {
              // fallback to request object
              const resp2 = await axios.get(
                `${API_BASE_URL}/requests/${reqId}`,
                { headers }
              );
              const rd = resp2.data?.data ?? resp2.data ?? resp2.data;
              existingUrls = Array.isArray(rd?.requisitionFiles)
                ? rd.requisitionFiles
                : [];
            }
          } catch (err) {
            console.error(
              "Error fetching existing requisition files (or fallback):",
              err
            );
            existingUrls = [];
          }

          // map existing files to vendor keys using filename parsing
          const existingFileMetas = (existingUrls || [])
            .map((url) => {
              const name = String(url).split("/").pop().split("?")[0];
              const vendor = extractVendorFromFilename(name);
              return {
                url,
                name,
                vendor,
                vendorKey: normalizeVendorKey(vendor),
              };
            })
            .filter(Boolean);

          // build list of files to delete:
          // - vendor not present anymore (vendorMissing)
          // - vendor present but we will replace (willReplace)
          const filesToDelete = existingFileMetas.filter((f) => {
            if (!f.vendorKey) return false;
            const vendorMissing = !vendorsPresentNorm.has(f.vendorKey);
            const willReplace = vendorsToUploadNorm.has(f.vendorKey);
            return vendorMissing || willReplace;
          });

          if (filesToDelete.length > 0) {
            const deletePromises = filesToDelete.map((f) =>
              axios
                .delete(`${API_BASE_URL}/requests/${reqId}/requisition-files`, {
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    "Content-Type": "application/json",
                  },
                  data: { fileUrl: f.url },
                })
                .then(() => ({ url: f.url, ok: true }))
                .catch((err) => ({ url: f.url, ok: false, err }))
            );
            const settled = await Promise.allSettled(deletePromises);
            settled.forEach((r) => {
              if (r.status === "fulfilled" && r.value && r.value.ok === false) {
                console.error(
                  "Failed to delete requisition file:",
                  r.value.url,
                  r.value.err
                );
              } else if (r.status === "rejected") {
                console.error("Delete promise rejected:", r.reason);
              }
            });

            // refresh parent (AttachedDocuments) immediately after deletions so UI reflects removed files
            try {
              if (typeof onFilesChanged === "function") onFilesChanged();
            } catch (cbErr) {
              console.error(
                "onFilesChanged callback error after deletions:",
                cbErr
              );
            }
          }

          // upload new requisitions for vendor groups with a persisted vendorId
          const uploadPromises = groups
            .map((g) => {
              const vendorId = g.items[0]?.vendorId;
              const vendorName = resolveVendorName(g.items[0]) || "vendor";
              if (!vendorId) return null;
              const itemsForVendor = g.items.map((it) => ({
                ...it,
                quantity: Number(it.quantity || 0),
                unitPrice: Number(it.unitPrice || 0),
                discount: it.discount === "" ? null : Number(it.discount || 0),
              }));
              return generateAndUploadRequisition({
                request: selectedRequest,
                items: itemsForVendor,
                requestId: reqId,
                vendorName,
                token,
              }).then((uploadedFiles) => ({ vendorName, uploadedFiles }));
            })
            .filter(Boolean);

          if (uploadPromises.length === 0) {
            try {
              if (typeof onFilesChanged === "function") onFilesChanged();
            } catch (cbErr) {
              console.error(
                "onFilesChanged callback error (no uploads):",
                cbErr
              );
            }
            return;
          }

          setIsSaving(true);
          const results = await Promise.allSettled(uploadPromises);

          const succeeded = results.filter(
            (r) => r.status === "fulfilled"
          ).length;
          const failed = results.filter((r) => r.status === "rejected").length;

          if (succeeded > 0) {
            try {
              if (typeof onFilesChanged === "function") onFilesChanged();
            } catch (cbErr) {
              console.error(
                "onFilesChanged callback error after uploads:",
                cbErr
              );
            }
          }

          if (failed > 0) {
            console.error("Some requisition uploads failed:", results);
            alert(
              `${failed} requisition upload(s) failed. Check console for details.`
            );
          }
        } catch (err) {
          console.error(
            "Error uploading/replacing requisitions after save:",
            err
          );
        } finally {
          setIsSaving(false);
        }
      })();
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
                // allow switching back from pettyCash if needed (do not force change when turning off)
              } else if (value === true) {
                if (
                  updatedItem.inStockQuantity === "" ||
                  updatedItem.inStockQuantity === null ||
                  parseInt(updatedItem.inStockQuantity, 10) === 0
                ) {
                  updatedItem.inStockQuantity = 1;
                }

                // When item is marked in-stock:
                // - clear/zero pricing fields and VAT immediately
                // - set itemType to pettyCash and clear destination
                updatedItem.unitPrice = 0;
                updatedItem.currency = "";
                updatedItem.discount = "";
                updatedItem.vatted = false;
                updatedItem.total = 0;

                updatedItem.itemType = "pettyCash";
                updatedItem.destination = "";
              }

              console.log("handleChange - inStock toggle:", {
                itemId,
                value,
                updatedItem,
              });
            }
            if (field === "inStock") {
              console.log("handleChange - inStock toggle:", {
                itemId,
                value,
                updatedItem,
              });
            }
          }

          // Recalculate total
          const currentUnitPrice = parseFloat(updatedItem.unitPrice) || 0;
          const currentQuantity = parseFloat(updatedItem.quantity) || 0;
          const currentDiscount =
            updatedItem.discount !== ""
              ? parseFloat(updatedItem.discount) || 0
              : 0;
          const isVatted = !!updatedItem.vatted;

          const baseTotal = currentUnitPrice * currentQuantity;
          const discountFactor =
            currentDiscount >= 0 && currentDiscount <= 100
              ? (100 - currentDiscount) / 100
              : 1;
          const discountedTotal = baseTotal * discountFactor;
          updatedItem.total = isVatted
            ? discountedTotal * (1 + calculatedVat)
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
    const vendorGroups = {};
    requests.forEach((request, index) => {
      const key = request.vendor || "No Vendor";
      if (!vendorGroups[key]) {
        vendorGroups[key] = { order: index, items: [] };
      }
      vendorGroups[key].items.push(request);
    });
    return Object.values(vendorGroups).sort((a, b) => a.order - b.order);
  };

  const groupedRequests = groupAndSortRequests(editedRequests);

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
        const token = sessionStorage.getItem("userToken");
        if (!token) return;
        const response = await axios.get(
          "https://hdp-backend-1vcl.onrender.com/api/vat/calculated",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCalculatedVat(response.data.calculatedVat || 0);
      } catch (error) {
        console.error("Error fetching VAT:", error);
      }
    };
    fetchVat();
  }, []);

  useEffect(() => {
    // Initialize shipping fees from items data
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
          existingItem?.vendorId ?? request.vendorId ?? request.vendor ?? null;
        const resolvedVendorName =
          existingItem?.vendor ||
          (resolvedVendorId
            ? (vendors || []).find(
                (v) =>
                  String(v.vendorId) === String(resolvedVendorId) ||
                  String(v._id) === String(resolvedVendorId) ||
                  String(v.id) === String(resolvedVendorId)
              )?.name
            : null) ||
          request.vendor ||
          "";

        return {
          ...request,
          itemId: request.itemId || request._id,
          // vendor and vendorId normalized so UI shows name immediately
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
          logisticsType:
            existingItem?.logisticsType || request.logisticsType || "local",
          shippingQuantity:
            existingItem?.shippingQuantity || request.shippingQuantity || 0,
          discount: existingItem?.discount || request.discount || "",
          vatted: existingItem?.vatted || request.vatted || false,
          // prefer request.totalPrice from backend, fall back to request.total
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
          shippingFee: request.shippingFee || 0,
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
      const payload = {
        ...updatedItem,
        quantity: parseFloat(updatedItem.quantity) || 1,
        unitPrice: parseFloat(updatedItem.unitPrice) || 0,
        discount: parseInt(updatedItem.discount) || "",
        vatted: updatedItem.vatted || false,
        inStock: updatedItem.inStock || false,
        totalPrice: parseFloat(updatedItem.total) || 0,
        purchaseReqNumber: updatedItem.purchaseReqNumber || "",
        purchaseOrderNumber: updatedItem.purchaseOrderNumber || "",
        requestId: selectedRequest?.requestId,
      };
      onEditItem(payload);
    }
    setEditingIndex(null);
    setRenderKey((prev) => prev + 1);
  };

  const getVendorKey = (item) => {
    if (
      selectedRequest?.clearing === false &&
      selectedRequest?.shipping === true
    ) {
      return item.shippingVendor || item.vendor || "No Vendor";
    } else if (
      selectedRequest?.clearing === true &&
      selectedRequest?.shipping === false
    ) {
      if (
        selectedRequest?.shippingItems &&
        selectedRequest.shippingItems.length > 0
      ) {
        return item.shippingVendor || item.vendor || "No Vendor";
      } else {
        return item.vendor || "No Vendor";
      }
    } else {
      return item.vendor || "No Vendor";
    }
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
                    {selectedRequest?.requestType === "purchaseOrder" &&
                      showItemTypeAndDept && (
                        <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                          Switch to Petty Cash
                        </th>
                      )}
                    {showItemTypeAndDept && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Destination
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
                    {showPRN && (
                      <th
                        className={`border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-24 ${
                          selectedRequest.itemType === "pettyCash"
                            ? "bg-gray-200 cursor-not-allowed"
                            : ""
                        }`}
                      >
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
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "150px" }}
                        >
                          {request.name}
                        </td>
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          {request.makersType}
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
                              options={vendors.map((vendor) => ({
                                value: vendor.vendorId,
                                label: vendor.name,
                              }))}
                              value={(() => {
                                const currentItem = editedRequests.find(
                                  (item) => item.itemId === request.itemId
                                );
                                return currentItem?.vendor
                                  ? {
                                      value:
                                        currentItem.vendorId ||
                                        currentItem.vendor,
                                      label: currentItem.vendor,
                                    }
                                  : null;
                              })()}
                              onChange={(selectedOption) => {
                                setEditedRequests((prev) =>
                                  prev.map((item) =>
                                    item.itemId === request.itemId
                                      ? {
                                          ...item,
                                          vendor: selectedOption?.label || null,
                                          vendorId:
                                            selectedOption?.value || null,
                                          _dirty: true,
                                          _pendingVendor: selectedOption
                                            ? {
                                                name: selectedOption.label,
                                                id:
                                                  selectedOption.value || null,
                                                isNew: false,
                                              }
                                            : null,
                                        }
                                      : item
                                  )
                                );
                              }}
                              onCreateOption={(inputValue) => {
                                setEditedRequests((prev) =>
                                  prev.map((item) =>
                                    item.itemId === request.itemId
                                      ? {
                                          ...item,
                                          vendor: inputValue,
                                          vendorId: null,
                                          _dirty: true,
                                          _pendingVendor: {
                                            name: inputValue,
                                            id: null,
                                            isNew: true,
                                          },
                                        }
                                      : item
                                  )
                                );
                              }}
                              className={`w-[170px] text-black ${
                                request.itemType === "pettyCash" ||
                                request.inStock
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : ""
                              }`}
                              styles={{
                                control: (provided) => ({
                                  ...provided,
                                  minWidth: "100px",
                                  fontSize: "14px",
                                  backgroundColor:
                                    request.itemType === "pettyCash" ||
                                    request.inStock
                                      ? "#e5e7eb"
                                      : provided.backgroundColor,
                                  cursor:
                                    request.itemType === "pettyCash" ||
                                    request.inStock
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
                              isDisabled={
                                request.itemType === "pettyCash" ||
                                request.inStock
                              }
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
                        {showItemTypeAndDept && (
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
                                  ? "cursor-not-allowed"
                                  : "") ||
                                (request.inStock ? "cursor-not-allowed" : "")
                              }
                            />
                          </td>
                        )}
                        {showItemTypeAndDept && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                            {request.itemType === "pettyCash" ? (
                              <Select
                                options={departmentOptions}
                                value={
                                  departmentOptions.find(
                                    (option) =>
                                      option.value === request.destination
                                  ) || null
                                }
                                onChange={(selected) =>
                                  handleChange(
                                    itemId,
                                    "destination",
                                    selected?.value || ""
                                  )
                                }
                                className="w-32 text-black"
                                styles={{
                                  control: (provided) => ({
                                    ...provided,
                                    minWidth: "100px",
                                    fontSize: "14px",
                                    zIndex: 9999,
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                }}
                                menuPortalTarget={document.body}
                                menuPlacement="auto"
                                placeholder="Select "
                              />
                            ) : (
                              "N/A"
                            )}
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
                                handleChange(itemId, "inStock", e.target.checked)
                              }
                              disabled={
                                isPreview ||
                                readOnly ||
                                allowInStockChange === false
                              }
                              className={
                                isPreview || readOnly || allowInStockChange === false
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
                                  const v = e.target.value;
                                  if (v === "" || /^\d+$/.test(v)) {
                                    handleChange(itemId, "inStockQuantity", v);
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === "") {
                                    handleChange(itemId, "inStockQuantity", 0);
                                  }
                                }}
                                className="border px-2 py-1 rounded-md w-28 text-black"
                                disabled={
                                  isPreview ||
                                  readOnly ||
                                  request.itemType === "pettyCash"
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
                                disabled={
                                  isPreview ||
                                  readOnly ||
                                  request.itemType === "pettyCash"
                                }
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
                                // prevent changes when item is inStock
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
                                request.itemType === "pettyCash" ||
                                request.inStock
                              }
                              className={`border px-2 py-1 rounded-md w-32 text-black ${
                                request.itemType === "pettyCash" ||
                                isPreview ||
                                request.inStock
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
                                request.itemType === "pettyCash" ||
                                request.logisticsType === "local"
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : ""
                              }`}
                              disabled={
                                request.itemType === "pettyCash" ||
                                request.logisticsType === "local"
                              }
                              placeholder="0"
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
                                    if (request.inStock) return;
                                    const newCurrency =
                                      selectedOption?.value || "";

                                    // UPDATE LOCAL STATE IMMEDIATELY
                                    setEditedRequests((prev) =>
                                      prev.map((item) =>
                                        item.itemId === request.itemId
                                          ? { ...item, currency: newCurrency }
                                          : item
                                      )
                                    );

                                    // Then call the debounced update
                                    handleChange(
                                      request.itemId,
                                      "currency",
                                      newCurrency
                                    );
                                  }}
                                  className={`w-32 ${
                                    request.itemType === "pettyCash" ||
                                    request.inStock
                                      ? "bg-gray-200 cursor-not-allowed"
                                      : ""
                                  }`}
                                  styles={{
                                    control: (provided) => ({
                                      ...provided,
                                      minWidth: "80px",
                                      fontSize: "14px",
                                      zIndex: 500,
                                      backgroundColor:
                                        request.itemType === "pettyCash" ||
                                        request.inStock
                                          ? "#e5e7eb"
                                          : provided.backgroundColor,
                                      cursor:
                                        request.itemType === "pettyCash" ||
                                        request.inStock
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
                                  isClearable
                                  isDisabled={
                                    request.itemType === "pettyCash" ||
                                    request.inStock
                                  }
                                  placeholder="Select"
                                />
                                <input
                                  type="number"
                                  min="0"
                                  className={`border px-2 py-1 rounded-md w-24 ${
                                    request.itemType === "pettyCash" ||
                                    request.inStock
                                      ? "bg-gray-200 cursor-not-allowed"
                                      : ""
                                  }`}
                                  placeholder="Unit Price"
                                  value={
                                    editedRequests.find(
                                      (item) => item.itemId === request.itemId
                                    )?.unitPrice || ""
                                  }
                                  onChange={(e) => {
                                    // ignore edits when item is inStock
                                    if (request.inStock) return;
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
                                  disabled={
                                    request.itemType === "pettyCash" ||
                                    request.inStock
                                  }
                                />
                              </div>
                            ) : (
                              <span
                                className={
                                  request.itemType === "pettyCash"
                                    ? "text-gray-400"
                                    : ""
                                }
                              >
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
                                    // ignore edits when item is inStock
                                    if (request.inStock) return;
                                    const value = e.target.value;
                                    if (
                                      value === "" ||
                                      (parseFloat(value) >= 0 &&
                                        parseFloat(value) <= 100)
                                    ) {
                                      handleChange(itemId, "discount", value);
                                    }
                                  }}
                                  className={`border px-2 py-1 rounded-md w-16 text-black ${
                                    request.itemType === "pettyCash" ||
                                    request.inStock
                                      ? "bg-gray-200 cursor-not-allowed"
                                      : ""
                                  }`}
                                  disabled={
                                    request.itemType === "pettyCash" ||
                                    request.inStock
                                  }
                                />
                                <span>%</span>
                              </div>
                            ) : (
                              <span
                                className={
                                  request.itemType === "pettyCash"
                                    ? "text-gray-400"
                                    : ""
                                }
                              >
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
                                // ignore toggles when item is inStock
                                if (request.inStock) return;
                                handleChange(
                                  itemId,
                                  "vatted",
                                  e.target.checked
                                );
                              }}
                              disabled={
                                isPreview ||
                                readOnly ||
                                request.itemType === "pettyCash" ||
                                request.inStock
                              }
                              className={
                                request.itemType === "pettyCash" ||
                                isPreview ||
                                request.inStock
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
                              {editedRequests.find(
                                (item) => item.itemId === itemId
                              )?.vatted
                                ? (
                                    (editedRequests.find(
                                      (item) => item.itemId === itemId
                                    )?.total /
                                      (1 + calculatedVat)) *
                                    calculatedVat
                                  ).toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })
                                : "0.00"}
                            </span>
                          </td>
                        )}
                        {showPRN && getVendorInfo(request).isFirstRow && (
                          <td
                            className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                            rowSpan={getVendorInfo(request).rowspan}
                            style={{ verticalAlign: "middle" }}
                          >
                            {canEditPRN ? (
                              <input
                                type="text"
                                value={request.purchaseReqNumber || ""}
                                onChange={(e) => {
                                  const newPRN = e.target.value;
                                  setEditedRequests((prev) =>
                                    prev.map((itm) =>
                                      getVendorKey(itm) ===
                                      getVendorInfo(request).vendorKey
                                        ? { ...itm, purchaseReqNumber: newPRN }
                                        : itm
                                    )
                                  );
                                  vendorGroups[
                                    getVendorInfo(request).vendorKey
                                  ].forEach((itm) => {
                                    onEditItem({
                                      ...itm,
                                      purchaseReqNumber: newPRN,
                                    });
                                  });
                                }}
                                className="border px-2 py-1 rounded-md w-24"
                              />
                            ) : (
                              <span>{request.purchaseReqNumber || "N/A"}</span>
                            )}
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
                {shouldShowShippingFeeForVendor(vendorGroup.items) && (
                  <tbody>
                    <tr className="">
                      <td
                        colSpan={
                          (showItemTypeAndDept ? 7 : 4) +
                          (showUnitPrice ? 4 : 0) +
                          (showUnitPrice && showVat ? 2 : 0) +
                          (showPRN ? 1 : 0) +
                          (showPON ? 1 : 0) +
                          (allowEditing ? 1 : 0) -
                          1
                        }
                        className="border p-3 text-center font-bold"
                      >
                        Shipping Fee -{" "}
                        {vendorGroup.items[0]?.vendor || "No Vendor"}
                      </td>
                      <td className="border p-3 text-center">
                        <input
                          type="number"
                          value={
                            shippingFees[
                              vendorGroup.items[0]?.vendor || "No Vendor"
                            ] || ""
                          }
                          onChange={(e) => {
                            const vendor =
                              vendorGroup.items[0]?.vendor || "No Vendor";
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseFloat(e.target.value) || 0;

                            // Update local state immediately
                            setShippingFees((prev) => ({
                              ...prev,
                              [vendor]: value,
                            }));

                            // Update all items with this vendor
                            const updates = editedRequests
                              .filter(
                                (item) =>
                                  (item.vendor || "No Vendor") === vendor
                              )
                              .map((item) => ({
                                itemId: item.itemId,
                                changes: { shippingFee: value },
                              }));

                            // Call unified edit with debounce
                            clearTimeout(window.shippingFeeTimeout);
                            window.shippingFeeTimeout = setTimeout(() => {
                              handleUnifiedEdit(updates);
                            }, 5000);
                          }}
                          onFocus={(e) => {
                            if (
                              e.target.value === "0" ||
                              e.target.value === "0.00"
                            ) {
                              e.target.value = "";
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              const vendor =
                                vendorGroup.items[0]?.vendor || "No Vendor";
                              setShippingFees((prev) => ({
                                ...prev,
                                [vendor]: 0,
                              }));
                            }
                          }}
                          className="border px-2 py-1 rounded-md w-24 text-black text-center"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </td>
                    </tr>
                  </tbody>
                )}
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
