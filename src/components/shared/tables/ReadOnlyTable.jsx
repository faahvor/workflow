import React from "react";

const ReadOnlyTable = ({
  items = [],
  tag = "",
}) => {
  // Determine if we should show "Shipping Quantity" or "Quantity"
  const isShippingOrClearing =
    String(tag).toLowerCase().includes("shipping") ||
    String(tag).toLowerCase().includes("clearing");

  return (
    <div className="relative">
      <div className="overflow-x-auto" id="readonly-table-container">
        <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                SN
              </th>
              <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[200px]">
                Name
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                {isShippingOrClearing ? "Shipping Quantity" : "Quantity"}
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Quantity Delivered
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Outstanding Quantity
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-slate-500 py-8">
                  No items in this request
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                // Use shippingQuantity if shipping/clearing, else quantity
                const quantity = isShippingOrClearing
                  ? item.shippingQuantity
                  : item.quantity;
                const delivered = item.deliveredQuantity ?? 0;
                const outstanding =
                  (Number(quantity) || 0) - (Number(delivered) || 0);

                return (
                  <tr
                    key={item.itemId || item._id || idx}
                    className="hover:bg-emerald-50 transition-colors duration-150"
                  >
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                      {item.name || "N/A"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      {quantity ?? "N/A"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      {delivered ?? "N/A"}
                    </td>
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-900">
                      {outstanding ?? "N/A"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {/* No scroll arrows */}
    </div>
  );
};

export default ReadOnlyTable;