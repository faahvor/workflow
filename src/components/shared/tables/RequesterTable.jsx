// src/components/tables/RequesterTable.jsx

import React, { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useGlobalAlert } from "../GlobalAlert";

const RequesterTable = ({
  items = [],
  userRole = "",
  requestId = null,
  requestType = "purchaseOrder",
  onEditItem = null,
  requestStatus = "",
  isQueried = false,
  request,
}) => {
  const [editedItems, setEditedItems] = useState(
    Array.isArray(items) ? items : []
  );
  const [needsScroll, setNeedsScroll] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
const { showAlert } = useGlobalAlert();
  const isReadOnlyForPetty =
    (requestType || "").toString().toLowerCase() === "pettycash" &&
    (requestStatus || "") === "PENDING_REQUESTER_DELIVERY_CONFIRMATION";

  useEffect(() => {
    const incoming = Array.isArray(items) ? items : [];
    const sameLength = editedItems.length === incoming.length;
    const sameIds =
      sameLength &&
      incoming.every((it, idx) => {
        const inId = it.itemId ?? it._id ?? it.id ?? `__idx_${idx}`;
        const exId =
          editedItems[idx] &&
          (editedItems[idx].itemId ??
            editedItems[idx]._id ??
            editedItems[idx].id ??
            `__idx_${idx}`);
        return String(inId) === String(exId);
      });
    if (!sameIds) {
      setEditedItems(incoming);
    } else {
      setEditedItems((prev) =>
        incoming.map((it, i) => ({ ...prev[i], ...it }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Handlers for inline actions (quantity-only edit)
  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditedItems(Array.isArray(items) ? items : []);
    setEditingIndex(null);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...editedItems];
    newItems[index] = {
      ...newItems[index],
      quantity: Number(value) || 0,
    };
    setEditedItems(newItems);
  };

  const handleSaveClick = async (index) => {
    const item = editedItems[index];
    if (!item) return;
    const quantity = Number(item.quantity) || 0;
    if (quantity < 1) {
      showAlert("Quantity must be at least 1");
      return;
    }

    if (typeof onEditItem !== "function") {
      console.error("onEditItem not provided to RequesterTable");
      return;
    }

    const payload = {
      itemId: item.itemId || item._id || item.id,
      quantity,
      requestId,
    };

    try {
      await onEditItem(payload);
      setEditedItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, quantity } : it))
      );
      setEditingIndex(null);
      showAlert("Item updated successfully");
    } catch (err) {
      console.error("Error saving item from RequesterTable:", err);
      showAlert(err?.response?.data?.message || "Failed to save item");
    }
  };

  const handleDeleteClick = (item) => {
    if (typeof onDeleteItem === "function") {
      onDeleteItem(item);
      return;
    }
    console.warn("onDeleteItem not provided to RequesterTable");
  };

  const handleSaveAll = async () => {
 const ok = await showPrompt(
    "Save all changes to the items?"
  );
  if (!ok) return;
    if (typeof onEditItem !== "function") {
      console.error("onEditItem not provided to RequesterTable");
      return;
    }

    const dirty = editedItems.filter((it) => it._dirty);
    if (!dirty || dirty.length === 0) {
      showAlert("No changes to save.");
      return;
    }

    try {
      await Promise.all(
        dirty.map(async (it) => {
          const itemId = it.itemId || it._id || it.id;
          const payload = {
            itemId,
            requestId,
            unitPrice: Number(it.unitPrice) || 0,
            currency: it.currency || "NGN",
            totalPrice: Number(it.total) || 0,
          };
          console.log("RequesterTable saving item:", itemId, payload);
          try {
            await onEditItem(payload);
          } catch (err) {
            console.error(
              "Error saving item from RequesterTable:",
              itemId,
              err
            );
            throw err;
          }
        })
      );

      setEditedItems((prev) => prev.map((it) => ({ ...it, _dirty: false })));
      showAlert("Saved successfully");
    } catch (err) {
      console.error("Error in RequesterTable.handleSaveAll:", err);
    }
  };

  // Check if table needs horizontal scrolling
  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("requester-table-container");
      if (container) {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);

    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No completed items</p>
      </div>
    );
  }
  const currencies = ["NGN", "USD", "GBP", "EUR", "JPY", "CNY", "CAD", "AUD"];
