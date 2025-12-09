// src/components/tables/VesselManagerTable.jsx

import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const VesselManagerTable = ({
  items = [],
  onEditItem,
  onDeleteItem,
  requestId,
  isReadOnly = false,
  currentState = "",
  requestType = "",
  vendors = [],
  tag = "", // ✅ ADD THIS PROP
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);
    const isSecondApproval = currentState === "PENDING_VESSEL_MANAGER_APPROVAL_2";
  const isPettyCash = requestType === "pettyCash";
   const tagLower = String(tag || "").toLowerCase();
  const showFeeColumns = tagLower === "shipping" || tagLower === "clearing";
  const feeFieldName = tagLower === "shipping" ? "shippingFee" : "clearingFee";
  const feeLabel = tagLower === "shipping" ? "Shipping Fee" : "Clearing Fee";

  const getFeeValue = (item) => {
    if (!item) return 0;
    const v = item[feeFieldName];
    return typeof v === "number" ? v : Number(v || 0);
  };

  // ✅ Hide actions when showing fee columns (first approval with shipping/clearing tag)
  const hideActionsForFee = showFeeColumns && !isSecondApproval;


  // ✅ Check if we're in second approval stage


  const vendorsById = React.useMemo(() => {
    const map = new Map();
    (vendors || []).forEach((v) => {
      const id = v.vendorId || v._id || v.id;
      if (id) map.set(String(id), v);
    });
    return map;
  }, [vendors]);

  // ...existing code...
  const resolveVendorName = (vendorField) => {
    if (!vendorField) return "N/A";

    // if an object, prefer name then try vendorId/id fallback
    if (typeof vendorField === "object") {
      const name =
        vendorField.name ||
        vendorField.vendorName ||
        vendorField.label ||
        vendorField.vendor ||
        null;
      if (name) return String(name);
      const id = vendorField.vendorId ?? vendorField._id ?? vendorField.id;
      if (id && vendorsById.has(String(id))) {
        const found = vendorsById.get(String(id));
        return found?.name || String(id);
      }
      return "N/A";
    }

    // string or id
    const key = String(vendorField);
    if (vendorsById.has(key)) {
      const found = vendorsById.get(key);
      return found?.name || key;
    }
    return key;
  };
  // ...existing code...
  // Update editedItems when items prop changes
  React.useEffect(() => {
    setEditedItems(items);
  }, [items]);

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  // ...existing code...
  const handleSaveClick = async (index) => {
    const item = editedItems[index];

    // ensure a valid quantity
    const quantity = Number(item.quantity) || 0;
    if (quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    // Build minimal, sanitized payload (only send fields you intend to change)
    const payload = {
      itemId: item.itemId || item._id,
      quantity,
      requestId, // include requestId explicitly
    };

    // optionally include vendorId if present
    if (
      item.vendorId !== undefined &&
      item.vendorId !== null &&
      item.vendorId !== ""
    ) {
      payload.vendorId = item.vendorId;
    }

    console.log("VesselManagerTable -> sending PATCH payload:", payload);

    try {
      const result = await onEditItem(payload);

      console.log("VesselManagerTable -> edit result:", result);

      // Update local copy immediately so UI reflects saved quantity
      setEditedItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, quantity } : it))
      );

      setEditingIndex(null);
      alert("✅ Item updated successfully!");
    } catch (error) {
      console.error("❌ Error saving item:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        payload,
      });

      const serverErrors = error.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length) {
        const msgs = serverErrors
          .map((e) => {
            const field = e.path || e.param || e.location || "field";
            const msg = e.msg || e.message || JSON.stringify(e);
            return `${field}: ${msg}`;
          })
          .join("; ");
        alert(`Server validation errors: ${msgs}`);
      } else {
        alert("❌ Failed to update item");
      }
    }
  };
  // ...existing code...

  const handleCancelEdit = () => {
    setEditedItems(items); // Reset to original
    setEditingIndex(null);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...editedItems];
    newItems[index].quantity = parseInt(value) || 1;
    setEditedItems(newItems);
  };

  const handleDeleteClick = (item) => {
    // delegate deletion flow to parent (parent will open modal and call API)
    if (typeof onDeleteItem === "function") {
      onDeleteItem(item);
    } else {
      console.warn("onDeleteItem not provided");
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No items in this request</p>
      </div>
    );
  }

  // ✅ Calculate VAT amount
  const calculateVatAmount = (item) => {
    if (!item.vatted || !item.total) return 0;
    // Assuming VAT is included in total, extract it
    // If total includes VAT, VAT = total - (total / (1 + vatRate))
    // For now, using a standard 7.5% VAT rate
    const vatRate = 0.075;
    return (item.total / (1 + vatRate)) * vatRate;
  };
  // Check if table needs horizontal scrolling
  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("vessel-table-container");
      if (container) {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      }
    };

    // Check on mount and when items change
    checkScroll();

    // Also check on window resize
    window.addEventListener("resize", checkScroll);

    return () => window.removeEventListener("resize", checkScroll);
  }, [editedItems, isSecondApproval]);

  return (
    <div className="relative">
      {/* ✅ Scrollable table container */}
      <div className="overflow-x-auto" id="vessel-table-container">
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
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>
                {showFeeColumns && !isSecondApproval && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  Shipping Qty
                </th>
              )}

              {/* ✅ Shipping/Clearing Fee column - only in first approval when tag is shipping/clearing */}
              {showFeeColumns && !isSecondApproval && (
                <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                  {feeLabel}
                </th>
              )}

              {/* ✅ Show pricing columns in second approval */}
              {(isSecondApproval || isPettyCash) && (
                <>
                  {!isPettyCash && (
                    <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                      Vendor
                    </th>
                  )}
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Unit Price
                  </th>

                  {!isPettyCash && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                      Discount (%)
                    </th>
                  )}
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Total Price
                  </th>

                  {!isPettyCash && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      VAT Amount
                    </th>
                  )}
                </>
              )}
              {(isSecondApproval || (showFeeColumns && !isSecondApproval)) && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  PRN
                </th>
              )}

              {/* ✅ Hide Actions column in second approval */}
              {!isReadOnly && !isSecondApproval && !isPettyCash && !hideActionsForFee && (
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
                {/* Serial Number */}
                <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>

                {/* Description */}
                <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                  {item.name || "N/A"}
                </td>

                {/* Item Type */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.itemType || item.makersType || "N/A"}
                </td>

                {/* Maker */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.maker || "N/A"}
                </td>

                {/* Maker's Part No */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.makersPartNo || "N/A"}
                </td>

                {/* Quantity - Editable only in first approval */}
                <td className="border border-slate-200 px-4 py-3 text-center">
                  {editingIndex === index && !isSecondApproval ? (
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

                  {/* ✅ Shipping Qty - only in first approval when tag is shipping/clearing */}
                {showFeeColumns && !isSecondApproval && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {item.shippingQuantity ?? 0}
                    </span>
                  </td>
                )}

                {/* ✅ Shipping/Clearing Fee - only in first approval when tag is shipping/clearing */}
                {showFeeColumns && !isSecondApproval && (
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                    {item.currency || "NGN"}{" "}
                    {Number(getFeeValue(item) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                )}

                {/* ✅ Pricing Columns (only in second approval) */}
                {(isSecondApproval || isPettyCash) && (
                  <>
                    {/* ✅ Vendor Column */}

                    {!isPettyCash && (
                      <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                        {resolveVendorName(item.vendor)}
                      </td>
                    )}
                    {/* Unit Price */}
                    <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                      {item.currency || "NGN"}{" "}
                      {Number(item.unitPrice || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Discount */}
                    {!isPettyCash && (
                      <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                        {item.discount ? `${item.discount}%` : "0%"}
                      </td>
                    )}

                    {/* Total Price */}
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900">
                      <span className="font-semibold">
                        {item.currency || "NGN"}{" "}
                        {Number(
                          item.totalPrice || item.total || 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* VAT Amount */}
                    {!isPettyCash && (
                      <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                        {item.vatted ? (
                          <span>
                            {item.currency || "NGN"}{" "}
                            {Number(calculateVatAmount(item)).toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                    )}
                  </>
                )}
              {(isSecondApproval || (showFeeColumns && !isSecondApproval)) && (
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {item.purchaseRequisitionNumber ||
                      item.purchaseRequisitionNumber ||
                      "N/A"}
                  </td>
                )}

                {/* ✅ Actions (hidden in second approval) */}
              {!isReadOnly && !isSecondApproval && !isPettyCash && !hideActionsForFee && (
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
                            title="Edit"
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

      {/* ✅ Fixed scroll arrows - stays in place while table scrolls */}
      {needsScroll && (
        <div className="flex justify-between mt-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById(
                "vessel-table-container"
              );
              if (container) {
                container.scrollLeft -= 100;
              }
            }}
          >
            ◄
          </button>
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById(
                "vessel-table-container"
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

export default VesselManagerTable;
