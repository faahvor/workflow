import React, { useState } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { useGlobalAlert } from "../GlobalAlert";

const LegalHeadTable = ({
  items = [],
  onEditItem,
  onDeleteItem,
  requestId,
  isReadOnly = false,
  currentState = "",
  requestType = "",
  vendors = [],
  tag = "",
  clearingFee,
  request,
}) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedItems, setEditedItems] = useState(items);
  const [needsScroll, setNeedsScroll] = useState(false);
  const isSecondApproval = currentState === "PENDING_LEGAL_HEAD_APPROVAL_2";
  const isPettyCash = requestType === "pettyCash";
  const tagLower = String(tag || "").toLowerCase();
  const showFeeColumns = tagLower === "shipping" || tagLower === "clearing";
  const feeFieldName = tagLower === "shipping" ? "shippingFee" : "clearingFee";
  const feeLabel = tagLower === "shipping" ? "Shipping Fee" : "Clearing Fee";
  const showShippingFee = request?.logisticsType === "international";
  const { showAlert } = useGlobalAlert();

  const getFeeValue = (item) => {
    if (!item) return 0;
    const v = item[feeFieldName];
    if (feeFieldName === "clearingFee" && (v === undefined || v === null)) {
      return typeof clearingFee === "number"
        ? clearingFee
        : Number(clearingFee || 0);
    }
    return typeof v === "number" ? v : Number(v || 0);
  };

  const hideActionsForFee = showFeeColumns && !isSecondApproval;

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
    if (typeof vendorField === "object") {
      const name =
        vendorField.name ||
        vendorField.vendorName ||
        vendorField.label ||
        vendorField.vendor ||
        null;
      if (name) return String(name);
      const id = vendorField.vendorId ?? vendorField._id ?? vendorField.id;
      if (id && vendorsById.has(String(id))) {
        const found = vendorsById.get(String(id));
        return found?.name || String(id);
      }
      return "N/A";
    }
    const key = String(vendorField);
    if (vendorsById.has(key)) {
      const found = vendorsById.get(key);
      return found?.name || key;
    }
    return key;
  };

  React.useEffect(() => {
    setEditedItems(items);
  }, [items]);

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveClick = async (index) => {
    const item = editedItems[index];
    const quantity = Number(item.quantity) || 0;
    if (quantity < 1) {
      showAlert("Quantity must be at least 1");
      return;
    }
    const payload = {
      itemId: item.itemId || item._id,
      quantity,
      requestId,
    };
    if (
      item.vendorId !== undefined &&
      item.vendorId !== null &&
      item.vendorId !== ""
    ) {
      payload.vendorId = item.vendorId;
    }
    try {
      await onEditItem(payload);
      setEditedItems((prev) =>
        prev.map((it, i) => (i === index ? { ...it, quantity } : it))
      );
      setEditingIndex(null);
      showAlert("✅ Item updated successfully!");
    } catch (error) {
      showAlert("❌ Failed to update item");
    }
  };

  const handleCancelEdit = () => {
    setEditedItems(items);
    setEditingIndex(null);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...editedItems];
    newItems[index].quantity = parseInt(value) || 1;
    setEditedItems(newItems);
  };

  const handleDeleteClick = (item) => {
    if (typeof onDeleteItem === "function") {
      onDeleteItem(item);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 rounded-xl border-2 border-slate-200">
        <p className="text-slate-500">No items in this request</p>
      </div>
    );
  }

  const calculateVatAmount = (item) => {
    if (!item.vatted || !item.total) return 0;
    const vatRate = 0.075;
    return (item.total / (1 + vatRate)) * vatRate;
  };

  React.useEffect(() => {
    const checkScroll = () => {
      const container = document.getElementById("legal-table-container");
      if (container) {
        setNeedsScroll(container.scrollWidth > container.clientWidth);
      }
    };
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [editedItems, isSecondApproval]);

  function isProcurementOfficerApproved(request) {
    return (
      Array.isArray(request.history) &&
      (request.history.some(
        (h) =>
          h.action === "APPROVE" &&
          h.role === "Procurement Officer" &&
          h.info === "Procurement Officer Approved"
      ) ||
        request.history.some(
          (h) =>
            h.action === "SPLIT" &&
            h.role === "SYSTEM" &&
            typeof h.info === "string" &&
            h.info.includes("Petty Cash items moved to Petty Cash flow")
        ))
    );
  }
    editedItems.length > 0 &&
    editedItems.every(
      (it) =>
        (it.vendorId ?? it.vendor) ===
        (editedItems[0].vendorId ?? editedItems[0].vendor)
    );
  const singleVendorName = resolveVendorName(
    editedItems[0]?.vendor || editedItems[0]?.vendorName
  );
  const groupByVendor = (list) => {
    const groups = {};
    list.forEach((it, index) => {
      const key = it.vendorId ?? it.vendor ?? "No Vendor";
      if (!groups[key]) groups[key] = { items: [], order: index };
      groups[key].items.push({ ...it, _groupIndex: index });
    });
    return Object.values(groups).sort((a, b) => a.order - b.order);
  };
  const groups = groupByVendor(editedItems);

  return (
    <div className="relative">
      <div className="overflow-x-auto" id="legal-table-container">
        <table
          className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-visible"
          style={{ borderCollapse: "collapse" }}
        >
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
              <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                Quantity
              </th>
              {showFeeColumns && !isSecondApproval && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  Shipping Qty
                </th>
              )}
              {showFeeColumns && !isSecondApproval && !allSameVendor && (
                <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[140px]">
                  {feeLabel}
                </th>
              )}
              {(isSecondApproval || isPettyCash) && (
                <>
                  {!isPettyCash && (
                    <th className="border border-slate-300 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[150px]">
                      Vendor
                    </th>
                  )}
                  {showShippingFee && (
                    <th className="border border-slate-300 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      Shipping Fee
                    </th>
                  )}
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Unit Price
                  </th>
                  {!isPettyCash && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">
                      Discount (%)
                    </th>
                  )}
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Total Price
                  </th>
                  {!isPettyCash && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                      VAT Amount
                    </th>
                  )}
                </>
              )}
              {(isSecondApproval || (showFeeColumns && !isSecondApproval)) && (
                <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                  PRN
                </th>
              )}
              {!isReadOnly &&
                !isSecondApproval &&
                !isPettyCash &&
                !hideActionsForFee && (
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[120px]">
                    Actions
                  </th>
                )}
            </tr>
          </thead>
          <tbody>
            {editedItems.map((item, index) => (
              <tr
                key={item.itemId || index}
                className="hover:bg-emerald-50 transition-colors duration-150"
                style={
                  item.isDuplicateItem
                    ? {
                        boxShadow: "0 0 0 2px #ef5858",
                        borderRadius: "8px",
                        background: "#f4f1f1",
                        zIndex: 2,
                        position: "relative",
                      }
                    : undefined
                }
              >
                <td className="border border-slate-200 px-4 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>
                <td className="border border-slate-200 px-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                  {item.name || "N/A"}
                </td>
                <td
                  className="border border-slate-200 px-4  text-center text-sm font-medium text-slate-900"
                  style={{ minWidth: "100px" }}
                >
                  {isProcurementOfficerApproved(request)
                    ? item.makersType || item.itemType || "N/A"
                    : "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700">
                  {item.maker || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700">
                  {item.makersPartNo || "N/A"}
                </td>
                <td className="border border-slate-200 px-4 py-[5px] text-center">
                  {editingIndex === index && !isSecondApproval ? (
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
                {showFeeColumns && !isSecondApproval && (
                  <td className="border border-slate-200 px-4 py-[5px] text-center text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {item.shippingQuantity ?? 0}
                    </span>
                  </td>
                )}
                {showFeeColumns && !isSecondApproval && !allSameVendor && (
                    <td className="border border-slate-200 px-4 py-[5px] text-right text-sm text-slate-700">
                      {item.currency || "NGN"}{" "}
                      {Number(getFeeValue(item) || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </td>
                  )}
                {(isSecondApproval || isPettyCash) && (
                  <>
                    {!isPettyCash && (
                      <td className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700">
                        {resolveVendorName(item.vendor)}
                      </td>
                    )}
                    {showShippingFee && (
                      <td className="border border-slate-200 px-4 py-[5px] text-right text-sm text-slate-700">
                        {item.shippingFee ? (
                          <>
                            {item.currency || "NGN"}{" "}
                            {parseFloat(item.shippingFee).toFixed(2)}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    )}
                    <td className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700">
                      {item.currency || "NGN"}{" "}
                      {Number(item.unitPrice || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {!isPettyCash && (
                      <td className="border border-slate-200 px-4 py-[5px] text-center text-sm text-slate-700">
                        {item.discount ? `${item.discount}%` : "0%"}
                      </td>
                    )}
                    <td className="border border-slate-200 px-4 py-[5px] text-center text-sm text-slate-900">
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
                    {!isPettyCash && (
                      <td className="border border-slate-200 px-4 py-[5px] text-center text-sm text-slate-700">
                        {item.currency || "NGN"}{" "}
                        {item.vatAmount ? `${item.vatAmount}` : "-"}
                      </td>
                    )}
                  </>
                )}
              {(isSecondApproval ||
                    (showFeeColumns && !isSecondApproval)) &&
                    index === 0 && (
                      <td
                        className="border border-slate-200 px-4 py-[5px] text-sm text-slate-700"
                        rowSpan={g.items.length}
                        style={{ verticalAlign: "middle" }}
                      >
                        {item.purchaseRequisitionNumber ||
                          item.purchaseReqNumber ||
                          item.prn ||
                          "N/A"}
                      </td>
                    )}
                {!isReadOnly &&
                  !isSecondApproval &&
                  !isPettyCash &&
                  !hideActionsForFee && (
                    <td className="border border-slate-200 px-4 py-[5px]">
                      <div className="flex items-center justify-center gap-2">
                        {editingIndex === index ? (
                          <>
                            <button
                              onClick={() => handleSaveClick(index)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-150"
                              title="Save"
                            >
                              <FaSave className="text-lg" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                              title="Cancel"
                            >
                              <FaTimes className="text-lg" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(index)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                              title="Edit"
                            >
                              <FaEdit className="text-lg" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150"
                              title="Delete"
                            >
                              <MdDelete className="text-lg" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {needsScroll && (
        <div className="flex justify-between mt-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center hover:bg-[#1f2937] transition-colors"
            onClick={() => {
              const container = document.getElementById("legal-table-container");
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
              const container = document.getElementById("legal-table-container");
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

export default LegalHeadTable;