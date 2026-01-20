import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import { useAuth } from "../../context/AuthContext";

const formatNoDecimals = (currency, value) => {
  const n = Number(value) || 0;
  return `${currency} ${n.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
};

const ItemSelectionTable = ({
  items = [],
  onQuantityChange = () => {},
  onRemoveItem = () => {},
  onFieldChange = () => {},
  onUnitPriceChange = () => {},
  onCurrencyChange = () => {},
  currencies = [],
  isPettyCash = false,
  department = "",
  vendors = [],
}) => {
  if (!items || items.length === 0) return null;

  const { getToken } = useAuth();
  const scrollRef = useRef(null);
  const [vatRate, setVatRate] = useState(0.075);
  const [vendorOptions, setVendorOptions] = useState([]);

  // Determine if we should show enhanced table
  const showEnhancedTable = isPettyCash && department?.toLowerCase() === "admin";

  // Fetch VAT rate
  useEffect(() => {
    if (!showEnhancedTable) return;
    
    const fetchVat = async () => {
      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(
          "https://hdp-backend-1vcl.onrender.com/api/vat",
          { headers }
        );
        const value = resp?.data?.value;
        setVatRate(typeof value === "number" ? value / 100 : 0.075);
      } catch (error) {
        setVatRate(0.075);
      }
    };
    fetchVat();
  }, [showEnhancedTable, getToken]);

  // Fetch vendors
  useEffect(() => {
    if (!showEnhancedTable) return;

  const fetchVendors = async () => {
  try {
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const resp = await axios.get(
      "https://hdp-backend-1vcl.onrender.com/api/vendors",
      { headers }
    );
    const data = resp.data?.data || resp.data || [];
    setVendorOptions(
      data.map((v) => ({
        value: v.vendorId || v._id, // <-- Store vendorId as value
        label: v.name,
        vendorName: v.name, // <-- Store name separately
      }))
    );
  } catch (err) {
    setVendorOptions([]);
  }
};
    fetchVendors();
  }, [showEnhancedTable, getToken]);

  const scrollTable = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "right" ? 300 : -300,
        behavior: "smooth",
      });
    }
  };

  // Enhanced table handlers
  const handleVatChange = (index, checked) => {
    if (onFieldChange) {
      onFieldChange(index, "vatted", checked);
    }
  };

  const handleDiscountChange = (index, value) => {
    if (onFieldChange) {
      onFieldChange(index, "discount", Number(value) || 0);
    }
  };

  const handleLogisticsTypeChange = (index, value) => {
    if (onFieldChange) {
      onFieldChange(index, "logisticsType", value);
    }
  };

  const handleVendorChange = (index, value) => {
    if (onFieldChange) {
      onFieldChange(index, "vendor", value);
    }
  };

  // ENHANCED TABLE (for pettyCash + Admin)
  if (showEnhancedTable) {
    return (
      <div className="relative w-full">
        <div
          ref={scrollRef}
          className="mt-4 overflow-x-auto custom-scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch", maxWidth: "100%" }}
        >
          <table className="w-full min-w-[1200px] border-collapse border-2 border-slate-200 rounded-lg overflow-hidden table-auto">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[80px]">
                  SN
                </th>
                <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[320px]">
                  Description
                </th>
                <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">
                  Item Type
                </th>
                <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">
                  Maker
                </th>
                <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[180px]">
                  Maker's Part No
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[160px]">
                  Logistics Type
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
                  Shipping Quantity
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
                  Shipping Fee
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[200px]">
                  Vendor
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
                  Quantity
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[170px]">
                  Unit Price
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">
                  Currency
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[80px]">
                  VAT
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[110px]">
                  VAT Amount
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[110px]">
                  Discount (%)
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
                  Total
                </th>
                <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[110px]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const key = item.uniqueId || item._id || index;
                const qty = Number(item.quantity || 0);
                const unit = Number(item.unitPrice || 0);
                const discount = Number(item.discount || 0);
                const vatted = !!item.vatted;
                const currency = item.currency || "NGN";
                const currentVatRate = vatted ? vatRate : 0;
                const logisticsType = item.logisticsType || "local";
                const vendor = item.vendor || "";

                // Calculate total
                let total = qty * unit;
                if (discount > 0) total = total - (total * discount) / 100;
                const vatAmount = vatted ? total * currentVatRate : 0;
                total = total + vatAmount;

                return (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-200 p-3 text-center text-sm font-medium text-slate-900">
                      {index + 1}
                    </td>
                    <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[220px] break-words whitespace-normal">
                      {item.isNew ? (
                        <textarea
                          value={item.name}
                          onChange={(e) =>
                            onFieldChange(index, "name", e.target.value)
                          }
                          placeholder="Description"
                          className="w-full px-2 py-1 border border-slate-300 rounded-md resize-y min-h-[38px] break-words whitespace-pre-line"
                          required
                        />
                      ) : (
                        <span className="break-words whitespace-pre-line">
                          {item.name || "N/A"}
                        </span>
                      )}
                    </td>
                    <td className="border border-slate-200 p-3 text-sm text-slate-700 max-w-[100px]">
                      {item.isNew ? (
                        <input
                          type="text"
                          value={item.itemType}
                          onChange={(e) =>
                            onFieldChange(index, "itemType", e.target.value)
                          }
                          placeholder="Item Type"
                          className="w-full px-2 py-1 border border-slate-300 rounded-md"
                        />
                      ) : (
                        item.itemType || item.makersType || "N/A"
                      )}
                    </td>
                    <td className="border border-slate-200 p-3 text-sm text-slate-700 max-w-[150px]">
                      {item.isNew ? (
                        <input
                          type="text"
                          value={item.maker}
                          onChange={(e) =>
                            onFieldChange(index, "maker", e.target.value)
                          }
                          placeholder="Maker"
                          className="w-full px-2 py-1 border border-slate-300 rounded-md"
                        />
                      ) : (
                        item.maker || "N/A"
                      )}
                    </td>
                    <td className="border border-slate-200 p-3 text-sm text-slate-700 max-w-[180px]">
                      {item.isNew ? (
                        <input
                          type="text"
                          value={item.makersPartNo}
                          onChange={(e) =>
                            onFieldChange(index, "makersPartNo", e.target.value)
                          }
                          placeholder="Maker's Part No"
                          className="w-full px-2 py-1 border border-slate-300 rounded-md"
                        />
                      ) : (
                        item.makersPartNo || "N/A"
                      )}
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <select
                        value={logisticsType}
                        onChange={(e) =>
                          handleLogisticsTypeChange(index, e.target.value)
                        }
                        className="w-36 px-2 py-1 border border-slate-300 rounded-md text-center"
                      >
                        <option value="local">Local</option>
                        <option value="international">International</option>
                      </select>
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.shippingQuantity ?? 0}
                        placeholder="0"
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = "";
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "")
                            onFieldChange(index, "shippingQuantity", 0);
                        }}
                        onChange={(e) =>
                          onFieldChange(
                            index,
                            "shippingQuantity",
                            Number(e.target.value) || 0
                          )
                        }
                        disabled={item.logisticsType !== "international"}
                        className={`w-20 px-2 py-1 border border-slate-300 rounded-md text-center ${
                          item.logisticsType !== "international"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : ""
                        }`}
                        style={{
                          pointerEvents:
                            item.logisticsType !== "international"
                              ? "none"
                              : "auto",
                        }}
                      />
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.shippingFee ?? 0}
                        placeholder="0"
                        onFocus={(e) => {
                          if (e.target.value === "0") e.target.value = "";
                        }}
                        onBlur={(e) => {
                          if (e.target.value === "")
                            onFieldChange(index, "shippingFee", 0);
                        }}
                        onChange={(e) =>
                          onFieldChange(
                            index,
                            "shippingFee",
                            Number(e.target.value) || 0
                          )
                        }
                        disabled={item.logisticsType !== "international"}
                        className={`w-24 px-2 py-1 border border-slate-300 rounded-md text-center ${
                          item.logisticsType !== "international"
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : ""
                        }`}
                        style={{
                          pointerEvents:
                            item.logisticsType !== "international"
                              ? "none"
                              : "auto",
                        }}
                      />
                    </td>
                    <td className="border border-slate-200 p-3 text-center min-w-[200px]">
                      <CreatableSelect
                     isClearable
  options={vendorOptions}
  value={
    item.vendorId
      ? vendorOptions.find((v) => v.value === item.vendorId) ||
        { value: item.vendorId, label: item.vendorName || item.vendorId }
      : null
  }
                  onChange={(selected) => {
  if (selected) {
    // Store both vendorId and vendorName
    onFieldChange(index, "vendorId", selected.value);
    onFieldChange(index, "vendorName", selected.vendorName || selected.label);
    
    if (selected.__isNew__) {
      // If it's a new vendor (not in the list), we don't have a vendorId yet
      // So just store the name and let backend handle it
      setVendorOptions((prev) => [
        ...prev,
        { value: selected.value, label: selected.value, vendorName: selected.value },
      ]);
    }
  } else {
    // Clear vendor
    onFieldChange(index, "vendorId", "");
    onFieldChange(index, "vendorName", "");
  }
}}
                        placeholder="Select vendor"
                        classNamePrefix="react-select"
  styles={{
    control: (provided) => ({
      ...provided,
      minWidth: "100px",
      fontSize: "12px",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  }}
  menuPortalTarget={
    typeof document !== "undefined" ? document.body : null
  }
                      />
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity || 1}
                        onChange={(e) =>
                          onQuantityChange(index, Number(e.target.value) || 1)
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice || ""}
                        onChange={(e) =>
                          onUnitPriceChange(index, Number(e.target.value) || 0)
                        }
                        className="w-24 px-2 py-1 border border-slate-300 rounded-md text-center"
                      />
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <select
                        value={currency}
                        onChange={(e) =>
                          onCurrencyChange(index, e.target.value)
                        }
                        className="w-20 px-2 py-1 border border-slate-300 rounded-md text-center"
                      >
                        {currencies.map((cur) => (
                          <option key={cur.value || cur} value={cur.value || cur}>
                            {cur.label || cur}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <input
                        type="checkbox"
                        checked={vatted}
                        onChange={(e) => handleVatChange(index, e.target.checked)}
                      />
                    </td>
                    <td className="border border-slate-200 p-3 text-center text-sm font-semibold text-slate-900">
                      {formatNoDecimals(currency, vatAmount)}
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={discount}
                        onChange={(e) =>
                          handleDiscountChange(index, Number(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md text-center"
                      />
                    </td>
                    <td className="border border-slate-200 p-3 text-center text-sm font-semibold text-slate-900">
                      {formatNoDecimals(currency, total)}
                    </td>
                    <td className="border border-slate-200 p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors duration-200"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

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
      </div>
    );
  }

  // SIMPLE TABLE (default)
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse border-2 border-slate-200 rounded-lg overflow-hidden table-fixed">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[50px]">
              SN
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-[200px] md:w-[300px]">
              Description
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
              Item Type
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[120px]">
              Maker
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">
              Maker's Part No
            </th>
            <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">
              Quantity
            </th>
            <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[100px]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const key = item.uniqueId || item._id || index;

            return (
              <tr key={key} className="hover:bg-slate-50 transition-colors">
                <td className="border border-slate-200 p-3 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>
                <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                  {item.isNew ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        onFieldChange &&
                        onFieldChange(index, "name", e.target.value)
                      }
                      placeholder="Description"
                      className="w-full px-2 py-1 border border-slate-300 rounded-md"
                      required
                    />
                  ) : (
                    item.name || "N/A"
                  )}
                </td>
                <td className="border border-slate-200 p-3 text-sm text-slate-700">
                  {item.isNew ? (
                    <input
                      type="text"
                      value={item.itemType}
                      onChange={(e) =>
                        onFieldChange &&
                        onFieldChange(index, "itemType", e.target.value)
                      }
                      placeholder="Item Type"
                      className="w-full px-2 py-1 border border-slate-300 rounded-md"
                    />
                  ) : (
                    item.itemType || item.makersType || "N/A"
                  )}
                </td>
                <td className="border border-slate-200 p-3 text-sm text-slate-700">
                  {item.isNew ? (
                    <input
                      type="text"
                      value={item.maker}
                      onChange={(e) =>
                        onFieldChange &&
                        onFieldChange(index, "maker", e.target.value)
                      }
                      placeholder="Maker"
                      className="w-full px-2 py-1 border border-slate-300 rounded-md"
                    />
                  ) : (
                    item.maker || "N/A"
                  )}
                </td>
                <td className="border border-slate-200 p-3 text-sm text-slate-700">
                  {item.isNew ? (
                    <input
                      type="text"
                      value={item.makersPartNo}
                      onChange={(e) =>
                        onFieldChange &&
                        onFieldChange(index, "makersPartNo", e.target.value)
                      }
                      placeholder="Maker's Part No"
                      className="w-full px-2 py-1 border border-slate-300 rounded-md"
                    />
                  ) : (
                    item.makersPartNo || "N/A"
                  )}
                </td>
                <td className="border border-slate-200 p-3 text-center">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity || 1}
                    onChange={(e) =>
                      onQuantityChange(index, Number(e.target.value) || 1)
                    }
                    className="w-20 px-2 py-1 border border-slate-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </td>
                <td className="border border-slate-200 p-3 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ItemSelectionTable;