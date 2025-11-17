// src/components/tables/DeliveryBaseTable.jsx

import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

const DeliveryBaseTable = ({ 
  items = [], 
  onEditItem,
  onDeliveryQuantityChange,
  requestId,
  isReadOnly = false 
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);

  React.useEffect(() => {
    setEditedItems(items);
  }, [items]);

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveClick = async (index) => {
    const item = editedItems[index];
    
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
    setEditedItems(items);
    setEditingIndex(null);
  };

  const handleDeliveryQuantityChange = (index, value) => {
    const newItems = [...editedItems];
    const parsedValue = parseInt(value) || 0;
    newItems[index].deliverybaseDeliveredQuantity = parsedValue;
    setEditedItems(newItems);
    
    if (onDeliveryQuantityChange) {
      onDeliveryQuantityChange(requestId, newItems[index].itemId, parsedValue);
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
          <tr className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
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
              Ordered Qty
            </th>
            <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
              Delivered Qty (Base)
            </th>
            <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
              Outstanding
            </th>
            {!isReadOnly && (
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {editedItems.map((item, index) => {
            const orderedQty = parseInt(item.quantity) || 0;
            const deliveredQty = parseInt(item.deliverybaseDeliveredQuantity) || 0;
            const outstanding = orderedQty - deliveredQty;

            return (
              <tr 
                key={item.itemId || index} 
                className="hover:bg-blue-50 transition-colors duration-150"
              >
                <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-900">
                  {item.name || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.itemType || item.makersType || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.maker || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.makersPartNo || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">
                  {orderedQty}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-center">
                  {editingIndex === index ? (
                    <input
                      type="number"
                      min="0"
                      max={orderedQty}
                      value={deliveredQty}
                      onChange={(e) => handleDeliveryQuantityChange(index, e.target.value)}
                      className="w-20 px-2 py-1 border-2 border-blue-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <span className="font-semibold text-blue-600">{deliveredQty}</span>
                  )}
                </td>
                <td className="border border-slate-200 px-4 py-3 text-center">
                  <span className={`font-semibold ${outstanding > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {outstanding}
                  </span>
                </td>
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
                        <button
                          onClick={() => handleEditClick(index)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="Edit Delivery Quantity"
                        >
                          <FaEdit className="text-lg" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveryBaseTable;