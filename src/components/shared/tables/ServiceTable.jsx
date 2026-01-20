import React, { useState, useEffect, useRef } from "react";
import { useGlobalAlert } from "../GlobalAlert";
import { useGlobalPrompt } from "../GlobalPrompt";

const paymentStatusOptions = [
  { value: "notpaid", label: "Not Paid" },
  { value: "paid", label: "Paid" },
  { value: "partpayment", label: "Partially Paid" },
];

const ServiceTable = ({
  items = [],
  userRole = "",
  onEditItem = null,
  isReadOnly = false,
  requestType = "",
  currentState = "",
}) => {
  const isAccounting =
    userRole === "accounting officer" || userRole === "accountingofficer";
  const isPettyCash = requestType === "pettyCash";
  const isSecondApproval =
    currentState === "PENDING_ACCOUNTING_OFFICER_APPROVAL_2";
  const showPaymentColumns = isAccounting && isPettyCash && isSecondApproval;
  const { showAlert } = useGlobalAlert();
  const { showPrompt } = useGlobalPrompt(); // Add this line

  const [editedItems, setEditedItems] = useState(items);
  const [isSaving, setIsSaving] = useState(false);
  const isPurchaseOrder = requestType === "purchaseOrder";
  const scrollRef = useRef(null);
  const [vatRate, setVatRate] = useState(0.075);

  const scrollTable = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "right" ? 300 : -300,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    setEditedItems(
      items.map((item) => ({
        ...item,
        paymentStatus: item.paymentStatus || "notpaid",
        percentagePaid: item.percentagePaid || 0,
        paid: item.paid || 0,
        balance:
          item.balance ??
          Number(item.unitPrice || item.amount || 0) * (item.quantity || 1),
      }))
    );
  }, [items]);

  const handlePaymentStatusChange = (index, value) => {
    const newItems = [...editedItems];
    const item = newItems[index];
    item.paymentStatus = value;

    const total =
      Number(item.unitPrice || item.amount || 0) * (item.quantity || 1);

    if (value === "paid") {
      item.paid = total;
      item.balance = 0;
      item.percentagePaid = 100;
    } else if (value === "notpaid") {
      item.paid = 0;
      item.balance = total;
      item.percentagePaid = 0;
    } else if (value === "partpayment") {
      const pct = parseInt(item.percentagePaid || 0, 10) || 0;
      item.paid = Math.round((pct / 100) * total * 100) / 100;
      item.balance = Math.round((total - item.paid) * 100) / 100;
    }
    setEditedItems(newItems);
  };

  const handlePercentagePaidChange = (index, value) => {
    const newItems = [...editedItems];
    const item = newItems[index];
    const pct =
      value === "" ? 0 : Math.max(0, Math.min(100, parseInt(value) || 0));
    item.percentagePaid = pct;

    const total =
      Number(item.unitPrice || item.amount || 0) * (item.quantity || 1);
    item.paid = Math.round((pct / 100) * total * 100) / 100;
    item.balance = Math.round((total - item.paid) * 100) / 100;
    setEditedItems(newItems);
  };

  const handleSaveAll = async () => {
    if (typeof onEditItem !== "function") return;
    setIsSaving(true);
    try {
      await Promise.all(
        editedItems.map(async (item) => {
          const payload = {
            itemId: item.itemId || item._id || item.id,
            paymentStatus: item.paymentStatus,
            percentagePaid: item.percentagePaid,
            paid: item.paid,
            balance: item.balance,
          };
          await onEditItem(payload);
        })
      );
      showAlert("Saved successfully");
    } catch (err) {
      showAlert("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-x-auto" id="service-table-container">
        {isPurchaseOrder ? (
          <>
            <div
              ref={scrollRef}
              className="overflow-x-auto custom-scrollbar-hide"
              style={{ WebkitOverflowScrolling: "touch", maxWidth: "100%" }}
            >
              <table className="w-full min-w-[1400px] border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[60px]">
                      SN
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[250px]">
                      Description
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                      Vendor
                    </th>
                 
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      Quantity
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                      Unit Price
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                      Currency
                    </th>

                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                      VAT Amount
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      Discount (%)
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                      Logistics Type
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                      Shipping Qty
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                      Shipping Fee
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                      Total
                    </th>

                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                      PRN
                    </th>
                    {/* PON - Only show when state is PENDING_PROCUREMENT_MANAGER_APPROVAL or later */}
                    {(currentState === "PENDING_PROCUREMENT_MANAGER_APPROVAL" ||
                      currentState.includes("PROCUREMENT_MANAGER") ||
                      currentState.includes("ACCOUNTING") ||
                      currentState.includes("DELIVERY") ||
                      currentState === "COMPLETED") && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                        PON
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {editedItems.map((item, idx) => {
                    let vendorName = "N/A";
                    if (
                      typeof item.vendor === "object" &&
                      item.vendor !== null
                    ) {
                      vendorName = item.vendor.name || "N/A";
                    } else if (typeof item.vendor === "string") {
                      vendorName = item.vendor;
                    } else if (item.vendorName) {
                      vendorName = item.vendorName;
                    }

                    const logisticsType = item.logisticsType || "local";
                    const shippingQty = item.shippingQuantity || 0;
                    const shippingFee = Number(item.shippingFee || 0);
                    const discount = Number(item.discount || 0);
                    const vatAmount = Number(item.vatAmount || 0);
                    const total = Number(item.totalPrice || 0);

                    return (
                      <tr
                        key={item.itemId || idx}
                        className="hover:bg-emerald-50 transition-colors duration-150"
                      >
                        {/* SN */}
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          {idx + 1}
                        </td>

                        {/* Description */}
                        <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[300px] break-words whitespace-normal">
                          {item.name || item.description || "N/A"}
                        </td>

                        {/* Vendor */}
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900">
                          {vendorName}
                        </td>

                        {/* Quantity */}
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-900">
                          {item.quantity || 1}
                        </td>

                        {/* Unit Price */}
                        <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          {(item.currency || "NGN") + " "}
                          {Number(item.unitPrice || 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        {/* Currency */}
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900">
                          {item.currency || "NGN"}
                        </td>

                        {/* VAT Amount */}
                        <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          {(item.currency || "NGN") + " "}
                          {vatAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Discount (%) */}
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900">
                          {discount}%
                        </td>
                        {/* Logistics Type */}
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900 capitalize">
                          {logisticsType}
                        </td>
                        {/* Shipping Quantity */}
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900">
                          {shippingQty}
                        </td>

                        {/* Shipping Fee */}
                        <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                          {(item.currency || "NGN") + " "}
                          {shippingFee.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Total */}
                        <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                          {(item.currency || "NGN") + " "}
                          {total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900 font-mono">
                          {item.purchaseRequisitionNumber || "N/A"}
                        </td>

                        {/* PON - Only show when state is PENDING_PROCUREMENT_MANAGER_APPROVAL or later */}
                        {(currentState ===
                          "PENDING_PROCUREMENT_MANAGER_APPROVAL" ||
                          currentState.includes("PROCUREMENT_MANAGER") ||
                          currentState.includes("ACCOUNTING") ||
                          currentState.includes("DELIVERY") ||
                          currentState === "COMPLETED") && (
                          <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-900 font-mono">
                            {item.purchaseOrderNumber || "N/A"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Scroll Arrows */}
            <div className="flex justify-between items-center mt-2 px-2">
              <button
                type="button"
                onClick={() => scrollTable("left")}
                className="px-3 py-2 bg-slate-200 rounded-full text-slate-700 hover:bg-slate-300 transition"
                aria-label="Scroll Left"
              >
                &#8592;
              </button>
              <button
                type="button"
                onClick={() => scrollTable("right")}
                className="px-3 py-2 bg-slate-200 rounded-full text-slate-700 hover:bg-slate-300 transition"
                aria-label="Scroll Right"
              >
                &#8594;
              </button>
            </div>

            <style>
              {`
        .custom-scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}
            </style>
          </>
        ) : (
          <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                  SN
                </th>
                <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[200px]">
                  Description
                </th>
                <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                  Amount
                </th>
                {showPaymentColumns && (
                  <>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                      Payment Status
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                      Percentage Paid
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      Paid
                    </th>
                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      Balance
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {editedItems.map((item, idx) => (
                <tr
                  key={item.itemId || idx}
                  className="hover:bg-emerald-50 transition-colors duration-150"
                >
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                    {idx + 1}
                  </td>
                  <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[300px] break-words whitespace-normal">
                    {item.name || item.description || "N/A"}
                  </td>
                  <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                    {(item.currency || "NGN") + " "}
                    {Number(item.unitPrice || item.amount || 0).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </td>
                  {showPaymentColumns && (
                    <>
                      <td className="border border-slate-200 px-4 py-3 text-center">
                        <select
                          value={item.paymentStatus || "notpaid"}
                          onChange={(e) =>
                            handlePaymentStatusChange(idx, e.target.value)
                          }
                          className="border-2 border-emerald-300 px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          disabled={isReadOnly}
                        >
                          {paymentStatusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-center">
                        {item.paymentStatus === "partpayment" ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={item.percentagePaid || ""}
                              onChange={(e) =>
                                handlePercentagePaidChange(idx, e.target.value)
                              }
                              className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              disabled={isReadOnly}
                            />
                            <span className="text-sm text-slate-600">%</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            {item.paymentStatus === "paid" ? "100%" : "0%"}
                          </span>
                        )}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-green-700">
                        {(item.currency || "NGN") + " "}
                        {Number(item.paid || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-red-700">
                        {(item.currency || "NGN") + " "}
                        {Number(item.balance || 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showPaymentColumns && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`px-6 h-12 flex items-center justify-center rounded-md font-semibold ${
              isSaving
                ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                : "bg-[#036173] text-white hover:bg-[#024f57]"
            }`}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceTable;
