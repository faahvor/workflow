import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

const AccountTable = ({
  items = [],
  onEditItem,
  isReadOnly = false,
  showPaymentStatus = false,
  allowPaymentEditing = false,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);

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

  React.useEffect(() => {
    setEditedItems(
      items.map((item) => ({
        ...item,
        paymentStatus: item.paymentStatus || "notpaid",
        percentagePaid: item.percentagePaid || 0,
        paid: item.paid || 0,
        balance: item.balance || item.total || 0,
      }))
    );
  }, [items]);

  const handlePaymentStatusChange = (index, value) => {
    const newItems = [...editedItems];
    const item = newItems[index];

    item.paymentStatus = value;

    // Calculate paid and balance based on payment status
    const total = parseFloat(calculateTotal(item)) || 0;

    if (value === "paid") {
      item.paid = total;
      item.balance = 0;
      item.percentagePaid = 100;
    } else if (value === "notpaid") {
      item.paid = 0;
      item.balance = total;
      item.percentagePaid = 0;
    } else if (value === "part") {
      const percentage = parseFloat(item.percentagePaid) || 0;
      item.paid = (percentage / 100) * total;
      item.balance = total - item.paid;
    }

    setEditedItems(newItems);
  };

  const handlePercentagePaidChange = (index, value) => {
    const newItems = [...editedItems];
    const item = newItems[index];

    // ✅ Convert to integer (no decimals) and clamp between 0 and 100
    const percentage =
      value === "" ? 0 : Math.max(0, Math.min(100, parseInt(value) || 0));
    item.percentagePaid = percentage;

    const total = parseFloat(calculateTotal(item)) || 0;
    item.paid = (percentage / 100) * total;
    item.balance = total - item.paid;

    setEditedItems(newItems);
  };

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveClick = async (index) => {
    const item = editedItems[index];

    try {
      // Include payment fields when saving
      const updatedItem = {
        ...item,
        paymentStatus: item.paymentStatus || "notpaid",
        percentagePaid: item.percentagePaid || 0,
        paid: item.paid || 0,
        balance: item.balance || 0,
      };

      await onEditItem(updatedItem);
      console.log("✅ Item updated successfully"); // ✅ Just log it
    } catch (error) {
      console.error("❌ Error saving item:", error);
      // Only show alert on error
      console.error("❌ Failed to update item. Please try again.");
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
              <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                Vendor
              </th>
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>
              <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                Unit Price
              </th>
              {showPaymentStatus && (
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
                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Total Price
                  </th>
                </>
              )}
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

                {/* ✅ Vendor Column */}
                <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  {item.vendor || "N/A"}
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
                {showPaymentStatus && (
                  <>
                    {/* Payment Status */}
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      {allowPaymentEditing ? (
                        <select
                          value={item.paymentStatus || "notpaid"}
                          onChange={async (e) => {
                            handlePaymentStatusChange(index, e.target.value);
                            // ✅ Save immediately after change
                            await handleSaveClick(index);
                          }}
                          className="border-2 border-emerald-300 px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="notpaid">Not Paid</option>
                          <option value="paid">Paid</option>
                          <option value="part">Partially Paid</option>
                        </select>
                      ) : (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.paymentStatus === "paid"
                              ? "bg-green-100 text-green-800"
                              : item.paymentStatus === "part"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.paymentStatus === "paid"
                            ? "Paid"
                            : item.paymentStatus === "part"
                            ? "Partially Paid"
                            : "Not Paid"}
                        </span>
                      )}
                    </td>

                    {/* Percentage Paid */}
                    <td className="border border-slate-200 px-4 py-3 text-center">
                      {item.paymentStatus === "part" ? (
                        allowPaymentEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="1" // ✅ Changed from 0.01 to 1 for whole numbers only
                              value={item.percentagePaid || ""}
                              onChange={(e) => {
                                handlePercentagePaidChange(
                                  index,
                                  e.target.value
                                );
                              }}
                              onKeyDown={(e) => {
                                // ✅ Save on Enter key
                                if (e.key === "Enter") {
                                  e.target.blur();
                                  handleSaveClick(index);
                                }
                              }}
                              onBlur={() => {
                                // ✅ Save when user clicks away
                                handleSaveClick(index);
                              }}
                              className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-slate-600">%</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            {item.percentagePaid
                              ? `${item.percentagePaid}%`
                              : "0"}
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Paid Amount */}
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-green-700">
                      {item.currency || "NGN"}{" "}
                      {Number(item.paid || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Balance */}
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-red-700">
                      {item.currency || "NGN"}{" "}
                      {Number(item.balance || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </>
                )}

                {/* Total Price - Calculated */}
                <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                  {item.total || item.unitPrice ? (
                    <>
                      {item.currency || "NGN"} {calculateTotal(item)}
                    </>
                  ) : (
                    "N/A"
                  )}
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

export default AccountTable;
