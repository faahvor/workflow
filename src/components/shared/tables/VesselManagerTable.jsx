// src/components/tables/VesselManagerTable.jsx

import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const VesselManagerTable = ({ 
  items = [], 
  onEditItem, 
  onDeleteItem,
  requestId,
  isReadOnly = false 
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);

  // Update editedItems when items prop changes
  React.useEffect(() => {
    setEditedItems(items);
  }, [items]);

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveClick = async (index) => {
    const item = editedItems[index];
    
    if (!item.quantity || item.quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    try {
      await onEditItem(item);
      setEditingIndex(null);
      alert("✅ Item updated successfully!");
    } catch (error) {
      console.error("❌ Error saving item:", error);
      alert("❌ Failed to update item");
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

  const handleDeleteClick = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    const reason = prompt("Please provide a reason for deleting this item:");
    if (!reason || reason.trim() === "") {
      alert("Deletion reason is required");
      return;
    }

    try {
      await onDeleteItem(requestId, item.itemId, reason);
      alert("✅ Item deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting item:", error);
      alert("❌ Failed to delete item");
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
    <div className="overflow-x-auto">
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
            <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
              Quantity
            </th>
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
              {/* Serial Number */}
              <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                {index + 1}
              </td>

              {/* Description */}
              <td className="border border-slate-200 px-4 py-3 text-sm text-slate-900">
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

              {/* Quantity - Editable */}
              <td className="border border-slate-200 px-4 py-3 text-center">
                {editingIndex === index ? (
                  <input
                    type="number"
                    min="1"
                    value={item.quantity || ""}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                ) : (
                  <span className="font-semibold text-slate-900">{item.quantity}</span>
                )}
              </td>

              {/* Actions */}
              {!isReadOnly && (
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
  );
};

export default VesselManagerTable;