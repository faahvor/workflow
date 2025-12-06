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
      apiBase = "https://hdp-backend-1vcl.onrender.com/api",
    },
    ref
  ) => {
    const [liveRequest, setLiveRequest] = useState(request || {});
    const [liveItems, setLiveItems] = useState(items || []);
    const [vendorInfo, setVendorInfo] = useState(null);
    const [signaturesPrepared, setSignaturesPrepared] = useState([]);
    const [loading, setLoading] = useState(false);

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
        : items || [];
    const reqIdStr = req.requestId || req.id || requestId || "N/A";
    const createdAt = req.createdAt ? new Date(req.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString();
    const requiredDate =
      req.requiredDate ||
      new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString();
    const reference = req.reference || "N/A";
    const grandTotal = usedItems.reduce((s, it) => {
      const qty = Number(it.quantity || 0);
      const total =
        it.total != null ? Number(it.total) : Number(it.unitPrice || 0) * qty;
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
                {req.vessel || req.vesselName || req.vesselId || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Submitted Date
              </p>
              <p className="text-sm text-slate-900 font-semibold">{dateStr}</p>
            </div>
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Request Type
              </p>
              <p className="text-sm font-semibold">
                <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                  {req.requestType === "purchaseOrder" ||
                  req.type === "purchase-order"
                    ? "Purchase Order"
                    : "Petty Cash"}
                </span>
              </p>
            </div>
            <div className="px-4 py-3 border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Asset ID
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {req.assetId || "N/A"}
              </p>
            </div>

            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Priority
              </p>
              <p className="text-sm font-semibold">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs ${
                    String(req.priority || "").toLowerCase() === "urgent"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {String(req.priority || "").toLowerCase() === "urgent"
                    ? "URGENT"
                    : req.priority || "Normal"}
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
            <div className="px-4 py-3 border-r border-b  border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Job Number
              </p>
              <p className="text-sm text-slate-900 font-semibold capitalize">
                {req.jobNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MdShoppingCart /> Requested Items
          </h3>

          <div className="bg-white border-2 border-slate-200 rounded-2xl p-3">
            <div className="overflow-x-auto">
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
                    {showFeeColumns && (
                      <th className="px-3 py-2 text-right">Shipping Fee</th>
                    )}

                    {/* ✅ Clearing Fee - only for clearing */}
                    {isClearingTag && (
                      <th className="px-3 py-2 text-right">Clearing Fee</th>
                    )}

                    {/* ✅ Unit Price - hide for shipping/clearing */}
                    {!showFeeColumns && (
                      <th className="px-3 py-2 text-right">Unit Price</th>
                    )}

                    {/* ✅ Total - hide for shipping/clearing */}
                    {!showFeeColumns && (
                      <th className="px-3 py-2 text-right">Total</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {usedItems.map((it, i) => (
                    <tr
                      key={it.itemId || it.id || i}
                      className="border-b last:border-b-0 border-slate-200"
                    >
                      <td className="px-3 py-2 align-top">{i + 1}</td>
                      <td className="px-3 py-2 align-top text-slate-900">
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
                      {showFeeColumns && (
                        <td className="px-3 py-2 align-top text-right text-slate-700">
                          {formatCurrency(
                            it.shippingFee || 0,
                            it.currency || req.currency
                          )}
                        </td>
                      )}

                      {/* ✅ Clearing Fee - only for clearing */}
                      {isClearingTag && (
                        <td className="px-3 py-2 align-top text-right text-slate-700">
                          {formatCurrency(
                            it.clearingFee || 0,
                            it.currency || req.currency
                          )}
                        </td>
                      )}

                      {/* ✅ Unit Price - hide for shipping/clearing */}
                      {!showFeeColumns && (
                        <td className="px-3 py-2 align-top text-right text-slate-700">
                          {formatCurrency(
                            it.unitPrice,
                            it.currency || req.currency
                          )}
                        </td>
                      )}

                      {/* ✅ Total - hide for shipping/clearing */}
                      {!showFeeColumns && (
                        <td className="px-3 py-2 align-top text-right font-semibold text-slate-900">
                          {formatCurrency(
                            it.total ||
                              Number(it.unitPrice || 0) *
                                Number(it.quantity || 0),
                            it.currency || req.currency
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2">Approved by</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  <div className="text-sm text-slate-500">
                    Loading signatures…
                  </div>
                ) : signaturesPrepared.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No signatures yet
                  </div>
                ) : (
                  signaturesPrepared.map((s, idx) => {
                    const ts = s.timestamp
                      ? new Date(s.timestamp).toLocaleString()
                      : "";
                    return (
                      <div
                        key={s.userId || idx}
                        className="bg-white p-3 rounded-xl border border-slate-100"
                      >
                        {s.imageData ? (
                          <div style={{ height: 40 }}>
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
                              height: 36,
                              fontFamily:
                                "Brush Script MT, Lucida Handwriting, cursive",
                              fontSize: 20,
                              color: "#036173",
                            }}
                          >
                            {s.name}
                          </div>
                        )}
                        <div className="mt-2">
                          <div className="text-sm font-semibold">{s.name}</div>
                          <div className="text-xs text-slate-500">{s.role}</div>
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

        {loading && (
          <div className="text-xs text-slate-500 mt-2">Refreshing preview…</div>
        )}
      </div>
    );
  }
);

export default RequestFormPreview;
