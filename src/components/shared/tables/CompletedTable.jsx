// src/components/tables/CompletedTable.jsx

import React, { useState } from "react";

const CompletedTable = ({ 
  items = [], 
  userRole = ""
}) => {
  const [needsScroll, setNeedsScroll] = useState(false);

  // Check if table needs horizontal scrolling
  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById('completed-table-container');
      if (container) {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No completed items</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ✅ Scrollable table container */}
      <div className="overflow-x-auto" id="completed-table-container">
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
              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Unit Price
              </th>
              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Total Price
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                PRN
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                PON
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
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

                {/* Vendor */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.vendor || "N/A"}
                </td>

                {/* Quantity */}
                <td className="border border-slate-200 px-4 py-3 text-center">
                  <span className="font-semibold text-slate-900">{item.quantity}</span>
                </td>

                {/* Unit Price */}
                <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                  {item.unitPrice ? (
                    <>
                      {item.currency || "NGN"}{" "}
                      {parseFloat(item.unitPrice).toFixed(2)}
                    </>
                  ) : (
                    "N/A"
                  )}
                </td>

                {/* Total Price */}
                <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  {item.total ? (
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

                {/* PRN */}
                <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                  {item.purchaseReqNumber || "N/A"}
                </td>

                {/* PON */}
                <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                  {item.purchaseOrderNumber || "N/A"}
                </td>
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
              const container = document.getElementById('completed-table-container');
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
              const container = document.getElementById('completed-table-container');
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

export default CompletedTable;