import React, { useState, useEffect, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { MdCheckCircle } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { useGlobalAlert } from "../GlobalAlert";
import { useGlobalPrompt } from "../GlobalPrompt";

const ShippingTable = ({
  items = [],
  userRole = "",
  vendors = [],
  selectedRequest = null,
  onEditItem = async () => {},
  handleCreateVendor = async () => {},
  onFilesChanged = () => {},
}) => {
  const { getToken } = useAuth();
  const [editedRequests, setEditedRequests] = useState([]);
  const [shippingFees, setShippingFees] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [needsScroll, setNeedsScroll] = useState(false);
  const tableRef = useRef(null);
  const [currencies, setCurrencies] = useState([
    { value: "NGN", label: "NGN" },
    { value: "USD", label: "USD" },
    { value: "GBP", label: "GBP" },
    { value: "EUR", label: "EUR" },
    { value: "JPY", label: "JPY" },
    { value: "CNY", label: "CNY" },
    { value: "CAD", label: "CAD" },
    { value: "AUD", label: "AUD" },
  ]);
  const [currency, setCurrency] = useState({});

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";
  const { showAlert } = useGlobalAlert();
  const { showPrompt } = useGlobalPrompt(); // Add this line

  // ...existing code...
  useEffect(() => {
    // Do not re-init if there are unsaved local edits
    if (editedRequests.some((it) => it && it._dirty)) {
      console.log(
        "ShippingTable: skipping re-init because local unsaved edits exist"
      );
      return;
    }

    // Build shippingFees map from items (use vendorId first, fallback to vendor text)
    const fees = {};
    (items || []).forEach((it) => {
      const key = it.vendorId ?? it.vendor ?? "No Vendor";
      if (it.shippingFee !== undefined && fees[key] === undefined) {
        fees[key] = it.shippingFee;
      }
    });
    setShippingFees(fees);
    const currenciesMap = {};
    (items || []).forEach((it) => {
      const key = it.vendorId ?? it.vendor ?? "No Vendor";
      if (
        it.currency !== undefined &&
        currenciesMap[key] === undefined
      ) {
        currenciesMap[key] = it.currency;
      }
    });
    setCurrency(currenciesMap);

    // Initialize local editedRequests from items (take shippingFee from each item)
    setEditedRequests(
      (items || []).map((it) => ({
        ...it,
        itemId: it.itemId || it._id || it.id,
        vendor: it.vendor || it.vendorName || "",
        vendorId: it.vendorId ?? it.vendor ?? null,
        purchaseReqNumber: it.purchaseReqNumber || it.prn || "",
        shippingQuantity: it.shippingQuantity ?? it.shippingQty ?? 0,
        shippingFee: it.shippingFee ?? 0,
        _dirty: false,
      }))
    );
  }, [items]);
  // ...existing code...

  useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("requester-table-container");
      if (container)
        setNeedsScroll(container.scrollWidth > container.clientWidth);
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [editedRequests]);

  const getVendorOptions = () =>
    (vendors || []).map((v) => ({
      value: v.vendorId ?? v._id ?? v.id,
      label: v.name || v.vendorName || v.name,
    }));

  const handleChange = (itemId, field, value) => {
    setEditedRequests((prev) =>
      prev.map((it) => {
        if ((it.itemId || it._id) !== itemId) return it;

        // For shippingQuantity, ensure it doesn't exceed quantity
        if (field === "shippingQuantity") {
          const maxQty = Number(it.quantity) || 0;
          const numVal =
            typeof value === "number" ? value : parseInt(value) || 0;
          const cappedVal = Math.min(numVal, maxQty);
          return { ...it, [field]: cappedVal, _dirty: true };
        }

        return { ...it, [field]: value, _dirty: true };
      })
    );
  };

  const groupByVendor = (list) => {
    const groups = {};
    list.forEach((it, idx) => {
      const key = it.vendor || it.vendorId || "No Vendor";
      if (!groups[key]) groups[key] = { items: [], order: idx };
      groups[key].items.push({ ...it, _groupIndex: idx });
    });
    return Object.values(groups).sort((a, b) => a.order - b.order);
  };

  const buildChangesForItem = (editedItem) => {
    const orig =
      (items || []).find(
        (r) => (r.itemId || r._id) === (editedItem.itemId || editedItem._id)
      ) || {};
    const fields = [
      "quantity",
      "shippingQuantity",
      "vendorId",
      "vendor",
      "purchaseReqNumber",
      "shippingFee",
      "currency",
    ];
    const changes = {};
    fields.forEach((f) => {
      const a = orig[f];
      const b = editedItem[f];
      const aNorm = a === undefined ? "" : String(a);
      const bNorm = b === undefined ? "" : String(b);
      if (aNorm !== bNorm) {
        if (["quantity", "shippingQuantity", "shippingFee"].includes(f)) {
          changes[f] = b === "" ? 0 : Number(b) || 0;
        } else {
          changes[f] = b;
        }
      }
    });
    return changes;
  };

  const handleUnifiedEdit = async (updates) => {
    if (!onEditItem) return;
    const reqId = selectedRequest?.requestId;
    if (!reqId) {
      console.error("No selectedRequest.requestId");
      return;
    }
    const promises = updates.map(async (u) => {
      const itemId = u.itemId;
      const payload = { ...u.changes, requestId: reqId };
      return onEditItem({ ...payload, itemId });
    });
    return Promise.all(promises);
  };

  // ...existing code...
  const handleSaveAll = async () => {
    const ok = await showPrompt("Save all changes to shipping items?");
    if (!ok) return;
    const dirty = editedRequests.filter((it) => it._dirty);
    if (!dirty.length) {
      showAlert("No changes to save.");
      return;
    }

    setIsSaving(true);
    try {
      // 1) create new vendors if any _pendingVendor present
      const pendingNames = [
        ...new Set(
          dirty
            .filter((it) => it._pendingVendor?.isNew)
            .map((it) => it._pendingVendor.name)
        ),
      ];
      const createdByName = {};
      if (pendingNames.length && typeof handleCreateVendor === "function") {
        for (const name of pendingNames) {
          try {
            const opt = await handleCreateVendor(name);
            if (opt && opt.value !== undefined && opt.value !== null) {
              createdByName[name] = opt.value;
            }
          } catch (err) {
            console.error("create vendor failed", name, err);
          }
        }
      }

      // apply created vendor ids back into local editedRequests
      if (Object.keys(createdByName).length) {
        setEditedRequests((prev) =>
          prev.map((it) =>
            it._pendingVendor &&
            it._pendingVendor.isNew &&
            createdByName[it._pendingVendor.name]
              ? {
                  ...it,
                  vendorId: createdByName[it._pendingVendor.name],
                  _pendingVendor: {
                    ...it._pendingVendor,
                    id: createdByName[it._pendingVendor.name],
                    isNew: false,
                  },
                }
              : it
          )
        );
      }

      // 2) build updates from current snapshot
      const snapshot = editedRequests.slice();
      const updates = snapshot
        .filter((it) => it._dirty)
        .map((it) => {
          const changes = buildChangesForItem(it);

          // normalize incorrect key if present
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

      console.log("ShippingTable handleSaveAll - updates payload:", updates);

      if (updates.length === 0) {
        showAlert("No actual changes detected to save.");
        setIsSaving(false);
        return;
      }

      // 3) send updates via unified edit helper
      const results = await handleUnifiedEdit(updates);

      // 4) update local state from server response when possible
      // handleUnifiedEdit may return updated request objects or item responses
      const updatedRequest =
        results && Array.isArray(results)
          ? results.find((r) => r && (r.items || r.data)) || results[0] || null
          : results || null;

      const itemsFromServer =
        updatedRequest?.items || updatedRequest?.data?.items || null;

      const latestItems =
        itemsFromServer &&
        Array.isArray(itemsFromServer) &&
        itemsFromServer.length
          ? itemsFromServer
          : editedRequests || [];

      const rebuiltFees = {};
      (latestItems || []).forEach((it) => {
        const key = it.vendorId ?? it.vendor ?? "No Vendor";
        if (it.shippingFee !== undefined && it.shippingFee !== null) {
          rebuiltFees[key] = it.shippingFee;
        }
      });
      setShippingFees(rebuiltFees);

      if (
        itemsFromServer &&
        Array.isArray(itemsFromServer) &&
        itemsFromServer.length
      ) {
        // Replace editedRequests with server items to keep canonical shape
        setEditedRequests(
          itemsFromServer.map((it) => ({
            ...it,
            itemId: it.itemId || it._id,
            shippingQuantity: it.shippingQuantity ?? it.shippingQty ?? 0,
            shippingFee: it.shippingFee ?? 0,
            purchaseReqNumber: it.purchaseReqNumber ?? it.prn ?? "",
            vendor: it.vendor || it.vendorName || "",
            vendorId: it.vendorId ?? (it.vendor && it.vendor.vendorId) ?? null,
            _dirty: false,
            _pendingVendor: undefined,
          }))
        );
      } else {
        // Server did not return full items: clear dirty flags locally
        setEditedRequests((prev) =>
          prev.map((it) => ({
            ...it,
            _dirty: false,
            _pendingVendor: undefined,
          }))
        );
      }

      // Notify parent components if they rely on files or related updates
      try {
        if (typeof onFilesChanged === "function") onFilesChanged();
      } catch (cbErr) {
        console.error("onFilesChanged callback error after save:", cbErr);
      }

      showAlert("Saved successfully");
      return results;
    } catch (err) {
      console.error("Error saving shipping edits:", err);
      showAlert("Error saving changes. See console.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
  // ...existing code...

  const vendorOptions = getVendorOptions();

  if (!editedRequests || editedRequests.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No shipping items</p>
      </div>
    );
  }

  const groups = groupByVendor(editedRequests);

  return (
    <div className="p-4 w-full mx-auto overflow-x-auto">
      {isSaving && (
        <div className="mb-4 p-2 bg-[blue-100] text-[#036173] rounded">
          Saving changes...
        </div>
      )}

      {groups.map((g, gi) => {
        const vendorKey =
          g.items[0]?.vendorId ?? g.items[0]?.vendor ?? "No Vendor";
        // prefer matching by id, fallback to matching by label, else fallback to raw vendor text
        const vendorOption =
          vendorOptions.find((o) => String(o.value) === String(vendorKey)) ||
          vendorOptions.find(
            (o) =>
              String(o.label).toLowerCase() ===
              String(g.items[0]?.vendor || "").toLowerCase()
          );
        const vendorLabel = vendorOption
          ? vendorOption.label
          : g.items[0]?.vendor || vendorKey;

        return (
          <div key={gi} className="overflow-x-auto mb-4">
            <table className="w-full border-collapse border-2 border-slate-200 text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
                  <th className="p-3 border border-slate-200 text-center">
                    SN
                  </th>
                  <th className="p-3 border border-slate-200 text-left">
                    Description
                  </th>
                  <th className="p-3 border border-slate-200 text-left">
                    Item Type
                  </th>
                  <th className="p-3 border border-slate-200 text-left">
                    Maker
                  </th>
                  <th className="p-3 border border-slate-200 text-left">
                    Maker's Part No
                  </th>
                  <th className="p-3 border border-slate-200 text-left">
                    Vendor
                  </th>
                  <th className="p-3 border border-slate-200 text-center">
                    Quantity
                  </th>
                  <th className="p-3 border border-slate-200 text-center">
                    Shipping Qty
                  </th>
                  <th className="p-3 border border-slate-200 text-center">
                    PRN
                  </th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((it, idx) => {
                  const itemId = it.itemId || it._id;
                  const isFirstRow = idx === 0;
                  return (
                    <tr
                      key={itemId}
                      className="hover:bg-emerald-50 transition-colors duration-150"
                    >
                      <td className="border p-3 border-slate-200 text-center">
                        {idx + 1}
                      </td>
                      <td className="border p-3 border-slate-200">
                        {it.name || "N/A"}
                      </td>
                      <td className="border p-3 border-slate-200">
                        {it.itemType || it.makersType || "N/A"}
                      </td>
                      <td className="border p-3 border-slate-200">
                        {it.maker || "N/A"}
                      </td>
                      <td className="border p-3 border-slate-200">
                        {it.makersPartNo || "N/A"}
                      </td>
                      <td className="border p-3 border-slate-200">
                        <CreatableSelect
                          options={vendorOptions}
                          value={(() => {
                            const key = it.vendorId ?? it.vendor;
                            const byId = vendorOptions.find(
                              (o) => String(o.value) === String(key)
                            );
                            if (byId) return byId;
                            const byLabel = vendorOptions.find(
                              (o) =>
                                String(o.label).toLowerCase() ===
                                String(it.vendor || "").toLowerCase()
                            );
                            if (byLabel) return byLabel;
                            return it.vendor
                              ? {
                                  value: it.vendorId || it.vendor,
                                  label: it.vendor,
                                }
                              : null;
                          })()}
                          onChange={(sel) => {
                            const vname = sel?.label || null;
                            const vid = sel?.value || null;
                            setEditedRequests((prev) =>
                              prev.map((row) =>
                                (row.itemId || row._id) === itemId
                                  ? {
                                      ...row,
                                      vendor: vname,
                                      vendorId: vid,
                                      _dirty: true,
                                      _pendingVendor:
                                        sel && sel.__isNew__
                                          ? { name: vname, isNew: true }
                                          : undefined,
                                    }
                                  : row
                              )
                            );
                            // Move shipping fee to new vendor key
                            setShippingFees((prev) => {
                              const oldKey =
                                it.vendorId ?? it.vendor ?? "No Vendor";
                              const newKey = vid ?? vname ?? "No Vendor";
                              const fee = prev[oldKey] ?? 0;
                              const updated = { ...prev };
                              // Remove old key, set new key
                              delete updated[oldKey];
                              updated[newKey] = fee;
                              return updated;
                            });
                          }}
                          onCreateOption={(inputValue) => {
                            setEditedRequests((prev) =>
                              prev.map((row) =>
                                (row.itemId || row._id) === itemId
                                  ? {
                                      ...row,
                                      vendor: inputValue,
                                      vendorId: null,
                                      _dirty: true,
                                      _pendingVendor: {
                                        name: inputValue,
                                        isNew: true,
                                      },
                                    }
                                  : row
                              )
                            );
                          }}
                          isClearable
                          menuPortalTarget={document.body}
                          styles={{
                            control: (p) => ({ ...p, minWidth: 160 }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          }}
                        />
                      </td>
                      <td className="border p-3 border-slate-200 text-center">
                        <span className="font-semibold text-slate-900">
                          {it.quantity ?? it.qty ?? "0"}
                        </span>
                      </td>
                      <td className="border p-3 border-slate-200 text-center">
                        <input
                          type="number"
                          min="0"
                          max={it.quantity || 0}
                          placeholder="0"
                          value={
                            it.shippingQuantity === 0 ||
                            it.shippingQuantity === undefined ||
                            it.shippingQuantity === null
                              ? ""
                              : it.shippingQuantity
                          }
                          onChange={(e) => {
                            const maxQty = Number(it.quantity) || 0;
                            let val =
                              e.target.value === ""
                                ? ""
                                : parseInt(e.target.value) || 0;

                            // Cap shipping quantity to not exceed item quantity
                            if (val !== "" && val > maxQty) {
                              val = maxQty;
                              showAlert(
                                `Shipping quantity cannot exceed item quantity (${maxQty})`
                              );
                            }

                            handleChange(
                              itemId,
                              "shippingQuantity",
                              val === "" ? 0 : val
                            );
                          }}
                          className="w-20 border px-2 py-1 rounded"
                        />
                      </td>
                      {isFirstRow ? (
                        <td
                          className="border p-3 border-slate-200 text-center text-sm text-slate-700"
                          rowSpan={g.items.length}
                          style={{ verticalAlign: "middle" }}
                        >
                          <span>
                            {g.items[0].purchaseRequisitionNumber ||
                              g.items[0].purchaseReqNumber ||
                              g.items[0].prn ||
                              "N/A"}
                          </span>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>

              {/* shipping fee row if any international items exist (simple unconditional row here) */}
              <tbody>
                <tr>
                  <td
                    colSpan={6}
                    className="border p-3 border-slate-200 text-center font-bold"
                  >
                    Shipping Fee - {vendorLabel}
                  </td>
               
<td
  colSpan={3}
  className="border p-3 border-slate-200 text-center"
>
  <div className="flex items-center gap-2 justify-center">
    <Select
      options={currencies}
      value={
        currencies.find(
          (c) =>
            c.value === (currency[vendorKey] || "NGN")
        ) || currencies[0]
      }
      onChange={(selected) => {
        const currency = selected?.value || "NGN";
        setCurrency((prev) => ({
          ...prev,
          [vendorKey]: currency,
        }));
        setEditedRequests((prev) =>
          prev.map((it) =>
            (it.vendorId ?? it.vendor ?? "No Vendor") === vendorKey
              ? {
                  ...it,
                  currency: currency,
                  _dirty: true,
                }
              : it
          )
        );
      }}
      className="w-24"
      menuPortalTarget={document.body}
      styles={{
    menuPortal: (base) => ({ ...base, zIndex: 500 }),
  }}
    />

    <input
      type="number"
      min="0"
      step="0.01"
      placeholder="0"
      value={
        shippingFees[vendorKey] === 0 ||
        shippingFees[vendorKey] === undefined ||
        shippingFees[vendorKey] === null
          ? ""
          : shippingFees[vendorKey]
      }
      onChange={(e) => {
        const val =
          e.target.value === ""
            ? ""
            : parseFloat(e.target.value) || 0;
        const vkey = vendorKey;
        setShippingFees((prev) => ({ ...prev, [vkey]: val }));
        setEditedRequests((prev) =>
          prev.map((it) =>
            (it.vendorId ?? it.vendor ?? "No Vendor") === vkey
              ? {
                  ...it,
                  shippingFee: val === "" ? 0 : val,
                  currency:
                    currency[vkey] || "NGN",
                  _dirty: true,
                }
              : it
          )
        );
      }}
      className="border border-slate-200 px-2 py-1 rounded w-24 text-center"
    />
  </div>
</td>

                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Save controls */}
      <div className="flex items-center justify-center mt-4">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`px-6 h-12 rounded-md font-semibold ${
            isSaving
              ? "bg-gray-300 text-gray-700"
              : "bg-[#036173] text-white hover:bg-[#024f57]"
          }`}
        >
          <MdCheckCircle className="inline mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default ShippingTable;
