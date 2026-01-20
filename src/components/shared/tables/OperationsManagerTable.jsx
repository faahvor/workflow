import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useGlobalAlert } from "../GlobalAlert";

const OperationsManagerTable = ({
  items = [],
  onEditItem,
  onDeleteItem, // ✅ NEW PROP
  requestId, // ✅ NEW PROP
  isReadOnly = false,
  tag = "",
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);
  const tagLower = String(tag || "").toLowerCase();
  const showFeeColumns = tagLower === "shipping" || tagLower === "clearing";
  const feeFieldName = tagLower === "shipping" ? "shippingFee" : "clearingFee";
  const feeLabel = tagLower === "shipping" ? "Shipping Fee" : "Clearing Fee";
  const { showAlert } = useGlobalAlert();

  // ✅ NEW: Hide Actions column when tag is Clearing or Shipping
  const hideActions = tagLower === "clearing" || tagLower === "shipping";

  const getFeeValue = (item) => {
    if (!item) return 0;
    const v = item[feeFieldName];
    return typeof v === "number" ? v : Number(v || 0);
  };

  // ...existing code...

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveClick = async (index) => {
    const item = editedItems[index];

    if (!item.quantity || item.quantity < 1) {
      showAlert("Quantity must be at least 1");
      return;
    }

    // ✅ Build minimal payload for edit
    const payload = {
      itemId: item.itemId || item._id,
      quantity: item.quantity,
      requestId,
    };

    try {
      await onEditItem(payload);
      setEditingIndex(null);
      showAlert("✅ Item updated successfully!");
    } catch (error) {
      console.error("❌ Error saving item:", error);
      showAlert("❌ Failed to update item");
    }
  };

  const handleCancelEdit = () => {
    setEditedItems(items); // Reset to original
    setEditingIndex(null);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...editedItems];
    newItems[index].quantity = parseInt(value) || 1;
    setEditedItems(newItems);
  };

  // ✅ NEW: Handle delete button click
  const handleDeleteClick = (item) => {
    if (typeof onDeleteItem === "function") {
      onDeleteItem(item);
    } else {
      console.warn("onDeleteItem not provided");
    }
  };

  // ...existing code...

  return (
    <div className="relative">
      <div className="overflow-x-auto" id="operations-table-container">
        <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
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
              <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                Vendor
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>
              {showFeeColumns && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  Shipping Qty
                </th>
              )}
              {showFeeColumns && (
                <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                  {feeLabel}
                </th>
              )}
              {showFeeColumns && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  PRN
                </th>
              )}
              {/* ✅ NEW: Actions column (hidden when tag is Clearing/Shipping or isReadOnly) */}
              {!isReadOnly && !hideActions && (
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
                  {item.makersType || "N/A"}
                </td>

                {/* Maker */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.maker || "N/A"}
                </td>

                {/* Maker's Part No */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.makersPartNo || "N/A"}
                </td>

                {/* Vendor */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.vendor || "N/A"}
                </td>

                {/* Quantity - Editable */}
                <td className="border border-slate-200 px-4 py-3 text-center">
                  {editingIndex === index ? (
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

                {/* Shipping Qty */}
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {item.shippingQuantity ?? 0}
                    </span>
                  </td>
                )}

                {/* Fee */}
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                    {item.currency || "NGN"}{" "}
                    {Number(getFeeValue(item) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                )}

                {/* PRN */}
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {item.purchaseRequisitionNumber || "N/A"}
                  </td>
                )}

                {/* ✅ NEW: Actions Column */}
                {!isReadOnly && !hideActions && (
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

  {/* ✅ Fixed scroll arrows - only show when needed */}
      {needsScroll && (
        <div className="flex justify-between mt-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById(
                "operations-table-container"
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
                "operations-table-container"
              );
              if (container) {
                container.scrollLeft += 100;
              }
            }}
          >
            ►
          </button>
        </div>
      )}    </div>
  );
};

export default OperationsManagerTable;