const isAnyItemInStock = React.useMemo(() => {
    return (items || []).some((it) => !!it.inStock);
  }, [items]);
  
  function isProcurementOfficerApproved(request) {
  return (
    Array.isArray(request.history) &&
    (
      request.history.some(
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
      )
    )
  );
}
  return (
    <div className="relative">
      {/* ✅ Scrollable table container */}
      <div className="overflow-x-auto" id="requester-table-container">
        <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                SN
              </th>
              <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[200px]">
                Description
              </th>
              <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                Item Type
              </th>
              <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Maker
              </th>
              <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                Maker's Part No
              </th>

              {requestType !== "pettyCash" && !isAnyItemInStock && (
                <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                  Vendor
                </th>
              )}
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>
                             {!isAnyItemInStock && (

              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Unit Price
              </th>
                             )}
                                           {!isAnyItemInStock && (

              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Total Price
              </th>
                                           )}

              {requestType !== "pettyCash" && !isQueried && !isAnyItemInStock  && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                  PRN
                </th>
              )}

              {requestType !== "pettyCash" && !isQueried &&!isAnyItemInStock  && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                  PON
                </th>
              )}
              {isQueried && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {editedItems.map((item, index) => (
              <tr
                key={item.itemId || index}
                className="hover:bg-emerald-50 transition-colors duration-150"
              >
                <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>

                <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                  {item.name || "N/A"}
                </td>

                <td
  className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
  style={{ minWidth: "100px" }}
>
 {isProcurementOfficerApproved(request)
  ? (item.makersType || item.itemType || "N/A")
  : "N/A"}
</td>

                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.maker || "N/A"}
                </td>

                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.makersPartNo || "N/A"}
                </td>

                {requestType !== "pettyCash" && !isAnyItemInStock && (
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {item.vendor || "N/A"}
                  </td>
                )}

                <td className="border border-slate-200 px-4 py-3 text-center">
                  {editingIndex === index && isQueried ? (
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleQuantityChange(index, e.target.value)
                      }
                      className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                  )}
                </td>

              {!isAnyItemInStock && (

                <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                  {requestType === "pettyCash" ? (
                    isReadOnlyForPetty ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm text-slate-700">
                          {item.currency || "NGN"}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {item.unitPrice === "" ||
                          item.unitPrice === null ||
                          typeof item.unitPrice === "undefined"
                            ? "N/A"
                            : parseFloat(item.unitPrice).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={item.currency || "NGN"}
                          onChange={(e) => {
                            if (isReadOnlyForPetty) return;
                            const cur = e.target.value || "NGN";
                            setEditedItems((prev) =>
                              prev.map((it, i) =>
                                i === index
                                  ? { ...it, currency: cur, _dirty: true }
                                  : it
                              )
                            );
                          }}
                          className="border px-2 py-1 rounded-md text-sm"
                          disabled={isReadOnlyForPetty}
                        >
                          {currencies.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={
                            item.unitPrice === "" ||
                            item.unitPrice === null ||
                            typeof item.unitPrice === "undefined"
                              ? ""
                              : item.unitPrice
                          }
                          onChange={(e) => {
                            if (isReadOnlyForPetty) return;
                            const raw = e.target.value;
                            const parsed = raw === "" ? "" : Number(raw);
                            setEditedItems((prev) =>
                              prev.map((it, i) => {
                                if (i !== index) return it;
                                const qty = Number(it.quantity || 0);
                                const unitVal = parsed === "" ? "" : parsed;
                                const totalVal =
                                  unitVal === ""
                                    ? 0
                                    : Math.round(Number(unitVal) * qty);
                                return {
                                  ...it,
                                  unitPrice: unitVal,
                                  total: totalVal,
                                  _dirty: true,
                                };
                              })
                            );
                          }}
                          disabled={isReadOnlyForPetty}
                          onBlur={(e) => {
                            if (isReadOnlyForPetty) return;
                            const raw = e.target.value;
                            const unit = Number(raw) || 0;
                            setEditedItems((prev) =>
                              prev.map((it, i) =>
                                i === index
                                  ? {
                                      ...it,
                                      unitPrice: unit,
                                      total: Math.round(
                                        unit * Number(it.quantity || 0)
                                      ),
                                      _dirty: true,
                                    }
                                  : it
                              )
                            );
                          }}
                          className="border px-2 py-1 rounded-md w-28 text-right"
                        />
                      </div>
                    )
                  ) : item.unitPrice ? (
                    <>
                      {item.currency || "NGN"}{" "}
                      {parseFloat(item.unitPrice).toFixed(2)}
                    </>
                  ) : (
                    "N/A"
                  )}
                </td>
              )}
               {!isAnyItemInStock && (

                <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  {requestType === "pettyCash" ? (
                    <>
                      {item.currency || "NGN"}{" "}
                      {Number(item.total || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </>
                  ) : item.total ? (
                    <>
                      {item.currency || "NGN"}{" "}
                      {Number(item.total).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </>
                  ) : (
                    "N/A"
                  )}
                </td>
               )}

                {requestType !== "pettyCash" && !isQueried && !isAnyItemInStock && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {item.purchaseRequisitionNumber || "N/A"}
                  </td>
                )}

                {requestType !== "pettyCash" && !isQueried && !isAnyItemInStock  && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {item.purchaseOrderNumber || "N/A"}
                  </td>
                )}
                {isQueried && (
                  <td className="border border-slate-200 px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {editingIndex === index ? (
                        <>
                          <button
                            onClick={() => handleSaveClick(index)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                            title="Save"
                          >
                            <FaSave className="text-lg" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                            title="Cancel"
                          >
                            <FaTimes className="text-lg" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                            title="Edit quantity"
                          >
                            <FaEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                            title="Delete"
                          >
                            <MdDelete className="text-lg" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Fixed scroll arrows - only show when needed */}
      {needsScroll && (
        <div className="flex justify-between mt-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById(
                "requester-table-container"
              );
              if (container) {
                container.scrollLeft -= 100;
              }
            }}
          >
            ◄
          </button>
          {requestType === "pettyCash" && !isReadOnlyForPetty && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAll}
                className="px-6 h-12 flex items-center justify-center rounded-md font-semibold bg-[#036173] text-white hover:bg-[#024f57]"
              >
                Save Changes
              </button>
            </div>
          )}
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById(
                "requester-table-container"
              );
              if (container) {
                container.scrollLeft += 100;
              }
            }}
          >
            ►
          </button>
        </div>
      )}
    </div>
  );
};

export default RequesterTable;