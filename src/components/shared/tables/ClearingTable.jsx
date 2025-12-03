import React, { useState, useEffect } from "react";
import { MdCheckCircle } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";

const ClearingTable = ({
  items = [],
  userRole = "",
  vendors = [],
  selectedRequest = null,
  onEditItem = async () => {},
}) => {
  const [editedRequests, setEditedRequests] = useState([]);
  const [clearingFees, setClearingFees] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { getToken } = useAuth(); // add this line to get auth token
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  useEffect(() => {
    // initialize clearingFees and editedRequests from incoming items
    const fees = {};
    const initial = (items || []).map((it, idx) => {
      const itemId = it.itemId || it._id || it.id || `gen-${idx}`;
      const vendorKey = it.vendorId ?? it.vendor ?? "No Vendor";
      if (it.clearingFee !== undefined && fees[vendorKey] === undefined) {
        fees[vendorKey] = it.clearingFee;
      }
      return {
        ...it,
        itemId,
        vendor: it.vendor || it.vendorName || "",
        vendorId: it.vendorId ?? null,
        clearingFee: it.clearingFee ?? 0,
        _dirty: false,
      };
    });
    setClearingFees(fees);
    setEditedRequests(initial);
  }, [items]);

  const groupByVendor = (list) => {
    const groups = {};
    list.forEach((it, idx) => {
      const key = it.vendorId ?? it.vendor ?? "No Vendor";
      if (!groups[key]) groups[key] = { items: [], order: idx };
      groups[key].items.push({ ...it, _groupIndex: idx });
    });
    return Object.values(groups).sort((a, b) => a.order - b.order);
  };

  const handleChangeFee = (vendorKey, value) => {
    const parsed = value === "" ? 0 : Number(value) || 0;
    setClearingFees((prev) => ({ ...prev, [vendorKey]: parsed }));
    setEditedRequests((prev) =>
      prev.map((it) =>
        (it.vendorId ?? it.vendor ?? "No Vendor") === vendorKey
          ? { ...it, clearingFee: parsed, _dirty: true }
          : it
      )
    );
  };

  const buildChangesForItem = (editedItem) => {
    const orig =
      (items || []).find(
        (r) => (r.itemId || r._id) === (editedItem.itemId || editedItem._id)
      ) || {};
    const fields = ["clearingFee"];
    const changes = {};
    fields.forEach((f) => {
      const a = orig[f];
      const b = editedItem[f];
      const aNorm = a === undefined ? "" : String(a);
      const bNorm = b === undefined ? "" : String(b);
      if (aNorm !== bNorm) {
        if (["clearingFee"].includes(f)) {
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
      console.error("No selectedRequest.requestId for clearing edits");
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
    if (!window.confirm("Save clearing fee changes?")) return;

    const dirty = editedRequests.filter((it) => it._dirty);
    const hasDirtyItems = dirty.length > 0;

    // Build item-level updates
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

    // Determine if request-level clearingFee needs update (compare clearingFees state vs selectedRequest.clearingFee)
    let requestNeedsUpdate = false;
    let requestPayload = null;

    if (selectedRequest && typeof selectedRequest.requestId !== "undefined") {
      const currentReqFee = selectedRequest.clearingFee;
      const localFees = { ...clearingFees };

      if (typeof currentReqFee === "number") {
        const keys = Object.keys(localFees);
        if (keys.length === 1) {
          const onlyVal = Number(localFees[keys[0]] || 0);
          requestNeedsUpdate = Number(currentReqFee || 0) !== onlyVal;
          requestPayload = onlyVal;
        } else {
          // current is number but local is multi-vendor -> update to object
          requestNeedsUpdate = true;
          requestPayload = localFees;
        }
      } else if (currentReqFee && typeof currentReqFee === "object") {
        // both objects: compare JSON
        requestNeedsUpdate =
          JSON.stringify(currentReqFee || {}) !== JSON.stringify(localFees || {});
        requestPayload = localFees;
      } else {
        // no value on request yet
        requestNeedsUpdate = Object.keys(localFees).length > 0;
        requestPayload =
          Object.keys(localFees).length === 1
            ? Number(localFees[Object.keys(localFees)[0]] || 0)
            : localFees;
      }
    }

    if (!hasDirtyItems && !requestNeedsUpdate) {
      alert("No changes to save.");
      return;
    }

    setIsSaving(true);
    try {
      // First: apply item-level updates (if any) via existing handler
      let itemResults = [];
      if (updates.length > 0) {
        itemResults = await handleUnifiedEdit(updates);
      }

      // Then: apply request-level clearingFee update if needed
      if (requestNeedsUpdate) {
        if (!selectedRequest || !selectedRequest.requestId) {
          throw new Error("No selectedRequest.requestId to update request-level clearingFee");
        }
        const token = await getToken();
        const url = `${API_BASE_URL}/requests/${selectedRequest.requestId}`;
        const body = { clearingFee: requestPayload };
        const resp = await fetch(url, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(
            `Failed updating request clearingFee: ${resp.status} ${resp.statusText} ${text}`
          );
        }
      }

      // Clear local dirty flags (server may not return items)
      setEditedRequests((prev) => prev.map((it) => ({ ...it, _dirty: false })));
      alert("Saved successfully");

      return { itemResults, requestUpdated: requestNeedsUpdate };
    } catch (err) {
      console.error("Error saving clearing edits:", err);
      alert("Error saving changes. See console.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
// ...existing code...

  if (!editedRequests || editedRequests.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No clearing items</p>
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
        const vendorLabel = g.items[0]?.vendor || vendorKey;

        return (
          <div key={gi} className="overflow-x-auto mb-4">
            <div className="mb-2 text-sm font-semibold">{vendorLabel}</div>
            <table className="w-full border-collapse border-2 border-slate-200 text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
                  <th className="p-3 border border-slate-200 text-center">SN</th>
                  <th className="p-3 border border-slate-200 text-left">Description</th>
                  <th className="p-3 border border-slate-200 text-left">Item Type</th>
                  <th className="p-3 border border-slate-200 text-left">Maker</th>
                  <th className="p-3 border border-slate-200 text-left">Maker's Part No</th>
                  <th className="p-3 border border-slate-200 text-center">Vendor</th>
                  <th className="p-3 border border-slate-200 text-center">Quantity</th>
                  <th className="p-3 border border-slate-200 text-center">Clearing Fee</th>
                </tr>
              </thead>
              <tbody>
                {g.items.map((it, idx) => {
                  const itemId = it.itemId || it._id;
                  return (
                    <tr key={itemId} className="hover:bg-emerald-50 transition-colors duration-150">
                      <td className="border p-3 border-slate-200 text-center">{idx + 1}</td>
                      <td className="border p-3 border-slate-200">{it.name || "N/A"}</td>
                      <td className="border p-3 border-slate-200">{it.itemType || "N/A"}</td>
                      <td className="border p-3 border-slate-200">{it.maker || "N/A"}</td>
                      <td className="border p-3 border-slate-200">{it.makersPartNo || "N/A"}</td>
                      <td className="border p-3 border-slate-200 text-center">{it.vendor || "N/A"}</td>
                      <td className="border p-3 border-slate-200 text-center">{it.quantity ?? it.qty ?? "0"}</td>
                      {idx === 0 ? (
                        <td
                          className="border p-3 border-slate-200 text-center"
                          rowSpan={g.items.length}
                          style={{ verticalAlign: "middle" }}
                        >
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={clearingFees[vendorKey] ?? ""}
                            onChange={(e) => handleChangeFee(vendorKey, e.target.value)}
                            className="border border-slate-200 px-2 py-1 rounded w-24 text-center"
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      <div className="flex items-center justify-center mt-4">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`px-6 h-12 rounded-md font-semibold ${
            isSaving ? "bg-gray-300 text-gray-700" : "bg-[#036173] text-white hover:bg-[#024f57]"
          }`}
        >
          <MdCheckCircle className="inline mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default ClearingTable;