import React, { useState, useEffect } from "react";
import { MdCheckCircle } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { useGlobalAlert } from "../GlobalAlert";
import { useGlobalPrompt } from "../GlobalPrompt";

const ClearingTable = ({
  items = [],
  userRole = "",
  vendors = [],
  selectedRequest = null,
  onEditItem = async () => {},
  onRefreshRequest = async () => {},
  onFilesChanged = () => {},
}) => {
  const [editedRequests, setEditedRequests] = useState([]);
  const [clearingFee, setClearingFee] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { getToken } = useAuth();
  const { showAlert } = useGlobalAlert();
  const { showPrompt } = useGlobalPrompt();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setEditedRequests(
      (items || []).map((it, idx) => ({
        ...it,
        itemId: it.itemId || it._id || it.id || `gen-${idx}`,
        vendor: it.vendor || it.vendorName || "",
        vendorId: it.vendorId ?? null,
        _dirty: false,
      }))
    );
    // Set clearingFee from request-level
    setClearingFee(
      typeof selectedRequest?.clearingFee === "number"
        ? selectedRequest.clearingFee
        : ""
    );
  }, [items, selectedRequest?.clearingFee]);

  const handleChangeFee = (value) => {
    setClearingFee(value === "" ? "" : Number(value) || 0);
  };

  const handleSaveAll = async () => {
    const ok = await showPrompt("Save clearing fee changes?");
    if (!ok) return;
    setIsSaving(true);
    try {
      // Save clearingFee at request-level
      if (selectedRequest && typeof selectedRequest.requestId !== "undefined") {
        const token = await getToken();
        const url = `${API_BASE_URL}/requests/${selectedRequest.requestId}`;
        const body = {
          clearingFee: clearingFee === "" ? 0 : Number(clearingFee),
        };
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

      // Refresh request data to get latest from server
      if (typeof onRefreshRequest === "function") {
        await onRefreshRequest();
      }
      try {
        if (typeof onFilesChanged === "function") onFilesChanged();
      } catch (cbErr) {
        console.error("onFilesChanged callback error after save:", cbErr);
      }

      showAlert("Saved successfully");
    } catch (err) {
      console.error("Error saving clearing edits:", err);
      showAlert("Error saving changes. See console.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  if (!editedRequests || editedRequests.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No clearing items</p>
      </div>
    );
  }

  return (
    <div className="p-4 w-full mx-auto overflow-x-auto">
      {isSaving && (
        <div className="mb-4 p-2 bg-[blue-100] text-[#036173] rounded">
          Saving changes...
        </div>
      )}

      <table className="w-full border-collapse border-2 border-slate-200 text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
            <th className="p-3 border border-slate-200 text-center">SN</th>
            <th className="p-3 border border-slate-200 text-left">
              Description
            </th>
            <th className="p-3 border border-slate-200 text-left">Item Type</th>
            <th className="p-3 border border-slate-200 text-left">Maker</th>
            <th className="p-3 border border-slate-200 text-left">
              Maker's Part No
            </th>
            <th className="p-3 border border-slate-200 text-center">Vendor</th>
            <th className="p-3 border border-slate-200 text-center">
              Quantity
            </th>
            <th className="p-3 border border-slate-200 text-center">
              Shipping Quantity
            </th>
            <th className="p-3 border border-slate-200 text-center">
              Shipping Fee
            </th>
          </tr>
        </thead>
        <tbody>
          {editedRequests.map((it, idx) => (
            <tr
              key={it.itemId}
              className="hover:bg-emerald-50 transition-colors duration-150"
            >
              <td className="border p-3 border-slate-200 text-center">
                {idx + 1}
              </td>
              <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                {it.name || "N/A"}
              </td>
              <td className="border p-3 border-slate-200">
                {it.itemType || "N/A"}
              </td>
              <td className="border p-3 border-slate-200">
                {it.maker || "N/A"}
              </td>
              <td className="border p-3 border-slate-200">
                {it.makersPartNo || "N/A"}
              </td>
              <td className="border p-3 border-slate-200 text-center">
                {it.vendor || "N/A"}
              </td>
              <td className="border p-3 border-slate-200 text-center">
                {it.quantity ?? it.qty ?? "0"}
              </td>
              <td className="border p-3 border-slate-200 text-center">
                {it.shippingQuantity ?? it.qty ?? "0"}
              </td>
              <td className="border p-3 border-slate-200 text-center">
                {selectedRequest?.shippingFee ?? "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td
              colSpan={8}
              className="border p-3 border-slate-200 text-right font-semibold"
            >
              Clearing Fee:
            </td>
            <td className="border p-3 border-slate-200 text-center">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={
                  clearingFee === 0 || clearingFee === "" ? "" : clearingFee
                }
                onChange={(e) => handleChangeFee(e.target.value)}
                className="border border-slate-200 px-2 py-1 rounded w-24 text-center"
              />
            </td>
          </tr>
        </tfoot>
      </table>

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

export default ClearingTable;
