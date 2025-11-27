// src/components/tables/DeliveryTable.jsx

import React, { useState } from "react";

const DeliveryTable = ({ 
  items = [], 
  onEditItem,
  isReadOnly = false,
  userRole = "deliverybase", // Can be deliverybase, deliveryjetty, or deliveryvessel
  requestId,
  onDeliveryQuantityChange,
  onDeliveryStatusChange,
}) => {
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);

   React.useEffect(() => {
    const incoming = Array.isArray(items) ? items : [];
    const existing = Array.isArray(editedItems) ? editedItems : [];

    const sameLength = existing.length === incoming.length;
    const sameIds =
      sameLength &&
      incoming.every((it, idx) => {
        const inId = it.itemId ?? it._id ?? it.id ?? `__idx_${idx}`;
        const exId = existing[idx] && (existing[idx].itemId ?? existing[idx]._id ?? existing[idx].id ?? `__idx_${idx}`);
        return String(inId) === String(exId);
      });

    // Only overwrite local editedItems when the incoming list actually changed
    if (!sameIds) {
      setEditedItems(incoming);
    }
  }, [items]);

  // Check if table needs horizontal scrolling
  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById('delivery-table-container');
      if (container) {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [editedItems]);

  // Update editedItems when items prop changes
  React.useEffect(() => {
    setEditedItems(items);
  }, [items]);

  // Determine the delivered field based on user role
  const deliveredField = "deliveredQuantity";


  // Handle delivery quantity change
  const handleDeliveryQuantityChange = (itemId, value) => {
    const numeric = Number(value) || 0;
    const newItems = editedItems.map(item => 
      item.itemId === itemId 
        ? { ...item, [deliveredField]: numeric }
        : item
    );
    
    setEditedItems(newItems);
    
    // Call parent handler if provided
    if (onDeliveryQuantityChange) {
      // pass numeric value; parent expects (requestId, itemId, quantity, outstanding)
      const updatedItem = newItems.find(it => it.itemId === itemId) || {};
      const qtyVal = Number(updatedItem.quantity || 0);
      const outstandingVal = Math.max(0, qtyVal - numeric);
      onDeliveryQuantityChange(requestId, itemId, numeric, outstandingVal);
    }

    // notify parent about overall delivery completeness
    if (onDeliveryStatusChange) {
      onDeliveryStatusChange(checkAllFullyDelivered());
    }
  };

  // Calculate delivery status
  const getDeliveryStatus = (item) => {
    const delivered = item[deliveredField] || 0;
    const total = item.quantity || 0;
    const outstanding = total - delivered;

    return {
      delivered,
      outstanding,
      isPartial: delivered > 0 && delivered < total,
      isFull: delivered === total,
      isNone: delivered === 0,
    };
  };

    const checkAllFullyDelivered = () => {
    return editedItems.every(item => {
      const status = getDeliveryStatus(item);
      return status.isFull;
    });
  };

  // Notify parent when local editedItems change (keeps footer in sync instantly)
  React.useEffect(() => {
    if (typeof onDeliveryStatusChange === "function") {
      onDeliveryStatusChange(checkAllFullyDelivered());
    }
  }, [editedItems]);

  // Get column headers based on role
  const getDeliveredColumnHeader = () => {
    switch(userRole) {
      case "deliverybase": return "DBDQ";
      case "deliveryjetty": return "DJDQ";
      case "deliveryvessel": return "DVDQ";
      default: return "Delivered Qty";
    }
  };

  const getOutstandingColumnHeader = () => {
    switch(userRole) {
      case "deliverybase": return "DBOQ";
      case "deliveryjetty": return "DJOQ";
      case "deliveryvessel": return "DVOQ";
      default: return "Outstanding Qty";
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
      {/* ✅ Scrollable table container */}
      <div className="overflow-x-auto" id="delivery-table-container">
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
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                {getDeliveredColumnHeader()}
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                {getOutstandingColumnHeader()}
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Part Delivery
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Full Delivery
              </th>
            </tr>
          </thead>
          <tbody>
            {editedItems.map((item, index) => {
              const status = getDeliveryStatus(item);
              
              return (
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

                  {/* Delivered Quantity - Editable */}
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    {!isReadOnly ? (
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={status.delivered || ""}
                        onChange={(e) => handleDeliveryQuantityChange(item.itemId, e.target.value)}
                        className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">{status.delivered}</span>
                    )}
                  </td>

                  {/* Outstanding Quantity */}
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    {status.outstanding}
                  </td>

                  {/* Part Delivery Indicator */}
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex justify-center">
                      {status.isPartial ? (
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </td>

                  {/* Full Delivery Indicator */}
                  <td className="border border-slate-200 px-4 py-3 text-center">
                    <div className="flex justify-center">
                      {status.isFull ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ✅ Fixed scroll arrows - only show when needed */}
      {needsScroll && (
        <div className="flex justify-between mt-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById('delivery-table-container');
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
              const container = document.getElementById('delivery-table-container');
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

export default DeliveryTable;