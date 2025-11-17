// src/components/tables/ItemSelectionTable.jsx

import React from "react";

const ItemSelectionTable = ({ items, onQuantityChange, onRemoveItem }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[50px]">
              SN
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">
              Description
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
              Item Type
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
              Maker
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">
              Maker's Part No
            </th>
            <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">
              Quantity
            </th>
            <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item._id || index} className="hover:bg-slate-50 transition-colors">
              <td className="border border-slate-200 p-3 text-center text-sm font-medium text-slate-900">
                {index + 1}
              </td>
              <td className="border border-slate-200 p-3 text-sm text-slate-900">
                {item.name || "N/A"}
              </td>
              <td className="border border-slate-200 p-3 text-sm text-slate-700">
                {item.itemType || item.makersType || "N/A"}
              </td>
              <td className="border border-slate-200 p-3 text-sm text-slate-700">
                {item.maker || "N/A"}
              </td>
              <td className="border border-slate-200 p-3 text-sm text-slate-700">
                {item.makersPartNo || "N/A"}
              </td>
              <td className="border border-slate-200 p-3 text-center">
                <input
                  type="number"
                  min="1"
                  value={item.quantity || 1}
                  onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 1)}
                  className="w-20 px-2 py-1 border border-slate-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </td>
              <td className="border border-slate-200 p-3 text-center">
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors duration-200"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ItemSelectionTable;