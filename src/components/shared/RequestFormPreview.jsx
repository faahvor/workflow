import React, { forwardRef, useEffect, useState } from "react";
import axios from "axios";
import { MdShoppingCart } from "react-icons/md";

const formatCurrency = (v, currency = "NGN") => {
  const n = Number(v || 0).toFixed(2);
  return `${currency} ${Number(n).toLocaleString()}`;
};

const getVendorDisplayName = (vendorOrName) => {
  if (!vendorOrName) return "";
  if (typeof vendorOrName === "string") return vendorOrName;
  if (typeof vendorOrName === "object") {
    return (
      vendorOrName.name ||
      vendorOrName.vendorName ||
      vendorOrName.vendor ||
      vendorOrName.vendorId ||
      vendorOrName.id ||
      ""
    );
  }
  return String(vendorOrName);
};

const getVendorAddressLines = (v) => {
  if (!v) return null;
  const address = v.address;
  if (!address) return null;
  if (typeof address === "string") return address;
  const street = address.street || address.line1 || address.address1 || "";
  const city = address.city || address.town || "";
  const state = address.state || address.region || "";
  const parts = [street, city, state].filter(Boolean);
  return parts.length ? parts.join("\n") : null;
};

const RequestFormPreview = forwardRef(
  (
    {
      request = {},
      items = [],
      requestId = null,
      token = null,
      apiBase = import.meta.env.VITE_API_BASE_URL,
      hideSignatures = false,
    },
    ref
  ) => {
    const [liveRequest, setLiveRequest] = useState(request || {});
    const [liveItems, setLiveItems] = useState(items || []);
    const [vendorInfo, setVendorInfo] = useState(null);
    const [signaturesPrepared, setSignaturesPrepared] = useState([]);
    const [loading, setLoading] = useState(false);
    const [vessels, setVessels] = useState([]);

    function isProcurementOfficerApproved(req) {
      const history = req?.history || [];
      return history.some(
        (h) =>
          h.action === "APPROVE" &&
          h.role === "Procurement Officer" &&
          h.info === "Procurement Officer Approved"
      );
    }

    useEffect(() => {
      const fetchVessels = async () => {
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const resp = await axios.get(`${apiBase}/vessels?limit=100`, {
            headers,
          });
          setVessels(resp.data?.data || []);
        } catch (err) {
          setVessels([]);
        }
      };
      fetchVessels();
    }, [apiBase, token]);

    // Helper to get vessel name by id
    const getVesselName = (vesselId) => {
      if (!vesselId) return "";
      const vessel = vessels.find((v) => v.vesselId === vesselId);
      return vessel?.name || vesselId || "";
    };

    const arrayBufferToBase64 = (buffer) => {
      let binary = "";
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };

    const fetchImageAsDataUrl = async (url) => {
      if (!url) return null;
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(url, {
          responseType: "arraybuffer",
          headers,
        });
        const contentType =
          resp.headers && resp.headers["content-type"]
            ? resp.headers["content-type"]
            : "image/png";
        const base64 = arrayBufferToBase64(resp.data);
        return `data:${contentType};base64,${base64}`;
      } catch (err) {
        return url;
      }
    };

    useEffect(() => {
      let mounted = true;

      const load = async () => {
        setLoading(true);
        try {
          let sourceRequest = request || {};
          let sourceItems = Array.isArray(items) ? items.slice() : [];

          if (requestId) {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const resp = await axios.get(
              `${apiBase}/requests/${encodeURIComponent(requestId)}`,
              { headers }
            );
            sourceRequest = resp.data?.data ?? resp.data ?? {};
            sourceItems = Array.isArray(sourceRequest.items)
              ? sourceRequest.items
              : items || [];
          }

          if (!mounted) return;
          setLiveRequest(sourceRequest || {});
          setLiveItems(sourceItems || []);

          const firstItem =
            Array.isArray(sourceItems) && sourceItems.length
              ? sourceItems[0]
              : null;
          if (firstItem && firstItem.vendor) {
            if (typeof firstItem.vendor === "object") {
              setVendorInfo(firstItem.vendor);
            } else {
              try {
                const headers = token
                  ? { Authorization: `Bearer ${token}` }
                  : {};
                const vResp = await axios.get(
                  `${apiBase}/vendors/${encodeURIComponent(firstItem.vendor)}`,
                  { headers }
                );
                if (!mounted) return;
                setVendorInfo(vResp.data?.data ?? vResp.data ?? null);
              } catch (verr) {
                setVendorInfo(null);
              }
            }
          } else if (firstItem && firstItem.vendorId) {
            try {
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const vResp = await axios.get(
                `${apiBase}/vendors/${encodeURIComponent(firstItem.vendorId)}`,
                { headers }
              );
              if (!mounted) return;
              setVendorInfo(vResp.data?.data ?? vResp.data ?? null);
            } catch (verr) {
              setVendorInfo(null);
            }
          } else {
            setVendorInfo(null);
          }

          const rawSignatures = Array.isArray(sourceRequest.signatures)
            ? sourceRequest.signatures.slice()
            : [];
          rawSignatures.sort((a, b) => {
            const ta = a.timestamp || a.time || a.createdAt || 0;
            const tb = b.timestamp || b.time || b.createdAt || 0;
            return new Date(ta).getTime() - new Date(tb).getTime();
          });

          const prepared = await Promise.all(
            rawSignatures.map(async (s) => {
              const img = s.signatureUrl
                ? await fetchImageAsDataUrl(s.signatureUrl)
                : null;
              return {
                userId: s.userId,
                name:
                  s.name ||
                  s.userName ||
                  s.displayName ||
                  s.requesterName ||
                  "",
                role: s.role || s.position || "",
                timestamp: s.timestamp || s.time || s.createdAt || null,
                signatureUrl: s.signatureUrl || null,
                imageData: img,
              };
            })
          );

          if (!mounted) return;
          setSignaturesPrepared(prepared);
        } catch (err) {
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();
      return () => {
        mounted = false;
      };
    }, [requestId, request, items, token, apiBase]);

    const req = liveRequest || {};
    const usedItems =
  Array.isArray(liveItems) && liveItems.length > 0
        ? liveItems
        : req.containsDuplicateItems === true
        ? req.items || items || []
        : Array.isArray(req.originalItemsSnapshot) &&
          req.originalItemsSnapshot.length > 0 &&
          isAtOrPastProcurementManager(req)
        ? req.originalItemsSnapshot
        : items || [];
    const reqIdStr = req.requestId || req.id || requestId || "N/A";
    const createdAt = req.createdAt ? new Date(req.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString();
    const requiredDate =
      req.requiredDate ||
      new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString();
    const reference = req.reference || "N/A";
    const grandTotal = usedItems.reduce((s, it) => {
      const total =
        it.totalPrice !== undefined
          ? Number(it.totalPrice)
          : it.total !== undefined
          ? Number(it.total)
          : Number(it.unitPrice || 0) * Number(it.quantity || 0);
      return s + (isNaN(total) ? 0 : total);
    }, 0);

    const vendorNameLine = vendorInfo
      ? getVendorDisplayName(vendorInfo)
      : usedItems[0]
      ? getVendorDisplayName(usedItems[0].vendor || usedItems[0].vendorName)
      : "";

    const addressPart =
      vendorInfo && vendorInfo.address
        ? getVendorAddressLines(vendorInfo)
        : usedItems[0] &&
          usedItems[0].vendor &&
          typeof usedItems[0].vendor === "object"
        ? getVendorAddressLines(usedItems[0].vendor)
        : null;

    // ✅ ADD: Tag-based fee columns logic
    const tagLower = String(req.tag || "").toLowerCase();
    const isShippingTag = tagLower === "shipping";
    const isClearingTag = tagLower === "clearing";
    const showFeeColumns = isShippingTag || isClearingTag;

    // Get current state robustly
    const currentState =
      req.currentState ||
      (req.flow && req.flow.currentState) ||
      req.status ||
      "";

    const showPriceColumns = [
      "PENDING_PROCUREMENT_OFFICER_APPROVAL",
      "PENDING_PROCUREMENT_MANAGER_APPROVAL",
      "PENDING_FINANCE_APPROVAL",
      "PENDING_MD_APPROVAL",
      "COMPLETED",
      "APPROVED",
      "REJECTED",
    ].includes(currentState);

    const isInStock = req.requestType === "inStock";

    let filteredSignatures = signaturesPrepared;
    
if (req.containsDuplicateItems === true) {
  filteredSignatures = signaturesPrepared;
} else {
    // If marine department/destination, filter to allowed roles
    if (
      (String(req.department || "").toLowerCase() === "marine" ||
        String(req.department || "").toLowerCase() === "freight") &&
      (String(req.destination || "").toLowerCase() === "marine" ||
        String(req.destination || "").toLowerCase() === "freight")
    ) {
      const allowedRoles = [
        "requester",
        "vesselmanager",
        "Requester",
        "Vessel Manager",
        "Vessel Manager",
      ];
      filteredSignatures = signaturesPrepared.filter((s) =>
        allowedRoles.includes(String(s.role).trim())
      );
    }
    if (
      (String(req.department || "").toLowerCase() === "project" ||
        String(req.department || "").toLowerCase() === "freight") &&
      (String(req.destination || "").toLowerCase() === "project" ||
        String(req.destination || "").toLowerCase() === "freight")
    ) {
      const allowedRoles = [
        "requester",
        "project manager",
        "Requester",
        "Project Manager",
      ];
      filteredSignatures = signaturesPrepared.filter((s) =>
        allowedRoles.includes(String(s.role).trim())
      );
    }
    if (
      (String(req.department || "").toLowerCase() === "legal" ||
        String(req.department || "").toLowerCase() === "freight") &&
      (String(req.destination || "").toLowerCase() === "legal" ||
        String(req.destination || "").toLowerCase() === "freight")
    ) {
      const allowedRoles = [
        "requester",
        "legal head",
        "Requester",
        "Legal Head",
      ];
      filteredSignatures = signaturesPrepared.filter((s) =>
        allowedRoles.includes(String(s.role).trim())
      );
    }
    if (
      (String(req.department || "").toLowerCase() === "admin" ||
        String(req.department || "").toLowerCase() === "freight") &&
      (String(req.destination || "").toLowerCase() === "admin" ||
        String(req.destination || "").toLowerCase() === "freight")
    ) {
      const allowedRoles = [
        "requester",
        "director of admin",
        "Requester",
        "Director of Admin",
      ];
      filteredSignatures = signaturesPrepared.filter((s) =>
        allowedRoles.includes(String(s.role).trim())
      );
    }
    if (
      (String(req.department || "").toLowerCase() === "hr" ||
        String(req.department || "").toLowerCase() === "freight") &&
      (String(req.destination || "").toLowerCase() === "hr" ||
        String(req.destination || "").toLowerCase() === "freight")
    ) {
      const allowedRoles = [
        "requester",
        "hr manager",
        "Requester",
        "HR Manager",
      ];
      filteredSignatures = signaturesPrepared.filter((s) =>
        allowedRoles.includes(String(s.role).trim())
      );
    }
    if (
      (String(req.department || "").toLowerCase() === "operations" ||
        String(req.department || "").toLowerCase() === "freight") &&
      (String(req.destination || "").toLowerCase() === "operations" ||
        String(req.destination || "").toLowerCase() === "freight")
    ) {
      const allowedRoles = [
        "requester",
        "operations manager",
        "equipment manager",
        "Requester",
        "Operations Manager",
        "Equipment Manager",
      ];
      filteredSignatures = signaturesPrepared.filter((s) =>
        allowedRoles.includes(String(s.role).trim())
      );
    }

    // If inStock, always include procurement manager, store base, store jetty, store vessel signatures
    if (isInStock) {
      const extraRoles = [
        "procurementmanager",
        "storebase",
        "storejetty",
        "storevessel",
      ];
      const extraSignatures = signaturesPrepared.filter((s) =>
        extraRoles.includes(
          String(s.role || "")
            .toLowerCase()
            .replace(/\s/g, "")
        )
      );
      // Add any extra signatures not already in filteredSignatures
      const filteredIds = new Set(filteredSignatures.map((s) => s.userId));
      extraSignatures.forEach((sig) => {
        if (!filteredIds.has(sig.userId)) {
          filteredSignatures.push(sig);
        }
      });
    }
    if (req.requestType === "pettyCash") {
      const extraRoles = ["accountinglead", "accountingofficer", "cfo"];
      const extraSignatures = signaturesPrepared.filter((s) =>
        extraRoles.includes(
          String(s.role || "")
            .toLowerCase()
            .replace(/\s/g, "")
        )
      );
      const filteredIds = new Set(filteredSignatures.map((s) => s.userId));
      extraSignatures.forEach((sig) => {
        if (!filteredIds.has(sig.userId)) {
          filteredSignatures.push(sig);
        }
      });
    }
  }

    const isServicePettyCash = (req) =>
      req?.isService === true &&
      (req?.requestType || "").toLowerCase() === "pettycash";
    return (
      <div
        ref={ref}
        className="bg-white px-12 md:px-16 lg:px-20 print:px-8 py-6 text-slate-900 max-w-5xl mx-auto"
      >
        <div className="text-center mb-2">
          <div className="mx-auto w-42 h-16 flex items-center justify-center rounded-lg overflow-hidden ">
            <img
              src={req.company?.logoUrl || "/logo.png"}
              alt={req.company?.name || "Company Logo"}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/logo.png";
              }}
            />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold leading-tight">
              Hydrodive Nigeria Ltd
            </div>
            <div className="text-sm text-slate-500 mt-1 leading-relaxed">
              17, Wharf Road Apapa, Lagos,Nigeria.
            </div>
          </div>
        </div>

        <div className="bg-white/90 border-2 border-slate-200 rounded-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Request Details
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Request ID
              </p>
              <p className="text-sm text-slate-900 font-semibold font-mono">
                {reqIdStr}
              </p>
            </div>
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Company
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {(req.company && req.company.name) ||
                  req.companyName ||
                  "HWFP Marine Services"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Requester
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {typeof req.requester === "object"
                  ? req.requester.displayName || req.requester.name
                  : req.requester || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Department
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {req.department || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Destination
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {req.destination || req.destinationPort || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Vessel
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {vessels.length > 0 ? getVesselName(req.vesselId) || "N/A" : ""}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5 t">
                Submitted Date/Time
              </p>
              <div className="text-sm text-slate-900 font-semibold flex gap-2 ">
                <p> {createdAt.toLocaleDateString()} </p>
                <p>
                  {" "}
                  {createdAt.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {isServicePettyCash(req) ? (
              <div className="px-4 py-3 border-b border-r border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  Request
                </p>
                <p className="text-sm font-semibold">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                    Service
                  </span>
                </p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Request Type
                  </p>
                  <p className="text-sm font-semibold">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                      {req.requestType === "inStock"
                        ? "INSTOCK"
                        : isProcurementOfficerApproved(req)
                        ? req.requestType === "purchaseOrder" ||
                          req.type === "purchase-order"
                          ? "Purchase Order"
                          : req.requestType === "pettyCash"
                          ? "Petty Cash"
                          : req.requestType || "N/A"
                        : "N/A"}
                    </span>
                  </p>
                </div>
                <div className="px-4 py-3 border-r border-b  border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Logistics Type
                  </p>
                  <p className="text-sm text-slate-900 font-semibold capitalize">
                    {req.logisticsType || "N/A"}
                  </p>
                </div>
              </>
            )}
            <div className="px-4 py-3 border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Asset ID
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {req.assetId || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium ">Reference</p>
              <p className="text-sm font-semibold text-left">
                <span className={`inline-block   rounded text-xs capitalize `}>
                                 {req.reference || "N/A"}

                </span>
              </p>
            </div>

            {String(req.destination || "").toLowerCase() === "marine" ? (
              <div className="px-4 py-3 border-r border-b  border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  OffShore Number
                </p>
                <p className="text-sm font-semibold">
                  <span className="inline-block  py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                    {req.offshoreReqNumber || "N/A"}
                  </span>
                </p>
              </div>
            ) : (
              <div className="px-4 py-3 border-r border-b  border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-0.5">
                  Job Number
                </p>
                <p className="text-sm font-semibold">
                  <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                    {req.jobNumber || "N/A"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MdShoppingCart /> Requested Items
          </h3>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-3">
            <div className="overflow-x-auto">
              {isServicePettyCash(req) ? (
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-3 mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left text-xs text-slate-500">
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usedItems.map((it, i) => (
                          <tr
                            key={it.itemId || it.id || i}
                            className="border-b last:border-b-0 border-slate-200"
                          >
                            <td className="px-3 py-2 align-top">{i + 1}</td>
                            <td className="px-3 py-2 align-top text-slate-900 max-w-[180px] md:max-w-[180px] break-words whitespace-normal">
                              {it.name}
                            </td>
                            <td className="px-3 py-2 align-top font-semibold text-slate-900">
                              NGN{" "}
                              {Number(
                                it.unitPrice || it.amount || 0
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left text-xs text-slate-500">
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Qty</th>

                      {/* ✅ Shipping Qty - only for shipping/clearing */}
                      {showFeeColumns && (
                        <th className="px-3 py-2 text-center">Shipping Qty</th>
                      )}

                      {/* ✅ Shipping Fee - only for shipping/clearing */}
                      {/* {showFeeColumns && (
                      <th className="px-3 py-2 text-right">Shipping Fee</th>
                    )} */}

                      {/* ✅ Clearing Fee - only for clearing */}
                      {/* {isClearingTag && (
                      <th className="px-3 py-2 text-right">Clearing Fee</th>
                    )} */}

                      {/* ✅ Unit Price - hide for shipping/clearing and before procurement */}
                      {/* {!showFeeColumns && showPriceColumns && !isInStock && (
                      <th className="px-3 py-2 text-right">Unit Price</th>
                    )}
                    {!showFeeColumns && showPriceColumns && !isInStock && (
                      <th className="px-3 py-2 text-right">Total</th>
                    )} */}
                    </tr>
                  </thead>
                  <tbody>
                    {usedItems.map((it, i) => (
                      <tr
                        key={it.itemId || it.id || i}
                        className="border-b last:border-b-0 border-slate-200"
                      >
                        <td className="px-3 py-2 align-top">{i + 1}</td>
                        <td className="px-3 py-2 align-top text-slate-900  max-w-[180px] md:max-w-[180px] break-words whitespace-normal">
                          {it.name}
                        </td>
                        <td className="px-3 py-2 align-top">{it.quantity}</td>

                        {/* ✅ Shipping Qty - only for shipping/clearing */}
                        {showFeeColumns && (
                          <td className="px-3 py-2 align-top text-center">
                            {it.shippingQuantity ?? 0}
                          </td>
                        )}

                        {/* ✅ Shipping Fee - only for shipping/clearing */}
                        {/* {showFeeColumns && (
  <td className="py-3 text-right text-slate-700">
    {formatCurrency(
      isClearingTag
        ? req.shippingFee || 0 
        : it.shippingFee || 0, 
      it.currency || req.currency
    )}
  </td>
)} */}

                        {/* ✅ Clearing Fee - only for clearing */}
                        {/* {isClearingTag && (
                        <td className="px-3 py-2 align-top text-right text-slate-700">
                          {formatCurrency(
                            it.clearingFee || 0,
                            it.currency || req.currency
                          )}
                        </td>
                      )} */}

                        {/* ✅ Unit Price - hide for shipping/clearing and before procurement */}
                        {/* {!showFeeColumns && showPriceColumns && !isInStock && (
                        <td className="px-3 py-2 align-top text-right text-slate-700">
                          {formatCurrency(
                            it.unitPrice,
                            it.currency || req.currency
                          )}
                        </td>
                      )} */}

                        {/* ✅ Total - hide for shipping/clearing and before procurement */}
                        {/* {!showFeeColumns && showPriceColumns && !isInStock && (
                        <td className="px-3 py-2 align-top text-right font-semibold text-slate-900">
                          {formatCurrency(
                            it.totalPrice !== undefined
                              ? it.totalPrice
                              : it.total !== undefined
                              ? it.total
                              : Number(it.unitPrice || 0) *
                                Number(it.quantity || 0),
                            it.currency || req.currency
                          )}
                        </td>
                      )} */}
                      </tr>
                    ))}
                  </tbody>
                  {/* ✅ Grand Total - only show if price columns are visible */}
                  {/* {!showFeeColumns && showPriceColumns && !isInStock && (
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="pt-4 text-right font-bold">
                        Grand Total
                      </td>
                      <td className="pt-4 text-right text-xl font-bold pb-4">
                        {formatCurrency(grandTotal, req.currency)}
                      </td>
                    </tr>
                  </tfoot>
                )} */}
                </table>
              )}
            </div>
          </div>
        </div>
        {!hideSignatures && (
          <div className="pt-6 border-t">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="flex-1">
                <p className="text-xs text-slate-500 mb-2">Approved by</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4  gap-4">
                  {" "}
                  {loading ? (
                    <div className="text-sm text-slate-500">
                      Loading signatures…
                    </div>
                  ) : signaturesPrepared.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      No signatures yet
                    </div>
                  ) : (
                    filteredSignatures.map((s, idx) => {
                      const ts = s.timestamp
                        ? new Date(s.timestamp).toLocaleString()
                        : "";
                      return (
                        <div
                          key={s.userId || idx}
                          className="bg-white p-2 rounded-xl border border-slate-100 w-full text-center"
                        >
                          {s.imageData ? (
                            <div
                              style={{
                                height: 40,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <img
                                src={s.imageData}
                                alt={s.name}
                                style={{
                                  maxWidth: 160,
                                  height: 36,
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          ) : (
                            <div
                              style={{
                                height: 25,
                                fontFamily:
                                  "Brush Script MT, Lucida Handwriting, cursive",
                                fontSize: 15,
                                color: "#036173",
                                marginBottom: "1rem",
                              }}
                            >
                              {s.name}
                            </div>
                          )}
                          <div className="mt-2">
                            <div className="text-sm font-semibold">
                              {s.name}
                            </div>
                            <div className="text-xs text-slate-500 ">
                              {s.role}
                            </div>
                            <div className="text-xs text-slate-400">{ts}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-xs text-slate-500 mt-2">Refreshing preview…</div>
        )}
      </div>
    );
  }
);

export default RequestFormPreview;
