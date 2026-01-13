import React, { useState, useEffect, useMemo } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const ProjectManagerTable = ({
  items = [],
  onEditItem,
  onDeleteItem,
  requestId,
  isReadOnly = false,
  tag = "",
  clearingFee,
  request,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);

  const tagLower = String(tag || "").toLowerCase();
  const showFeeColumns = tagLower === "shipping" || tagLower === "clearing";
  const feeFieldName = tagLower === "shipping" ? "shippingFee" : "clearingFee";
  const feeLabel = tagLower === "shipping" ? "Shipping Fee" : "Clearing Fee";

  const getFeeValue = (item) => {
    if (!item) return 0;
    const v = item[feeFieldName];
    if (feeFieldName === "clearingFee" && (v === undefined || v === null)) {
      return typeof clearingFee === "number"
        ? clearingFee
        : Number(clearingFee || 0);
    }
    return typeof v === "number" ? v : Number(v || 0);
  };

  useEffect(() => {
    setEditedItems(items);
  }, [items]);

  const handleEditClick = (index) => setEditingIndex(index);

  const handleSaveClick = async (index) => {
    const item = editedItems[index];
    const quantity = Number(item.quantity) || 0;
    if (quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }
    const payload = {
      itemId: item.itemId || item._id,
      quantity,
      requestId,
    };
    try {
      await onEditItem(payload);
      setEditedItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, quantity } : it))
      );
      setEditingIndex(null);
      alert("✅ Item updated successfully!");
    } catch (error) {
      alert("❌ Failed to update item");
    }
  };

  const handleCancelEdit = () => {
    setEditedItems(items);
    setEditingIndex(null);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...editedItems];
    newItems[index].quantity = parseInt(value) || 1;
    setEditedItems(newItems);
  };

  const handleDeleteClick = (item) => {
    if (typeof onDeleteItem === "function") {
      onDeleteItem(item);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No items in this request</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto" id="project-table-container">
        <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-visible">
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
              {!isReadOnly && (
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
                <td className="border border-slate-200 px-4 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>
                <td className="border border-slate-200 px-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                  {item.name || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.makersType || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700">
                  {item.maker || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700">
                  {item.makersPartNo || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-[5px] text-center">
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
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-[5px] text-center text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {item.shippingQuantity ?? 0}
                    </span>
                  </td>
                )}
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-[5px] text-right text-sm text-slate-700">
                    {item.currency || "NGN"}{" "}
                    {Number(getFeeValue(item) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                )}
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700">
                    {item.purchaseRequisitionNumber || "N/A"}
                  </td>
                )}
                {!isReadOnly && (
                  <td className="border border-slate-200 px-4 py-[5px]">
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
    </div>
  );
};

export default ProjectManagerTable;
