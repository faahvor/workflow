import axios from "axios";
import React, { useEffect,useState, useRef } from "react";
import CreatableSelect from "react-select/creatable";
import { useAuth } from "../../context/AuthContext";

// Helper for formatting currency
const formatNoDecimals = (currency, value) => {
  const n = Number(value) || 0;
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

const ProcurementSelectionTable = ({
  items = [],
  onFieldChange = () => {},
  onQuantityChange = () => {},
  onRemoveItem = () => {},
  onUnitPriceChange = () => {},
  onCurrencyChange = () => {},
  onVatChange = () => {},
  onDiscountChange = () => {},
  onLogisticsTypeChange = () => {},
  onVendorChange = () => {},
  vendors = [],
  currencies = [],
}) => {
  if (!items || items.length === 0) return null;
  const scrollRef = useRef(null);
  const [vendorOptions, setVendorOptions] = useState([]);

const { getToken } = useAuth();

useEffect(() => {
  const fetchVendors = async () => {
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get("https://hdp-backend-1vcl.onrender.com/api/vendors", { headers });
      const data = resp.data?.data || resp.data || [];
      setVendorOptions(
        data.map((v) => ({
          value: v.name,
          label: v.name,
        }))
      );
    } catch (err) {
      setVendorOptions([]);
    }
  };
  fetchVendors();
}, [getToken]);

const scrollTable = (direction) => {
  if (scrollRef.current) {
    scrollRef.current.scrollBy({
      left: direction === "right" ? 300 : -300,
      behavior: "smooth",
    });
  }
};

  return (

    <div className="relative w-full">
 <div
  ref={scrollRef}
  className="mt-4 overflow-x-auto custom-scrollbar-hide"
  style={{ WebkitOverflowScrolling: "touch", maxWidth: "100%" }}
>
      <table className="w-full min-w-[2300px] border-collapse border-2 border-slate-200 rounded-lg overflow-hidden table-fixed">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[80px]">
              SN
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[220px]">
              Description
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">
              Item Type
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[150px]">
              Maker
            </th>
            <th className="border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[180px]">
              Maker's Part No
            </th>
             <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[140px]">
              Logistics Type
            </th>
            <th className="border border-slate-200 p-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[380px]">
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
            const vatRate = vatted ? 0.075 : 0;
            const logisticsType = item.logisticsType || "local";
            const vendor = item.vendor || "";

            // Calculate total
            let total = qty * unit;
            if (discount > 0) total = total - (total * discount) / 100;
            if (vatted) total = total + total * vatRate;

            return (
              <tr key={key} className="hover:bg-slate-50 transition-colors">
                <td className="border border-slate-200 p-3 text-center text-sm font-medium text-slate-900">
                  {index + 1}
                </td>
                <td className="border border-slate-200 p-3 text-sm text-slate-900 max-w-[220px] break-words whitespace-normal">
                  {item.isNew ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
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
                <td className="border border-slate-200 p-3 text-sm text-slate-700 max-w-[150px]">
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
                      onLogisticsTypeChange(index, e.target.value)
                    }
                    className="w-28 px-2 py-1 border border-slate-300 rounded-md text-center"
                  >
                    <option value="local">Local</option>
                    <option value="international">International</option>
                  </select>
                </td>

              <td className="border border-slate-200 p-3 text-center min-w-[200px]">
  <CreatableSelect
    isClearable
    options={vendorOptions}
    value={
      vendor
        ? { value: vendor, label: vendor }
        : null
    }
    onChange={(selected) => {
      onVendorChange(index, selected ? selected.value : "");
      // If new vendor, add to local options for immediate selection
      if (selected && selected.__isNew__) {
        setVendorOptions((prev) => [
          ...prev,
          { value: selected.value, label: selected.value },
        ]);
      }
    }}
    placeholder="Select vendor"
    classNamePrefix="react-select"
    styles={{
      control: (provided) => ({
        ...provided,
        minWidth: "130px",
        fontSize: "12px",
      }),
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    }}
    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
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
                    onChange={(e) => onCurrencyChange(index, e.target.value)}
                    className="w-20 px-2 py-1 border border-slate-300 rounded-md text-center"
                  >
                    {currencies.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border border-slate-200 p-3 text-center">
                  <input
                    type="checkbox"
                    checked={vatted}
                    onChange={(e) => onVatChange(index, e.target.checked)}
                  />
                </td>
                <td className="border border-slate-200 p-3 text-center">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={discount}
                    onChange={(e) =>
                      onDiscountChange(index, Number(e.target.value) || 0)
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
};

export default ProcurementSelectionTable;