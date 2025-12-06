import React, { useState, useEffect, useMemo } from "react";

const SnapShotTable = ({
  items = [],
  requestType = "",
  tag = "",
  vendors = [],
}) => {
  const [needsScroll, setNeedsScroll] = useState(false);

  const tagLower = String(tag || "").toLowerCase();
  const isPettyCash = (requestType || "").toString().toLowerCase() === "pettycash";

  const showFeeColumns = tagLower === "shipping" || tagLower === "clearing";
  const feeFieldName = tagLower === "shipping" ? "shippingFee" : "clearingFee";
  const feeLabel = tagLower === "shipping" ? "Shipping Fee" : "Clearing Fee";

  // Check if any item is in stock
  const isAnyItemInStock = useMemo(() => {
    return (items || []).some((it) => !!it.inStock);
  }, [items]);

  // Vendor lookup map
  const vendorsById = useMemo(() => {
    const map = new Map();
    (vendors || []).forEach((v) => {
      const id = v.vendorId || v._id || v.id;
      if (id) map.set(String(id), v);
    });
    return map;
  }, [vendors]);

  const resolveVendorName = (vendorField) => {
    if (!vendorField) return "N/A";
    if (typeof vendorField === "object") {
      return vendorField.name || vendorField.vendorName || "N/A";
    }
    const key = String(vendorField);
    const found = vendorsById.get(key);
    if (found) return found.name || found.vendorName || key;
    return vendorField;
  };

  const getFeeValue = (item) => {
    if (!item) return 0;
    const v = item[feeFieldName];
    return typeof v === "number" ? v : Number(v || 0);
  };

  // Check if table needs horizontal scrolling
  useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("snapshot-table-container");
      if (!container) {
        setNeedsScroll(false);
        return;
      }
      const scrollW = container.scrollWidth;
      const clientW = container.clientWidth;
      setNeedsScroll(scrollW > clientW + 1);
    };

    const runCheck = () => {
      requestAnimationFrame(checkScroll);
      setTimeout(checkScroll, 50);
    };

    runCheck();
    window.addEventListener("resize", runCheck);

    return () => window.removeEventListener("resize", runCheck);
  }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No snapshot items available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scrollable table container */}
      <div className="overflow-x-auto" id="snapshot-table-container">
        <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
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

              {!isAnyItemInStock && (
                <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                  Vendor
                </th>
              )}

              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>

              {showFeeColumns && (
                <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                  {feeLabel}
                </th>
              )}

              {!isAnyItemInStock && (
                <>
                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Unit Price
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Total Price
                  </th>
                </>
              )}

              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Discount (%)
              </th>

              {!isPettyCash && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  VAT Amount
                </th>
              )}

              {(requestType !== "pettyCash" || !isAnyItemInStock) && (
                <>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                    PRN
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                    PON
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.itemId || item._id || index}
                className="hover:bg-amber-50 transition-colors duration-150"
              >
                {/* Serial Number */}
                <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>

                {/* Description */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-900">
                  {item.name || item.description || "N/A"}
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
                  {item.makersPartNo || item.makerPartNumber || "N/A"}
                </td>

                {/* Vendor Column */}
                {!isAnyItemInStock && (
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {resolveVendorName(item.vendor)}
                  </td>
                )}

                {/* Quantity */}
                <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-900">
                  {item.quantity || 0}
                </td>

                {/* Shipping/Clearing Fee */}
                {showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                    {item.currency || "NGN"}{" "}
                    {Number(getFeeValue(item) || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                )}

                {/* Unit Price */}
                {!isAnyItemInStock && (
                  <>
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm text-slate-700">
                      {item.unitPrice ? (
                        <>
                          {item.currency || "NGN"}{" "}
                          {parseFloat(item.unitPrice).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    {/* Total Price */}
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {item.currency || "NGN"}{" "}
                      {Number(item.totalPrice || item.total || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>
                  </>
                )}

                {/* Discount */}
                <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                  {item.discount !== "" &&
                  item.discount !== null &&
                  item.discount !== undefined
                    ? `${item.discount}%`
                    : "0%"}
                </td>

                {/* VAT Amount - Hide for pettyCash */}
                {!isPettyCash && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {item.vatted ? (
                      <>
                        {item.currency || "NGN"}{" "}
                        {Number(item.vatAmount || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </td>
                )}

                {/* PRN & PON */}
                {(requestType !== "pettyCash" || !isAnyItemInStock) && (
                  <>
                    <td className="border border-slate-200 px-4 text-center py-3 text-sm text-slate-700">
                      {item.purchaseRequisitionNumber || item.prn || "N/A"}
                    </td>
                    <td className="border border-slate-200 px-4 text-center py-3 text-sm text-slate-700">
                      {item.purchaseOrderNumber || item.pon || "N/A"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Scroll arrows - only show when needed */}
      {needsScroll && (
        <div className="flex justify-between mt-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById("snapshot-table-container");
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
              const container = document.getElementById("snapshot-table-container");
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

export default SnapShotTable;