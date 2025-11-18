import React, { useState, useEffect } from "react";
import { FaEdit, FaSave } from "react-icons/fa";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import axios from "axios";

const ProcurementTable = ({
  progressData,
  handleDeleteItem,
  handleVendorChange,
  requests,

  selectedRequest,
  onEditItem,
  showPON = false,
  canEditPON = false,
  onApprove,
  allowPriceEditing = false,
  allowEditing = false,
  showUnitPrice = false,
  unitPrices = {},
  onPriceChange = () => {},

  handleCreateVendor,
  vendors,
  canEditPRN = false,
  userRole = "procurement",
  showPRN = false,
  allowVendorSelection = false,
  showItemTypeAndDept = false,
  showVat = false,
  onSwitchInitiated,
  isPreview = false,
  readOnly = false,
  allowItemTypeChange = true,
  allowInStockChange = true,
  allowLogisticsChange = true,
}) => {
  const [editedRequests, setEditedRequests] = useState(
    requests.map((request) => ({
      ...request,
      itemId: request.itemId || request._id,
      currency: request.currency || "",
      destination:
        request.itemType === "pettyCash" ? request.destination || "" : "N/A",
      itemType: request.itemType || "purchaseOrder",
      discount: request.discount || "",
      vatted: request.vatted || false,
    }))
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [renderKey, setRenderKey] = useState(0);
  const [currencies, setCurrencies] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [deletionMode, setDeletionMode] = useState(false);
  const [deletionComment, setDeletionComment] = useState("");
  const [deletingItem, setDeletingItem] = useState(null);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [shippingFees, setShippingFees] = useState({});
  const [calculatedVat, setCalculatedVat] = useState(0);
  const [isSaving, setIsSaving] = useState(false); // ✅ NEW STATE

  const departments = [
    "marine",
    "IT",
    "account",
    "protocol",
    "compliance/qhse",
    "operation",
    "project",
    "purchase",
    "hr",
    "admin",
  ];

  const capitalizeFirstLetter = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const departmentOptions = departments.map((dept) => ({
    value: dept === "IT" ? "IT" : capitalizeFirstLetter(dept),
    label: dept === "IT" ? "IT" : capitalizeFirstLetter(dept),
  }));

  // ✅ ONE UNIFIED EDIT FUNCTION
  const handleUnifiedEdit = async (updates) => {
    try {
      setIsSaving(true);
      const token = sessionStorage.getItem("userToken");
      if (!token) {
        console.error("❌ No token found!");
        return;
      }

      // Create a map of updates for quick lookup
      const updateMap = new Map();
      updates.forEach((update) => {
        updateMap.set(update.itemId, update.changes);
      });

      // Build the updated items array
      const updatedItems = editedRequests.map((item) => {
        const changes = updateMap.get(item.itemId);
        if (changes) {
          return {
            ...item,
            ...changes,
          };
        }
        return item;
      });

      // Call the unified endpoint
      const response = await axios.patch(
        `https://hdp-backend-1vcl.onrender.com/api/requests/${selectedRequest.requestId}`,
        {
          items: updatedItems,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        console.log("✅ Request updated successfully");

        // Update local state with the response
        if (response.data && response.data.items) {
          setEditedRequests(
            response.data.items.map((item) => ({
              ...item,
              itemId: item.itemId || item._id,
            }))
          );
        }

        // Notify parent component if needed
        if (onEditItem) {
          onEditItem(response.data);
        }
      }
    } catch (error) {
      console.error("❌ Error updating request:", error);
      console.error("❌ Error details:", error.response?.data || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ SIMPLIFIED handleChange FUNCTION
  const handleChange = (itemId, field, value) => {
    // Update local state immediately for UI responsiveness
    setEditedRequests((prevRequests) => {
      const newRequests = prevRequests.map((item) => {
        if (item.itemId === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Recalculate total if needed
          if (["unitPrice", "quantity", "discount", "vatted"].includes(field)) {
            const currentUnitPrice =
              field === "unitPrice"
                ? value === ""
                  ? 0
                  : parseFloat(value) || 0
                : parseFloat(item.unitPrice) || 0;
            const currentQuantity =
              field === "quantity"
                ? value === ""
                  ? 0
                  : parseFloat(value) || 0
                : parseFloat(item.quantity) || 0;
            const currentDiscount =
              field === "discount"
                ? value === ""
                  ? 0
                  : parseFloat(value) || 0
                : parseFloat(item.discount) || 0;
            const isVatted = field === "vatted" ? value : item.vatted;

            const baseTotal = currentUnitPrice * currentQuantity;
            const discountFactor =
              currentDiscount >= 0 && currentDiscount <= 100
                ? (100 - currentDiscount) / 100
                : 1;
            const discountedTotal = baseTotal * discountFactor;
            updatedItem.total = isVatted
              ? discountedTotal * (1 + calculatedVat)
              : discountedTotal;
          }

          return updatedItem;
        }

        // ✅ DISCOUNT PROPAGATION: Apply discount to all items with same vendor
        if (
          field === "discount" &&
          value !== "" &&
          item.vendor === prevRequests.find((r) => r.itemId === itemId)?.vendor
        ) {
          const currentDiscount = parseFloat(value) || 0;
          const baseTotal =
            (parseFloat(item.unitPrice) || 0) *
            (parseFloat(item.quantity) || 0);
          const discountFactor =
            currentDiscount >= 0 && currentDiscount <= 100
              ? (100 - currentDiscount) / 100
              : 1;
          const discountedTotal = baseTotal * discountFactor;

          return {
            ...item,
            discount: value,
            total: item.vatted
              ? discountedTotal * (1 + calculatedVat)
              : discountedTotal,
          };
        }

        return item;
      });

      // Call unified edit function with debounce (5 seconds)
      clearTimeout(window.editTimeout);
      window.editTimeout = setTimeout(() => {
        // For discount, update all items with same vendor
        if (field === "discount") {
          const targetItem = newRequests.find((r) => r.itemId === itemId);
          const vendorItems = newRequests.filter(
            (r) => r.vendor === targetItem?.vendor
          );

          const updates = vendorItems.map((item) => ({
            itemId: item.itemId,
            changes: { discount: value, total: item.total },
          }));

          handleUnifiedEdit(updates);
        } else {
          // Single item update
          const updatedItem = newRequests.find((r) => r.itemId === itemId);
          handleUnifiedEdit([
            {
              itemId,
              changes: {
                [field]:
                  field === "unitPrice" || field === "quantity"
                    ? value === ""
                      ? 0
                      : parseFloat(value) || 0
                    : value,
                ...(updatedItem.total !== undefined
                  ? { total: updatedItem.total }
                  : {}),
              },
            },
          ]);
        }
      }, 5000); // ✅ 5 SECOND DEBOUNCE

      return newRequests;
    });
  };

  const shouldShowShippingFeeForVendor = (vendorItems) => {
    return vendorItems.some((item) => item.logisticsType === "international");
  };

  const groupAndSortRequests = (requests) => {
    const vendorGroups = {};
    requests.forEach((request, index) => {
      const key = request.vendor || "No Vendor";
      if (!vendorGroups[key]) {
        vendorGroups[key] = { order: index, items: [] };
      }
      vendorGroups[key].items.push(request);
    });
    return Object.values(vendorGroups).sort((a, b) => a.order - b.order);
  };

  const groupedRequests = groupAndSortRequests(editedRequests);

  useEffect(() => {
    // ✅ Set valid currencies from documentation
    const validCurrencies = [
      "NGN",
      "USD",
      "GBP",
      "EUR",
      "JPY",
      "CNY",
      "CAD",
      "AUD",
    ];
    setCurrencies(
      validCurrencies.map((currency) => ({
        value: currency,
        label: currency,
      }))
    );
    setLoadingCurrencies(false);
  }, []);

  useEffect(() => {
    const fetchVat = async () => {
      try {
        const token = sessionStorage.getItem("userToken");
        if (!token) return;
        const response = await axios.get(
          "https://hdp-backend-1vcl.onrender.com/api/vat/calculated",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCalculatedVat(response.data.calculatedVat || 0);
      } catch (error) {
        console.error("Error fetching VAT:", error);
      }
    };
    fetchVat();
  }, []);

  useEffect(() => {
    // Initialize shipping fees from items data
    const vendorShippingFees = {};

    if (requests && requests.length > 0) {
      requests.forEach((item) => {
        const vendor = item.vendor || "No Vendor";
        if (
          item.shippingFee !== undefined &&
          vendorShippingFees[vendor] === undefined
        ) {
          vendorShippingFees[vendor] = item.shippingFee;
        }
      });
    }

    setShippingFees(vendorShippingFees);

    setEditedRequests((prevRequests) => {
      const updatedRequests = requests.map((request) => {
        const existingItem = prevRequests.find(
          (item) =>
            (item.itemId || item._id) === (request.itemId || request._id)
        );
        return {
          ...request,
          itemId: request.itemId || request._id,
          currency: existingItem?.currency || request.currency || "",
          destination:
            request.itemType === "pettyCash"
              ? existingItem?.destination || request.destination || ""
              : "N/A",
          itemType:
            selectedRequest?.requestType === "purchaseOrder"
              ? request.itemType === "pettyCash"
                ? "pettyCash"
                : "purchaseOrder"
              : request.itemType || "purchaseOrder",
          inStock: existingItem?.inStock || request.inStock || false,
          logisticsType:
            existingItem?.logisticsType || request.logisticsType || "local",
          shippingQuantity:
            existingItem?.shippingQuantity || request.shippingQuantity || 0,
          discount: existingItem?.discount || request.discount || "",
          vatted: existingItem?.vatted || request.vatted || false,
          total: existingItem?.total || request.total || 0,
          purchaseReqNumber:
            existingItem?.purchaseReqNumber || request.purchaseReqNumber || "",
          purchaseOrderNumber:
            existingItem?.purchaseOrderNumber ||
            request.purchaseOrderNumber ||
            "",
          shippingFee: request.shippingFee || 0,
        };
      });
      return updatedRequests;
    });
  }, [requests, selectedRequest]);

  const handleEditClick = (itemId) => {
    setEditingIndex(String(itemId));
  };

  const handleSaveClick = (itemId) => {
    const updatedItem = editedRequests.find((item) => item.itemId === itemId);
    if (updatedItem && onEditItem) {
      const payload = {
        ...updatedItem,
        quantity: parseFloat(updatedItem.quantity) || 1,
        unitPrice: parseFloat(updatedItem.unitPrice) || 0,
        discount: parseInt(updatedItem.discount) || "",
        vatted: updatedItem.vatted || false,
        inStock: updatedItem.inStock || false,
        total: parseFloat(updatedItem.total) || 0,
        purchaseReqNumber: updatedItem.purchaseReqNumber || "",
        purchaseOrderNumber: updatedItem.purchaseOrderNumber || "",
        requestId: selectedRequest?.requestId,
      };
      onEditItem(payload);
    }
    setEditingIndex(null);
    setRenderKey((prev) => prev + 1);
  };

  const getVendorKey = (item) => {
    if (
      selectedRequest?.clearing === false &&
      selectedRequest?.shipping === true
    ) {
      return item.shippingVendor || item.vendor || "No Vendor";
    } else if (
      selectedRequest?.clearing === true &&
      selectedRequest?.shipping === false
    ) {
      if (
        selectedRequest?.shippingItems &&
        selectedRequest.shippingItems.length > 0
      ) {
        return item.shippingVendor || item.vendor || "No Vendor";
      } else {
        return item.vendor || "No Vendor";
      }
    } else {
      return item.vendor || "No Vendor";
    }
  };

  const vendorGroups = {};
  editedRequests.forEach((item, idx) => {
    const key = getVendorKey(item);
    if (!vendorGroups[key]) vendorGroups[key] = [];
    vendorGroups[key].push({ ...item, _groupIndex: idx });
  });

  const getVendorInfo = (request) => {
    const vendorKey = getVendorKey(request);
    const group = vendorGroups[vendorKey];
    const rowspan = group ? group.length : 1;
    const itemIndexInGroup = group
      ? group.findIndex(
          (item) =>
            (item.itemId || item._id) === (request.itemId || request._id)
        )
      : 0;
    const isFirstRow = itemIndexInGroup === 0;
    return { rowspan, isFirstRow, vendorKey, itemIndexInGroup };
  };

  return (
    <div className="p-4 w-full mx-auto overflow-x-auto">
      {isSaving && (
        <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded">
          Saving changes...
        </div>
      )}

      <div className="space-y-4">
        {groupAndSortRequests(editedRequests).map((vendorGroup, groupIndex) => (
          <div key={groupIndex} className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-slate-200  text-sm mb-4">
              <thead>
                <tr className="bg-[#036173] text-white">
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    SN
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Description
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Item Type
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Maker
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Maker's Part No
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Asset ID
                  </th>
                  <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Quantity
                  </th>
                  {selectedRequest?.requestType === "purchaseOrder" &&
                    showItemTypeAndDept && (
                      <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                        Switch to Petty Cash
                      </th>
                    )}
                  {showItemTypeAndDept && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Destination
                    </th>
                  )}
                  {showItemTypeAndDept && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      In Stock
                    </th>
                  )}
                  {showItemTypeAndDept && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Logistics Type
                    </th>
                  )}
                  {showItemTypeAndDept && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Shipping Quantity
                    </th>
                  )}
                  {showUnitPrice && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Unit Price
                    </th>
                  )}
                  {showUnitPrice && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Discount (%)
                    </th>
                  )}
                  {showUnitPrice && showVat && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Apply VAT
                    </th>
                  )}
                  {showUnitPrice && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      Total Price
                    </th>
                  )}
                  {showUnitPrice && showVat && (
                    <th className="border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                      VAT Amount
                    </th>
                  )}
                  {showPRN && (
                    <th
                      className={`border border-slate-300 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-24 ${
                        selectedRequest.itemType === "pettyCash"
                          ? "bg-gray-200 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      PRN
                    </th>
                  )}
                  {showPON && <th className="border p-2">PON</th>}
                </tr>
              </thead>
              <tbody>
                {vendorGroup.items.map((request, index) => {
                  const itemId = request.itemId || request._id;
                  return (
                    <tr
                      key={index}
                      className="hover:bg-[#9AB57D] hover:bg-opacity-25"
                    >
                      <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                        {index + 1}
                      </td>
                      <td
                        className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                        style={{ minWidth: "150px" }}
                      >
                        {request.name}
                      </td>
                      <td
                        className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                        style={{ minWidth: "100px" }}
                      >
                        {request.makersType}
                      </td>
                      <td
                        className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                        style={{ minWidth: "100px" }}
                      >
                        {request.maker}
                      </td>
                      <td
                        className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                        style={{ minWidth: "150px" }}
                      >
                        {request.makersPartNo}
                      </td>
                      <td
                        className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                        style={{ minWidth: "150px" }}
                      >
                        {allowVendorSelection && (
                          <CreatableSelect
                            options={vendors.map((vendor) => ({
                              value: vendor.vendorId,
                              label: vendor.name,
                            }))}
                            value={(() => {
                              const currentItem = editedRequests.find(
                                (item) => item.itemId === request.itemId
                              );
                              return currentItem?.vendor
                                ? {
                                    value:
                                      currentItem.vendorId ||
                                      currentItem.vendor,
                                    label: currentItem.vendor,
                                  }
                                : null;
                            })()}
                            onChange={(selectedOption) => {
                              console.log(
                                "🔍 Vendor selected:",
                                selectedOption
                              );

                              // ✅ UPDATE LOCAL STATE IMMEDIATELY
                              setEditedRequests((prev) =>
                                prev.map((item) =>
                                  item.itemId === request.itemId
                                    ? {
                                        ...item,
                                        vendor: selectedOption?.label || null,
                                        vendorId: selectedOption?.value || null,
                                      }
                                    : item
                                )
                              );

                              // Then call the parent handlers
                              handleVendorChange(
                                request.itemId,
                                selectedOption
                              );

                              const updatedItem = {
                                ...request,
                                vendor: selectedOption?.label || null,
                                vendorId: selectedOption?.value || null,
                                requestId: selectedRequest?.requestId,
                              };
                              onEditItem(updatedItem);
                            }}
                            onCreateOption={(inputValue) =>
                              handleCreateVendor(inputValue, index)
                            }
                            className={`w-[170px] text-black ${
                              request.itemType === "pettyCash"
                                ? "bg-gray-200 cursor-not-allowed"
                                : ""
                            }`}
                            styles={{
                              control: (provided) => ({
                                ...provided,
                                minWidth: "100px",
                                fontSize: "14px",
                                backgroundColor:
                                  request.itemType === "pettyCash"
                                    ? "#e5e7eb"
                                    : provided.backgroundColor,
                                cursor:
                                  request.itemType === "pettyCash"
                                    ? "not-allowed"
                                    : provided.cursor,
                              }),
                              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                            menuPortalTarget={document.body}
                            menuPlacement="auto"
                            isClearable
                            isDisabled={request.itemType === "pettyCash"}
                            placeholder="Select Vendor"
                          />
                        )}
                      </td>
                      <td
                        className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                        style={{ minWidth: "100px" }}
                      >
                        {request.assetId || "N/A"}
                      </td>
                      <td
                        className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                        style={{ minWidth: "100px" }}
                      >
                        {editingIndex === String(itemId) ? (
                          <input
                            type="number"
                            min="1"
                            value={
                              editedRequests.find(
                                (item) => item.itemId === itemId
                              )?.quantity || ""
                            }
                            onChange={(e) =>
                              handleChange(itemId, "quantity", e.target.value)
                            }
                            onFocus={(e) => {
                              if (e.target.value === "1") {
                                handleChange(itemId, "quantity", "");
                              }
                            }}
                            className="border px-2 py-1 rounded-md w-16 text-black"
                          />
                        ) : (
                          request.quantity
                        )}
                      </td>
                      {showItemTypeAndDept && (
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          <input
                            type="checkbox"
                            checked={request.itemType === "pettyCash"}
                            onChange={(e) => {
                              const newItemType = e.target.checked
                                ? "pettyCash"
                                : "purchaseOrder";
                              handleChange(itemId, "itemType", newItemType);
                              handleChange(
                                itemId,
                                "destination",
                                e.target.checked ? "" : "N/A"
                              );
                              if (e.target.checked && onSwitchInitiated) {
                                onSwitchInitiated(itemId);
                              }
                            }}
                            disabled={
                              isPreview ||
                              readOnly ||
                              allowItemTypeChange === false
                            }
                          />
                        </td>
                      )}
                      {showItemTypeAndDept && (
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          {request.itemType === "pettyCash" ? (
                            <Select
                              options={departmentOptions}
                              value={
                                departmentOptions.find(
                                  (option) =>
                                    option.value === request.destination
                                ) || null
                              }
                              onChange={(selected) =>
                                handleChange(
                                  itemId,
                                  "destination",
                                  selected?.value || ""
                                )
                              }
                              className="w-32 text-black"
                              styles={{
                                control: (provided) => ({
                                  ...provided,
                                  minWidth: "100px",
                                  fontSize: "14px",
                                  zIndex: 9999,
                                }),
                                menuPortal: (base) => ({
                                  ...base,
                                  zIndex: 9999,
                                }),
                              }}
                              menuPortalTarget={document.body}
                              menuPlacement="auto"
                              placeholder="Select "
                            />
                          ) : (
                            "N/A"
                          )}
                        </td>
                      )}
                      {showItemTypeAndDept && (
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          <input
                            type="checkbox"
                            checked={request.inStock || false}
                            onChange={(e) =>
                              handleChange(itemId, "inStock", e.target.checked)
                            }
                            disabled={
                              isPreview ||
                              readOnly ||
                              allowInStockChange === false ||
                              request.itemType === "pettyCash"
                            }
                            className={
                              request.itemType === "pettyCash"
                                ? "cursor-not-allowed"
                                : ""
                            }
                          />
                        </td>
                      )}
                      {showItemTypeAndDept && (
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          <select
                            value={request.logisticsType || "local"}
                            onChange={(e) =>
                              handleChange(
                                itemId,
                                "logisticsType",
                                e.target.value
                              )
                            }
                            disabled={
                              isPreview ||
                              readOnly ||
                              allowLogisticsChange === false ||
                              request.itemType === "pettyCash"
                            }
                            className={`border px-2 py-1 rounded-md w-32 text-black ${
                              request.itemType === "pettyCash" || isPreview
                                ? "bg-gray-200 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <option value="local">Local</option>
                            <option value="international">International</option>
                          </select>
                        </td>
                      )}
                      {showItemTypeAndDept && (
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={request.shippingQuantity || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "" || parseFloat(value) >= 0) {
                                handleChange(itemId, "shippingQuantity", value);
                              }
                            }}
                            className={`border px-2 py-1 rounded-md w-20 text-black ${
                              request.itemType === "pettyCash" ||
                              request.logisticsType === "local"
                                ? "bg-gray-200 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={
                              request.itemType === "pettyCash" ||
                              request.logisticsType === "local"
                            }
                            placeholder="0"
                          />
                        </td>
                      )}
                      {showUnitPrice && !loadingCurrencies && (
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          {allowPriceEditing ? (
                            <div className="flex items-center space-x-2">
                              <Select
                                options={currencies}
                                value={
                                  currencies.find(
                                    (c) =>
                                      c.value ===
                                      editedRequests.find(
                                        (item) => item.itemId === request.itemId
                                      )?.currency
                                  ) || null
                                }
                                onChange={(selectedOption) => {
                                  const newCurrency =
                                    selectedOption?.value || "";

                                  // ✅ UPDATE LOCAL STATE IMMEDIATELY
                                  setEditedRequests((prev) =>
                                    prev.map((item) =>
                                      item.itemId === request.itemId
                                        ? { ...item, currency: newCurrency }
                                        : item
                                    )
                                  );

                                  // Then call the debounced update
                                  handleChange(
                                    request.itemId,
                                    "currency",
                                    newCurrency
                                  );
                                }}
                                className={`w-32 ${
                                  request.itemType === "pettyCash"
                                    ? "bg-gray-200 cursor-not-allowed"
                                    : ""
                                }`}
                                styles={{
                                  control: (provided) => ({
                                    ...provided,
                                    minWidth: "80px",
                                    fontSize: "14px",
                                    zIndex: 500,
                                    backgroundColor:
                                      request.itemType === "pettyCash"
                                        ? "#e5e7eb"
                                        : provided.backgroundColor,
                                    cursor:
                                      request.itemType === "pettyCash"
                                        ? "not-allowed"
                                        : provided.cursor,
                                  }),
                                  menuPortal: (base) => ({
                                    ...base,
                                    zIndex: 9999,
                                  }),
                                }}
                                menuPortalTarget={document.body}
                                menuPlacement="auto"
                                isClearable
                                isDisabled={request.itemType === "pettyCash"}
                                placeholder="Select"
                              />
                              <input
                                type="number"
                                min="0"
                                className={`border px-2 py-1 rounded-md w-24 ${
                                  request.itemType === "pettyCash"
                                    ? "bg-gray-200 cursor-not-allowed"
                                    : ""
                                }`}
                                placeholder="Unit Price"
                                value={
                                  editedRequests.find(
                                    (item) => item.itemId === request.itemId
                                  )?.unitPrice || ""
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "" || parseFloat(value) >= 0) {
                                    handleChange(
                                      request.itemId,
                                      "unitPrice",
                                      value
                                    );
                                  }
                                }}
                                step="any"
                                disabled={request.itemType === "pettyCash"}
                              />
                            </div>
                          ) : (
                            <span
                              className={
                                request.itemType === "pettyCash"
                                  ? "text-gray-400"
                                  : ""
                              }
                            >
                              {`${request.unitPrice?.toFixed(2) || "0.00"} ${
                                request.currency || ""
                              }`}
                            </span>
                          )}
                        </td>
                      )}
                      {showUnitPrice && (
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          {allowPriceEditing ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={
                                  editedRequests.find(
                                    (item) => item.itemId === itemId
                                  )?.discount || ""
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (
                                    value === "" ||
                                    (parseFloat(value) >= 0 &&
                                      parseFloat(value) <= 100)
                                  ) {
                                    handleChange(itemId, "discount", value);
                                  }
                                }}
                                className={`border px-2 py-1 rounded-md w-16 text-black ${
                                  request.itemType === "pettyCash"
                                    ? "bg-gray-200 cursor-not-allowed"
                                    : ""
                                }`}
                                disabled={request.itemType === "pettyCash"}
                              />
                              <span>%</span>
                            </div>
                          ) : (
                            <span
                              className={
                                request.itemType === "pettyCash"
                                  ? "text-gray-400"
                                  : ""
                              }
                            >
                              {request.discount ? `${request.discount}%` : "0%"}
                            </span>
                          )}
                        </td>
                      )}
                      {showUnitPrice && showVat && (
                        <td className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900">
                          <input
                            type="checkbox"
                            checked={
                              editedRequests.find(
                                (item) => item.itemId === itemId
                              )?.vatted || false
                            }
                            onChange={(e) =>
                              handleChange(itemId, "vatted", e.target.checked)
                            }
                            disabled={
                              isPreview ||
                              readOnly ||
                              request.itemType === "pettyCash"
                            }
                            className={
                              request.itemType === "pettyCash" || isPreview
                                ? "cursor-not-allowed"
                                : ""
                            }
                          />
                        </td>
                      )}
                      {showUnitPrice && (
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          <span
                            className={
                              request.itemType === "pettyCash"
                                ? "text-gray-400"
                                : ""
                            }
                          >
                            {editedRequests.find(
                              (item) => item.itemId === itemId
                            )?.currency || "NGN"}{" "}
                            {Number(
                              editedRequests.find(
                                (item) => item.itemId === itemId
                              )?.total || 0
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>
                      )}
                      {showUnitPrice && showVat && (
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          style={{ minWidth: "100px" }}
                        >
                          <span
                            className={
                              request.itemType === "pettyCash"
                                ? "text-gray-400"
                                : ""
                            }
                          >
                            {editedRequests.find(
                              (item) => item.itemId === itemId
                            )?.currency || "NGN"}{" "}
                            {editedRequests.find(
                              (item) => item.itemId === itemId
                            )?.vatted
                              ? (
                                  (editedRequests.find(
                                    (item) => item.itemId === itemId
                                  )?.total /
                                    (1 + calculatedVat)) *
                                  calculatedVat
                                ).toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })
                              : "0.00"}
                          </span>
                        </td>
                      )}
                      {showPRN && getVendorInfo(request).isFirstRow && (
                        <td
                          className="border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-900"
                          rowSpan={getVendorInfo(request).rowspan}
                          style={{ verticalAlign: "middle" }}
                        >
                          {canEditPRN ? (
                            <input
                              type="text"
                              value={request.purchaseReqNumber || ""}
                              onChange={(e) => {
                                const newPRN = e.target.value;
                                setEditedRequests((prev) =>
                                  prev.map((itm) =>
                                    getVendorKey(itm) ===
                                    getVendorInfo(request).vendorKey
                                      ? { ...itm, purchaseReqNumber: newPRN }
                                      : itm
                                  )
                                );
                                vendorGroups[
                                  getVendorInfo(request).vendorKey
                                ].forEach((itm) => {
                                  onEditItem({
                                    ...itm,
                                    purchaseReqNumber: newPRN,
                                  });
                                });
                              }}
                              className="border px-2 py-1 rounded-md w-24"
                            />
                          ) : (
                            <span>{request.purchaseReqNumber || "N/A"}</span>
                          )}
                        </td>
                      )}
                      {showPON && (
                        <td className="border p-2 text-center">
                          {canEditPON ? (
                            <input
                              type="text"
                              value={
                                editedRequests.find(
                                  (item) => item.itemId === request.itemId
                                )?.purchaseOrderNumber || ""
                              }
                              onChange={(e) =>
                                handleChange(
                                  request.itemId,
                                  "purchaseOrderNumber",
                                  e.target.value
                                )
                              }
                              className={`border px-2 py-1 rounded-md w-24 ${
                                request.itemType === "pettyCash"
                                  ? "bg-gray-200 cursor-not-allowed"
                                  : ""
                              }`}
                            />
                          ) : (
                            request.purchaseOrderNumber || "N/A"
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {shouldShowShippingFeeForVendor(vendorGroup.items) && (
                <tbody>
                  <tr className="">
                    <td
                      colSpan={
                        (showItemTypeAndDept ? 7 : 4) +
                        (showUnitPrice ? 4 : 0) +
                        (showUnitPrice && showVat ? 2 : 0) +
                        (showPRN ? 1 : 0) +
                        (showPON ? 1 : 0) +
                        (allowEditing ? 1 : 0) -
                        1
                      }
                      className="border p-3 text-center font-bold"
                    >
                      Shipping Fee -{" "}
                      {vendorGroup.items[0]?.vendor || "No Vendor"}
                    </td>
                    <td className="border p-3 text-center">
                      <input
                        type="number"
                        value={
                          shippingFees[
                            vendorGroup.items[0]?.vendor || "No Vendor"
                          ] || ""
                        }
                        onChange={(e) => {
                          const vendor =
                            vendorGroup.items[0]?.vendor || "No Vendor";
                          const value =
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0;

                          // Update local state immediately
                          setShippingFees((prev) => ({
                            ...prev,
                            [vendor]: value,
                          }));

                          // Update all items with this vendor
                          const updates = editedRequests
                            .filter(
                              (item) => (item.vendor || "No Vendor") === vendor
                            )
                            .map((item) => ({
                              itemId: item.itemId,
                              changes: { shippingFee: value },
                            }));

                          // Call unified edit with debounce
                          clearTimeout(window.shippingFeeTimeout);
                          window.shippingFeeTimeout = setTimeout(() => {
                            handleUnifiedEdit(updates);
                          }, 5000);
                        }}
                        onFocus={(e) => {
                          if (
                            e.target.value === "0" ||
                            e.target.value === "0.00"
                          ) {
                            e.target.value = "";
                          }
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "") {
                            const vendor =
                              vendorGroup.items[0]?.vendor || "No Vendor";
                            setShippingFees((prev) => ({
                              ...prev,
                              [vendor]: 0,
                            }));
                          }
                        }}
                        className="border px-2 py-1 rounded-md w-24 text-black text-center"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        ))}
      </div>
      {deletionMode && deletingItem && (
        <>
          <textarea
            className="w-full border rounded-md p-2 text-black"
            placeholder="Enter reason for deleting this item..."
            value={deletionComment}
            onChange={(e) => setDeletionComment(e.target.value)}
          />
          <div className="flex gap-4 mt-2">
            <button
              className="bg-red-500 h-[40px] text-white px-4 py-2 rounded-md"
              onClick={() => {
                if (!deletingItem?.requestId || !deletingItem?.itemId) {
                  alert("❌ No item selected for deletion.");
                  return;
                }
                handleDeleteItem(
                  deletingItem.requestId,
                  deletingItem.itemId,
                  deletionComment
                );
                setDeletionMode(false);
                setDeletionComment("");
                setDeletingItem(null);
              }}
              disabled={isSubmittingDeletion}
            >
              {isSubmittingDeletion ? "Deleting..." : "Submit Deletion"}
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded-md"
              onClick={() => {
                setDeletionMode(false);
                setDeletionComment("");
                setDeletingItem(null);
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    
      <div className="flex flex-col justify-between mt-4 space-x-4">
        <div className="flex justify-between mb-4">
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center"
            onClick={() => {
              document.querySelector(
                ".overflow-x-auto table"
              ).parentElement.scrollLeft -= 100;
            }}
          >
            ◄
          </button>
          <button
            className="text-[#F8F8FF] text-lg h-[40px] px-2 rounded-md bg-[#11181c] flex items-center"
            onClick={() => {
              document.querySelector(
                ".overflow-x-auto table"
              ).parentElement.scrollLeft += 100;
            }}
          >
            ►
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcurementTable;
