// src/components/tables/ProcurementMTable.jsx

import React, { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdCheckCircle } from "react-icons/md";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const ProcurementMTable = ({
  items = [],
  onEditItem,
  isReadOnly = false,
  vendors = [],
  requestType = "",
  tag = "",
  isIncompleteDelivery = false,
  requestId = "",
  onRefreshRequest = () => {},
  clearingFee = 0,
  request,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);
  const tagLower = String(tag || "").toLowerCase();
  const [calculatedVat, setCalculatedVat] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { getToken } = useAuth();
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  const showShippingFee = request?.logisticsType === "international";

  // Determine if editing is allowed (override isReadOnly when isIncompleteDelivery)
  const canEdit = isIncompleteDelivery || !isReadOnly;
  const isPettyCash =
    (requestType || "").toString().toLowerCase() === "pettycash";

  const showFeeColumns = tagLower === "shipping" || tagLower === "clearing";
  const feeFieldName = tagLower === "shipping" ? "shippingFee" : "clearingFee";
  const feeLabel = tagLower === "shipping" ? "Shipping Fee" : "Clearing Fee";

  useEffect(() => {
    const fetchVat = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`${API_BASE_URL}/vat`, { headers });
        const value = resp?.data?.value;
        setCalculatedVat(typeof value === "number" ? value / 100 : 0);
      } catch (error) {
        console.error("Error fetching VAT:", error);
        setCalculatedVat(0);
      }
    };

    if (isIncompleteDelivery) {
      fetchVat();
    }
  }, [getToken, isIncompleteDelivery]);

  const calculateItemTotal = (item) => {
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const discount =
      item.discount !== "" &&
      item.discount !== null &&
      item.discount !== undefined
        ? parseFloat(item.discount) || 0
        : 0;
    const isVatted = !!item.vatted;

    const baseTotal = quantity * unitPrice;
    const discountFactor =
      discount >= 0 && discount <= 100 ? (100 - discount) / 100 : 1;
    const discountedTotal = baseTotal * discountFactor;
    const vatAmount = isVatted ? discountedTotal * calculatedVat : 0;
    const totalPrice = discountedTotal + vatAmount;

    return {
      totalPrice,
      vatAmount,
      discountedTotal,
    };
  };

  const handleChange = (index, field, value) => {
    setEditedItems((prevItems) => {
      const newItems = [...prevItems];
      const item = { ...newItems[index] };

      if (field === "quantity") {
        item.quantity = value === "" ? 0 : parseInt(value) || 0;
      } else {
        item[field] = value;
      }

      // Recalculate totals
      const { totalPrice, vatAmount } = calculateItemTotal(item);
      item.totalPrice = totalPrice;
      item.total = totalPrice;
      item.vatAmount = vatAmount;
      item._dirty = true;

      newItems[index] = item;
      return newItems;
    });
  };

  const handleSaveAll = async () => {
    if (!window.confirm("Save all changes to the items?")) return;

    const dirtyItems = editedItems.filter((it) => it._dirty);

    if (!dirtyItems || dirtyItems.length === 0) {
      alert("No changes to save.");
      return;
    }

    try {
      setIsSaving(true);

      for (const item of dirtyItems) {
        const { totalPrice, vatAmount } = calculateItemTotal(item);

        const payload = {
          itemId: item.itemId || item._id,
          quantity: item.quantity,
          totalPrice: totalPrice,
          vatAmount: vatAmount,
          requestId: requestId,
        };

        console.log("Saving item:", payload);

        await onEditItem(payload);
      }

      // Clear dirty flags
      setEditedItems((prev) =>
        prev.map((itm) => ({
          ...itm,
          _dirty: false,
        }))
      );

      alert("Saved successfully!");

      // Refresh request details
      if (typeof onRefreshRequest === "function") {
        await onRefreshRequest();
      }
    } catch (err) {
      console.error("Error saving items:", err);
      alert("Error saving changes. See console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  const getFeeValue = (item) => {
    if (feeFieldName === "clearingFee") {
      return clearingFee || 0;
    }
    if (!item) return 0;
    const v = item[feeFieldName];
    return typeof v === "number" ? v : Number(v || 0);
  };

  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("fleet-table-container");
      if (!container) {
        setNeedsScroll(false);
        return;
      }
      const scrollW = container.scrollWidth;
      const clientW = container.clientWidth;
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
  const isAnyItemInStock = React.useMemo(() => {
    return (items || []).some((it) => !!it.inStock);
  }, [items]);

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
            <tr className="bg-gradient-to-r from-[#036173] to-teal-600 text-white">
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
              {!isAnyItemInStock && (
                <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                  Vendor
                </th>
              )}
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
              {!isAnyItemInStock && !showFeeColumns && (
                <>
                  {showShippingFee && (
                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      Shipping Fee
                    </th>
                  )}
                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Unit Price
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Total Price
                  </th>
                </>
              )}
              {!isAnyItemInStock && !showFeeColumns && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                  Discount (%)
                </th>
              )}

              {!isPettyCash && !isAnyItemInStock && !showFeeColumns && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  VAT Amount
                </th>
              )}

              {requestType !== "pettyCash" && !isAnyItemInStock && (
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
    {item.movedFromRequestId || "N/A"}
  </td>
)}
                {/* ✅ Vendor Column */}
                {!isAnyItemInStock && (
                  <td className="border border-slate-200 px-4 py-3 text-sm text-slate-700">
                    {resolveVendorName(item.vendor)}
                  </td>
                )}

                {/* Quantity - Editable */}
                <td className="border border-slate-200 px-4 py-3 text-center">
                  {isIncompleteDelivery ? (
                    <input
                      type="number"
                      min="1"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        handleChange(index, "quantity", e.target.value)
                      }
                      className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  ) : editingIndex === index ? (
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

                {/* Unit Price - Read Only */}
                {!isAnyItemInStock && !showFeeColumns && (
                  <>
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

                    {/* Total Price - Calculated */}
                    <td className="border border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      <span className="font-semibold">
                        {item.currency || "NGN"}{" "}
                        {Number(
                          isIncompleteDelivery
                            ? calculateItemTotal(item).totalPrice
                            : item.totalPrice || item.total || 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                  </>
                )}
                {!isAnyItemInStock && !showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    {item.discount !== "" &&
                    item.discount !== null &&
                    item.discount !== undefined
                      ? `${item.discount}%`
                      : "0%"}
                  </td>
                )}

                {/* VAT Amount Column - Only show when isIncompleteDelivery */}
                {!isPettyCash && !isAnyItemInStock && !showFeeColumns && (
                  <td className="border border-slate-200 px-4 py-3 text-center text-sm text-slate-700">
                    <>
                      {item.currency || "NGN"}{" "}
                      {item.vatAmount ? `${item.vatAmount}` : "-"}
                    </>
                  </td>
                )}

                {requestType !== "pettyCash" && !isAnyItemInStock && (
                  <>
                    <td className="border border-slate-200 px-4 text-center py-3 text-sm text-slate-700">
                      {item.purchaseRequisitionNumber || "N/A"}
                    </td>
                    <td className="border border-slate-200 px-4 text-center py-3 text-sm text-slate-700">
                      {item.purchaseOrderNumber || "N/A"}
                    </td>
                  </>
                )}
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
          {isIncompleteDelivery && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSaveAll}
                disabled={isSaving || !editedItems.some((it) => it._dirty)}
                className={`px-6 h-12 flex items-center justify-center gap-2 rounded-md font-semibold ${
                  isSaving || !editedItems.some((it) => it._dirty)
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-[#036173] text-white hover:bg-[#024f57]"
                }`}
              >
                <MdCheckCircle className="text-lg" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

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

export default ProcurementMTable;
