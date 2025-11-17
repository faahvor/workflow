// src/components/tables/FleetManagerTable.jsx

import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

const FleetManagerTable = ({ 
  items = [], 
  onEditItem,
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

  // Calculate total for each item
  const calculateTotal = (item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discount = parseInt(item.discount) || 0;
    
    const baseTotal = quantity * unitPrice;
    const discountFactor = discount >= 1 && discount <= 100 ? (100 - discount) / 100 : 1;
    return (baseTotal * discountFactor).toFixed(2);
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
          <tr className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
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
            <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
              Unit Price
            </th>
            <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
              Total Price
            </th>
         
          </tr>
        </thead>
        <tbody>
          {editedItems.map((item, index) => (
            <tr 
              key={item.itemId || index} 
              className="hover:bg-purple-50 transition-colors duration-150"
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
                    className="w-20 px-2 py-1 border-2 border-purple-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                ) : (
                  <span className="font-semibold text-slate-900">{item.quantity}</span>
                )}
              </td>

              {/* Unit Price - Read Only */}
              <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                {item.unitPrice ? (
                  <>
                    {parseFloat(item.unitPrice).toFixed(2)} {item.currency || ""}
                  </>
                ) : (
                  "N/A"
                )}
              </td>

              {/* Total Price - Calculated */}
              <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                {item.total || item.unitPrice ? (
                  <>
                    {calculateTotal(item)} {item.currency || ""}
                  </>
                ) : (
                  "N/A"
                )}
              </td>

              
            </tr>
          ))}
        </tbody>

        {/* Grand Total Row */}
        <tfoot>
          <tr className="bg-gradient-to-r from-slate-100 to-slate-200 font-bold">
            <td colSpan="7" className="border border-slate-300 px-4 py-3 text-right text-sm text-slate-900">
              GRAND TOTAL:
            </td>
            <td className="border border-slate-300 px-4 py-3 text-right text-sm text-slate-900">
              {editedItems.reduce((sum, item) => sum + parseFloat(calculateTotal(item) || 0), 0).toFixed(2)}
              {editedItems[0]?.currency ? ` ${editedItems[0].currency}` : ""}
            </td>
            {!isReadOnly && <td className="border border-slate-300"></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default FleetManagerTable;