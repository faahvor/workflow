import React, { useState } from "react";

const MovedTable = ({ items = [], requestType = "" }) => {
  const [needsScroll, setNeedsScroll] = useState(false);
  const isPettyCash = requestType === "pettyCash";

  // Check if table needs horizontal scrolling
  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("moved-table-container");
      if (container) {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);

    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto" id="moved-table-container">
        <table className="w-full border-collapse border-2 border-slate-300 rounded-lg overflow-hidden">
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
               Destination Request
              </th>
              {!isPettyCash && (
                <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                  Vendor
                </th>
              )}
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>
              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Unit Price
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                Payment Status
              </th>
              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Paid
              </th>
              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Balance
              </th>
              {!isPettyCash && (
                <>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    PRN
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    PON
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const paymentStatus = item.paymentStatus || "notpaid";
              const statusLabel =
                paymentStatus === "paid"
                  ? "Paid"
                  : paymentStatus === "partpayment"
                  ? "Partial"
                  : "Not Paid";
              const statusClass =
                paymentStatus === "paid"
                  ? "bg-green-100 text-green-800"
                  : paymentStatus === "partpayment"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800";

              return (
                <tr
                  key={item.itemId || item._id || index}
                  className="bg-slate-100 text-slate-500"
                >
                  <td className="border border-slate-300 px-4 py-3 text-center text-sm font-medium">
                    {index + 1}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-sm">
                    {item.name || item.description || "N/A"}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-sm">
                    {item.itemType || item.makersType || "N/A"}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-sm">
                    {item.maker || "N/A"}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-sm">
                    {item.makersPartNo || "N/A"}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-sm">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold font-mono">
                      {item.movedToRequestId}
                    </span>{" "}
                  </td>
                  {!isPettyCash && (
                    <td className="border border-slate-300 px-4 py-3 text-sm">
                      {item.vendor || item.vendorName || "N/A"}
                    </td>
                  )}
                  <td className="border border-slate-300 px-4 py-3 text-center text-sm font-medium">
                    {item.quantity || 0}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-right text-sm">
                    {item.unitPrice ? (
                      <>
                        {item.currency || "NGN"}{" "}
                        {Number(item.unitPrice).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-green-700">
                    {item.currency || "NGN"}{" "}
                    {Number(item.paid || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border border-slate-300 px-4 py-3 text-right text-sm font-semibold text-red-700">
                    {item.currency || "NGN"}{" "}
                    {Number(item.balance || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  {!isPettyCash && (
                    <>
                      <td className="border border-slate-300 px-4 py-3 text-center text-sm">
                        {item.purchaseRequisitionNumber ||
                          item.purchaseReqNumber ||
                          item.prn ||
                          "N/A"}
                      </td>
                      <td className="border border-slate-300 px-4 py-3 text-center text-sm">
                        {item.purchaseOrderNumber || item.pon || "N/A"}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {needsScroll && (
        <div className="flex justify-between mt-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById(
                "moved-table-container"
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
                "moved-table-container"
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

export default MovedTable;
