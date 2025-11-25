import React, { useState, useEffect, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import { MdCheckCircle } from "react-icons/md";
import { generateAndUploadRequisition } from "../generateAndUploadRequisition";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

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
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

   useEffect(() => {
    // init editedRequests from items
    setEditedRequests(
      (items || []).map((it) => ({
        ...it,
        itemId: it.itemId || it._id || it.id,
        vendor: it.vendor || it.vendorName || "",
        vendorId: it.vendorId || it.vendor || null,
        purchaseReqNumber:
          it.purchaseReqNumber || it.prn || it.purchaseReqNumber || "",
        shippingQuantity: it.shippingQuantity || it.shippingQty || 0,
        shippingFee: it.shippingFee || 0,
        _dirty: false,
      }))
    );

    // init shippingFees map (use vendorId first for the key)
    const fees = {};
    (items || []).forEach((it) => {
      const key = it.vendorId ?? it.vendor ?? "No Vendor";
       if (it.shippingFee !== undefined && fees[key] === undefined)
         fees[key] = it.shippingFee;
    });
    setShippingFees(fees);
  }, [items]);

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
      prev.map((it) =>
        (it.itemId || it._id) === itemId
          ? { ...it, [field]: value, _dirty: true }
          : it
      )
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

  const handleSaveAll = async () => {
    if (!window.confirm("Save all changes to shipping items?")) return;
    const dirty = editedRequests.filter((it) => it._dirty);
    if (!dirty.length) {
      alert("No changes to save.");
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
            if (opt && opt.value !== undefined && opt.value !== null)
              createdByName[name] = opt.value;
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

      // 2) build updates
      const updates = editedRequests
        .filter((it) => it._dirty)
        .map((it) => ({
          itemId: it.itemId || it._id,
          changes: buildChangesForItem(it),
        }))
        .filter((u) => Object.keys(u.changes).length > 0);

      if (updates.length === 0) {
        alert("No actual changes detected to save.");
        setIsSaving(false);
        return;
      }

      // 3) send updates
      const results = await handleUnifiedEdit(updates);

      // 4) after save, optionally generate & upload requisitions for vendor groups with vendorId
      try {
        const token = getToken();
        const reqId = selectedRequest?.requestId;
        if (token && reqId) {
          const groups = groupByVendor(editedRequests);
          const uploadPromises = groups
            .map((g) => {
              const vId = g.items[0]?.vendorId;
              const vendorName = g.items[0]?.vendor || "vendor";
              if (!vId) return null;
              const itemsForVendor = g.items.map((it) => ({
                ...it,
                quantity: Number(it.quantity || 0),
                shippingQuantity: Number(it.shippingQuantity || 0),
                shippingFee: Number(it.shippingFee || 0),
              }));
              return generateAndUploadRequisition({
                request: selectedRequest,
                items: itemsForVendor,
                requestId: reqId,
                vendorName,
                token,
              }).then((uploaded) => ({ vendorName, uploaded }));
            })
            .filter(Boolean);

          if (uploadPromises.length > 0) {
            const settled = await Promise.allSettled(uploadPromises);
            const failed = settled.filter(
              (s) => s.status === "rejected"
            ).length;
            if (failed > 0) {
              console.warn(`${failed} requisition uploads failed`);
              alert(`${failed} requisition upload(s) failed. Check console.`);
            }
            // notify parent to refresh attached files
            try {
              if (typeof onFilesChanged === "function") onFilesChanged();
            } catch (cbErr) {
              console.error("onFilesChanged error:", cbErr);
            }
          }
        }
      } catch (err) {
        console.error("Requisition generation/upload error:", err);
      }

      // clear dirty flags
      setEditedRequests((prev) =>
        prev.map((it) => ({ ...it, _dirty: false, _pendingVendor: undefined }))
      );
      alert("Saved successfully");
    } catch (err) {
      console.error("Error saving shipping edits:", err);
      alert("Error saving changes. See console.");
    } finally {
      setIsSaving(false);
    }
  };

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
  const vendorKey = g.items[0]?.vendorId ?? g.items[0]?.vendor ?? "No Vendor";
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
                <th className="p-3 border border-slate-200 text-center">SN</th>
                <th className="p-3 border border-slate-200 text-left">
                  Description
                </th>
                <th className="p-3 border border-slate-200 text-left">
                  Item Type
                </th>
                <th className="p-3 border border-slate-200 text-left">Maker</th>
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
                <th className="p-3 border border-slate-200 text-center">PRN</th>
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
                        value={
                          (() => {
                            const key = it.vendorId ?? it.vendor;
                            const byId = vendorOptions.find((o) => String(o.value) === String(key));
                            if (byId) return byId;
                            const byLabel = vendorOptions.find(
                              (o) => String(o.label).toLowerCase() === String(it.vendor || "").toLowerCase()
                            );
                            if (byLabel) return byLabel;
                            return it.vendor ? { value: it.vendorId || it.vendor, label: it.vendor } : null;
                          })()
                        }
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
                        value={it.shippingQuantity || ""}
                        onChange={(e) =>
                          handleChange(
                            itemId,
                            "shippingQuantity",
                            e.target.value
                          )
                        }
                        className="w-20 border px-2 py-1 rounded"
                      />
                    </td>
                    {isFirstRow ? (
                      <td
                        className="border p-3 border-slate-200 text-center"
                        rowSpan={g.items.length}
                        style={{ verticalAlign: "middle" }}
                      >
                        <input
                          type="text"
                          value={g.items[0].purchaseReqNumber || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditedRequests((prev) =>
                              prev.map((r) =>
                                r.vendor === g.items[0].vendor ||
                                r.vendorId === g.items[0].vendorId
                                  ? {
                                      ...r,
                                      purchaseReqNumber: val,
                                      _dirty: true,
                                    }
                                  : r
                              )
                            );
                          }}
                          className="border px-2 py-1 rounded w-36"
                        />
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
                <td className="border p-3 border-slate-200 text-center">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      shippingFees[
                        g.items[0]?.vendor ||
                          g.items[0]?.vendorId ||
                          "No Vendor"
                      ] ?? ""
                    }
                    onChange={(e) => {
                      const v =
                        g.items[0]?.vendor ||
                        g.items[0]?.vendorId ||
                        "No Vendor";
                      const val =
                        e.target.value === ""
                          ? 0
                          : parseFloat(e.target.value) || 0;
                      setShippingFees((prev) => ({ ...prev, [v]: val }));
                      // apply to all items for this vendor
                      setEditedRequests((prev) =>
                        prev.map((it) =>
                          (it.vendor || it.vendorId || "No Vendor") === v
                            ? { ...it, shippingFee: val, _dirty: true }
                            : it
                        )
                      );
                    }}
                    className="border border-slate-200 px-2 py-1 rounded w-24 text-center"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  )
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
