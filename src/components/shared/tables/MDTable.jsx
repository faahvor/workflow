// src/components/tables/MDTable.jsx

import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

const MDTable = ({
  items = [],
  onEditItem,
  isReadOnly = false,
  vendors = [],
  requestType = "",
  tag = "",
  clearingFee,
  request,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);
  const hidePrices = ["shipping", "clearing"].includes(
    String(tag || "").toLowerCase()
  );

  const tagLower = String(tag || "").toLowerCase();
  const showFeeColumns = tagLower === "shipping" || tagLower === "clearing";
  const feeFieldName = tagLower === "shipping" ? "shippingFee" : "clearingFee";
  const feeLabel = tagLower === "shipping" ? "Shipping Fee" : "Clearing Fee";
  const showShippingFee = request?.logisticsType === "international";
  const getFeeValue = (item) => {
    if (!item) return 0;
    const v = item[feeFieldName];
    // If clearingFee is not on item, fallback to request.clearingFee
    if (feeFieldName === "clearingFee" && (v === undefined || v === null)) {
      return typeof clearingFee === "number"
        ? clearingFee
        : Number(clearingFee || 0);
    }
    return typeof v === "number" ? v : Number(v || 0);
  };

  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("fleet-table-container");
      if (!container) {
        console.log("fleet-table: container not found");
        setNeedsScroll(false);
        return;
      }
      const scrollW = container.scrollWidth;
      const clientW = container.clientWidth;
      console.log("fleet-table: scrollWidth", scrollW, "clientWidth", clientW);
      // small tolerance to avoid off-by-one layout reports
      setNeedsScroll(scrollW > clientW + 1);
    };

    // run after paint/layout
    const runCheck = () => {
      requestAnimationFrame(checkScroll);
      // also schedule a small timeout in case fonts/images changed layout
      setTimeout(checkScroll, 50);
    };

    runCheck();
    window.addEventListener("resize", runCheck);

    return () => window.removeEventListener("resize", runCheck);
  }, [editedItems]);

  const vendorsById = React.useMemo(() => {
    const map = new Map();
    (vendors || []).forEach((v) => {
      const id = v.vendorId || v._id || v.id;
      if (id) map.set(String(id), v);
    });
    return map;
  }, [vendors]);

  const resolveVendorName = (vendorField) => {
    if (!vendorField) return "N/A";
    const key = String(vendorField);
    const found = vendorsById.get(key);
    if (found) return found.name || found.vendorName || key;
    // fallback: if vendorField already looks like a name, return it
    return vendorField;
  };

  // Check if table needs horizontal scrolling
  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("fleet-table-container");
      if (container) {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);

    return () => window.removeEventListener("resize", checkScroll);
  }, [editedItems]);

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
    const discountFactor =
      discount >= 1 && discount <= 100 ? (100 - discount) / 100 : 1;
    return (baseTotal * discountFactor).toFixed(2);
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No items in this request</p>
      </div>
    );
  }
  const calculateVatAmount = (item) => {
    if (!item.vatted || !item.totalPrice) return 0;
    // Assuming VAT is included in totalPrice, extract it
    // If totalPrice includes VAT, VAT = totalPrice - (totalPrice / (1 + vatRate))
    // Using a standard 7.5% VAT rate
    const vatRate = 0.075;
    return (item.totalPrice / (1 + vatRate)) * vatRate;
  };

  const showSrcReqId = React.useMemo(
  () => (items || []).some((it) => it.movedFromRequestId),
  [items]
);

  return (
    <div className="relative">
      {/* ✅ Scrollable table container */}
      <div className="overflow-x-auto" id="fleet-table-container">
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
              {showSrcReqId && (
  <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[120px]">
    Src Req ID
  </th>
)}
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
              {showShippingFee && (
                <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  Shipping Fee
                </th>
              )}

              {!hidePrices && (
                <>
                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Unit Price
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                    Discount (%)
                  </th>

                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    VAT Amount
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Total Price
                  </th>
                </>
              )}
              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                PRN
              </th>
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
{showSrcReqId && (
  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700 font-mono">
    {item.movedFromRequestId || ""}
  </td>
)}
                {/* ✅ Vendor Column */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {resolveVendorName(item.vendor)}
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
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {item.shippingQuantity ?? 0}
                    </span>
                  </td>
                )}
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                    {item.currency || "NGN"}{" "}
                    {Number(getFeeValue(item) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                )}
                {showShippingFee && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {request?.shippingFee ? (
                      <>
                        {item.currency || "NGN"}{" "}
                        {parseFloat(request.shippingFee).toFixed(2)}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </td>
                )}
                {!hidePrices && (
                  <>
                    {/* Unit Price - Read Only */}
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

                    {/* Add Discount cell here */}
                    <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                      {item.discount ? `${item.discount}%` : "0%"}
                    </td>

                    <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
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
                    {/* Total Price - Calculated */}
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm  text-slate-700">
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
                  </>
                )}
                <td className="border border-slate-200 px-4 py-3 text-center text-sm  text-slate-700">
                  {item.purchaseRequisitionNumber || "N/A"}
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
              const container = document.getElementById(
                "fleet-table-container"
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
                "fleet-table-container"
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

export default MDTable;
