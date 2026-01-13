import React, { forwardRef, useEffect, useState } from "react";
import axios from "axios";

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

const RequisitionPreview = forwardRef(
  (
    {
      request = {},
      items = [],
      requestId = null,
      token = null,
      apiBase = "https://hdp-backend-1vcl.onrender.com/api",
      doVendorSplit = true,
    },
    ref
  ) => {
    // live state that will replace the static props when requestId provided
    const [liveRequest, setLiveRequest] = useState(request || {});
    const [liveItems, setLiveItems] = useState(items || []);
    const [signaturesPrepared, setSignaturesPrepared] = useState([]);
    const [vendorInfo, setVendorInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    // helper: convert ArrayBuffer -> base64 for browser
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
        // fallback: return the original URL so the <img> tag can load it directly (avoids XHR CORS issues)
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

          // if a requestId is provided, re-fetch latest request from API (old behaviour)
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

          // vendor info: prefer vendorId found in first item of the provided items list
          const firstItem =
            Array.isArray(sourceItems) && sourceItems.length
              ? sourceItems[0]
              : null;
          if (firstItem && firstItem.vendor) {
            // vendor may already be an object on the item
            if (typeof firstItem.vendor === "object") {
              setVendorInfo(firstItem.vendor);
            } else {
              // vendor is an id string -> fetch vendor
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

          // prepare signatures — use signatures from the source request (works whether we fetched or were passed request)
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
          // keep only procurement officer signatures (case-insensitive, also allow 'procurement' substring)
          // const procurementOnly = prepared.filter((p) => {
          //   const r = (p.role || "").toString().toLowerCase();
          //   return r === "procurement officer" || r.includes("procurement");
          // });
          // setSignaturesPrepared(procurementOnly);
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
    }, [requestId, request, items, token, apiBase]); // react to provided request/items or a requestId

    const req = liveRequest || {};
    const usedItems =
      Array.isArray(liveItems) && liveItems.length > 0
        ? liveItems
        : items || [];
    const getPrFromItems = () => {
      if (!Array.isArray(usedItems)) return null;
      for (const it of usedItems) {
        const candidate =
          it.purchaseRequisitionNumber ||
          it.purchaseReqNumber ||
          it.prn ||
          it.requisitionNumber ||
          it.requisitionNo ||
          null;
        if (candidate) return candidate;
      }
      return null;
    };

    const itemPr = getPrFromItems();
    const reqIdStr =
      itemPr ||
      req.purchaseRequisitionNumber ||
      req.purchaseReqNumber ||
      req.prn ||
      req.requestId ||
      req.id ||
      requestId ||
      "N/A";
    const createdAt = req.createdAt ? new Date(req.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString();
    const requiredDate = new Date(
      createdAt.getTime() + 24 * 60 * 60 * 1000
    ).toLocaleDateString();
    const reference = req.reference || "N/A";
    const paymentType = req.paymentType || "N/A";
    const grandTotal = usedItems.reduce((s, it) => {
      const total =
        it.totalPrice !== undefined
          ? Number(it.totalPrice)
          : it.total !== undefined
          ? Number(it.total)
          : Number(it.unitPrice || 0) * Number(it.quantity || 0);
      return s + (isNaN(total) ? 0 : total);
    }, 0);

    const getVendorAddressLines = (v) => {
      if (!v) return null;
      const address = v.address;
      if (!address) return null;
      if (typeof address === "string") {
        return address;
      }
      // address is an object: prefer common keys
      const street = address.street || address.line1 || address.address1 || "";
      const city = address.city || address.town || "";
      const state = address.state || address.region || "";
      const parts = [street, city, state].filter(Boolean);
      return parts.length ? parts.join("\n") : null;
    };

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
    const tagLower = String(req.tag || "").toLowerCase();
    const isShippingTag = tagLower === "shipping";
    const isClearingTag = tagLower === "clearing";
    const showFeeColumns = isShippingTag || isClearingTag;

    const issuedToLines = [vendorNameLine, addressPart]
      .filter(Boolean)
      .join("\n");

      let filteredSignatures = signaturesPrepared;
if (
  (String(req.department || "").toLowerCase() === "marine" ||
  String(req.department || "").toLowerCase() === "freight") &&
  (String(req.destination || "").toLowerCase() === "marine" ||
  String(req.destination || "").toLowerCase() === "freight")
) {
  const allowedRoles = [
    "vessel manager",
    "technical manager",
    "fleet manager",
    "procurement officer",
    "managing director",
    "Vessel Manager",
    "Technical Manager",
    "Fleet Manager",
    "Procurement Officer",
    "Managing Director",
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
    "cost controller",
    "head of project",
    "managing director",
    "Cost Controller",
    "Head of Project",
    "Managing Director",
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
    "procurement officer",
    "legal head",
     "managing director",
    "Procurement Officer",
    "Legal Head",
    "Managing Director",
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
    "procurement officer",
    "director of admin",
     "managing director",
    "Procurement Officer",
    "Director of Admin",
    "Managing Director",
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
    "procurement officer",
    "hr manager",
     "managing director",
    "Procurement Officer",
    "HR Manager",
    "Managing Director",
  ];
  filteredSignatures = signaturesPrepared.filter((s) =>
    allowedRoles.includes(String(s.role).trim())
  );
}

    return (
      <div
        ref={ref}
        className="bg-white px-12 md:px-16 lg:px-20 print:px-8 py-6 text-slate-900 max-w-5xl mx-auto"
      >
        <div className="px-4 py-4 border-b bg-gradient-to-r from-white to-slate-50">
          <h2 className="text-2xl font-extrabold">Requisition Form</h2>
        </div>

        <div className="px-6 py-5 border-b">
          <div className="grid gap-2 md:grid-cols-[1fr_250px] grid-cols-1 md:gap-4">
            <div className="flex flex-col items-start gap-4 min-w-0">
              <div className="w-32 h-16 flex-shrink-0 rounded-md overflow-hidden  flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Hydrodive Nigeria Ltd logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">
                  Hydrodive Nigeria Ltd
                </div>
                <div className="text-sm text-slate-500 mt-1 leading-relaxed">
                  17, Wharf Road, <br />
                  Apapa, Lagos <br />
                  Nigeria.
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col justify-start items-start">
              <div className="flex justify-center items-center gap-2">
                <div className="font-semibold">PRN:</div>
                <div className="text-sm text-slate-500">{reqIdStr}</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Date:</div>
                <div className="text-sm text-slate-500">{dateStr}</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Page:</div>
                <div className="text-sm text-slate-500">1 of 1</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Required:</div>
                <div className="text-sm text-slate-500">{requiredDate}</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Reference:</div>
                <div className="text-sm text-slate-500">{reference}</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Timeline:</div>
                <div className="text-sm text-slate-500">{paymentType}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2">
              Issued To:
            </div>
            <div>
              {!doVendorSplit &&
              !(
                req.department?.toLowerCase() === "freight" &&
                req.logisticsType?.toLowerCase() === "international"
              ) ? (
                <div className="text-base font-semibold text-slate-800 ml-[3rem]">
                  Multiple Vendors
                </div>
              ) : (
                <>
                  <div className="text-base font-semibold text-slate-800 ml-[3rem]">
                    {vendorNameLine}
                  </div>
                  {addressPart ? (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1 ml-[3rem]">
                      {addressPart}
                    </div>
                  ) : null}
                </>
              )}
            </div>{" "}
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2 ">
              Ship To:
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800 ml-[3rem]">
                {req.company?.name || "Hydrodive Nigeria Limited"}
              </div>
              {req.company && req.company.address ? (
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1 ml-[3rem]">
                  {[
                    req.company.address.street || "",
                    req.company.address.city || "",
                    req.company.address.state || "",
                  ]
                    .filter(Boolean)
                    .join("\n")}
                </div>
              ) : (
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
                  {"17, Wharf Road\nApapa\nLagos\nNigeria"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Additional Information */}
          {req.additionalInformation && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span role="img" aria-label="info" className="text-xl">
                  ℹ️
                </span>
                Additional Information
              </h3>
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
                <p className="text-slate-700 leading-relaxed">
                  {req.additionalInformation}
                </p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-sm font-semibold mb-3">Requisition Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Qty</th>

                    {/* ✅ Shipping Qty - only for shipping/clearing */}
                    {showFeeColumns && (
                      <th className="pb-2 text-center">Shipping Qty</th>
                    )}

                    {/* ✅ Shipping Fee - only for shipping/clearing */}
                    {showFeeColumns && (
                      <th className="pb-2 text-right">Shipping Fee</th>
                    )}

                    {/* ✅ Clearing Fee - only for clearing */}
                    {isClearingTag && (
                      <th className="pb-2 text-right">Clearing Fee</th>
                    )}

                    {/* ✅ Unit Price - hide for shipping/clearing */}
                    {!showFeeColumns && (
                      <th className="pb-2 text-right">Unit Price</th>
                    )}

                    {/* ✅ Discount - hide for shipping/clearing */}
                    {!showFeeColumns && (
                      <th className="pb-2 text-right">Discount</th>
                    )}

                    {/* ✅ VAT - hide for shipping/clearing */}
                    {!showFeeColumns && (
                      <th className="pb-2 text-right">VAT</th>
                    )}

                    {/* ✅ Total - hide for shipping/clearing */}
                    {!showFeeColumns && (
                      <th className="pb-2 text-right">Total</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usedItems.map((it, i) => (
                    <tr key={it.itemId || i} className="py-2">
                      <td className="py-3 text-slate-700">{i + 1}</td>
                      <td className="px-3 py-2  text-slate-900 max-w-[180px] md:max-w-[180px] break-words whitespace-normal">
                        {it.name}
                      </td>
                      <td className="py-3 text-slate-700">{it.quantity}</td>

                      {/* ✅ Shipping Qty - only for shipping/clearing */}
                      {showFeeColumns && (
                        <td className="py-3 text-center text-slate-700">
                          {it.shippingQuantity ?? 0}
                        </td>
                      )}

                      {/* ✅ Shipping Fee - only for shipping/clearing */}
                     {showFeeColumns && (
  <td className="py-3 text-right text-slate-700">
    {formatCurrency(
      isClearingTag
        ? req.shippingFee || 0 // Use request-level shippingFee for clearing
        : it.shippingFee || 0, // Use item-level shippingFee for shipping
      it.currency || req.currency
    )}
  </td>
)}

                      {/* ✅ Clearing Fee - only for clearing */}
                      {isClearingTag && (
                        <td className="py-3 text-right text-slate-700">
                          {formatCurrency(
                            it.clearingFee || 0,
                            it.currency || req.currency
                          )}
                        </td>
                      )}

                      {/* ✅ Unit Price - hide for shipping/clearing */}
                      {!showFeeColumns && (
                        <td className="py-3 text-right text-slate-700">
                          {formatCurrency(
                            it.unitPrice,
                            it.currency || req.currency
                          )}
                        </td>
                      )}

                      {/* ✅ Discount - hide for shipping/clearing */}
                      {!showFeeColumns && (
                        <td className="py-3 text-right text-slate-700">
                          {it.discount
                            ? formatCurrency(
                                it.discount,
                                it.currency || req.currency
                              )
                            : "-"}
                        </td>
                      )}

                      {/* ✅ VAT - hide for shipping/clearing */}
                      {!showFeeColumns && (
                        <td className="py-3 text-right text-slate-700">
                          {it.vatAmount ? `${it.vatAmount}` : "-"}
                        </td>
                      )}

                      {/* ✅ Total - hide for shipping/clearing */}
                      {!showFeeColumns && (
                        <td className="py-3 text-right font-semibold text-slate-900">
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
                      )}
                    </tr>
                  ))}
                </tbody>

                {/* ✅ Grand Total - only for non-shipping/clearing */}
                {!showFeeColumns && (
                  <tfoot>
                    <tr>
                      <td colSpan={6} className="pt-4 text-right font-bold">
                        Grand Total
                      </td>
                      <td className="pt-4 text-right text-xl font-bold">
                        {formatCurrency(grandTotal, req.currency)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          <div className="pt-4 border-t"></div>

          <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2">Approved by</p>

              {/* signatures grid (live) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  <div className="text-sm text-slate-500">
                    Loading signatures…
                  </div>
                ) : (
  filteredSignatures.map((s, idx) => {
                    const ts = s.timestamp
                      ? new Date(s.timestamp).toLocaleString()
                      : "";
                    return (
                      <div
                        key={s.userId || idx}
                        className="bg-white p-2 rounded-xl border w-full text-center border-slate-100"
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
export default RequisitionPreview;
