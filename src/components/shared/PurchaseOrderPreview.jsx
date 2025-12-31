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

const PurchaseOrderPreview = forwardRef(
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
    const [signaturesPrepared, setSignaturesPrepared] = useState([]);
    const [vendorInfo, setVendorInfo] = useState(null);
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

    // ...existing code...
    useEffect(() => {
      let mounted = true;
      const load = async () => {
        setLoading(true);
        try {
          // DO NOT fetch the request from the server — always use provided props (live preview)
          const sourceRequest = request || {};
          const sourceItems = Array.isArray(items) ? items.slice() : [];

          if (!mounted) return;
          setLiveRequest(sourceRequest || {});
          setLiveItems(sourceItems || []);

          // keep vendor lookup behavior (if vendor is an id string/number) so vendor details can display
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

          // prepare signatures from the provided request object (if any)
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
          const procurementOnly = prepared.filter((p) => {
            const r = (p.role || "").toString().toLowerCase();
            // require "procurement" and either "officer" or "manager"
            return r.includes("procurement") && r.includes("manager");
          });
          setSignaturesPrepared(procurementOnly);
        } catch (err) {
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();
      return () => {
        mounted = false;
      };
    }, [request, items, token, apiBase]);
    // ...existing code...

    const req = liveRequest || {};
    const usedItems =
      Array.isArray(liveItems) && liveItems.length > 0
        ? liveItems
        : items || [];
    const getPoFromItems = () => {
      if (!Array.isArray(usedItems)) return null;
      for (const it of usedItems) {
        const candidate =
          it.purchaseOrderNumber ||
          it.purchaseOrderNo ||
          it.pon ||
          it.poNumber ||
          it.po ||
          null;
        if (candidate) return candidate;
      }
      return null;
    };

    const itemPo = getPoFromItems();
    const reqIdStr =
      itemPo ||
      req.purchaseOrderNumber ||
      req.purchaseOrderNo ||
      req.pon ||
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

    const issuedToLines = [vendorNameLine, addressPart]
      .filter(Boolean)
      .join("\n");
    const tagLower = String(req.tag || "").toLowerCase();
    const isShippingTag = tagLower === "shipping";
    const isClearingTag = tagLower === "clearing";
    const showFeeColumns = isShippingTag || isClearingTag;

    function getShipToBlock(req) {
      if (String(req.logisticsType).toLowerCase() !== "local") return null;
      const location = String(req.deliveryLocation || "").toLowerCase();

      if (location === "delivery jetty") {
        return (
          <>
            <div className="text-base font-semibold text-slate-800">
              Delivery Jetty
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
              Inside NPA, Kiri Kiri Lighter Terminal
              <br />
              Phase 1, By Sunrise Bustop
              <br />
              Oshodi Apapa Expressway Apapa
              <br />
              Lagos
            </div>
          </>
        );
      }
      if (location === "delivery base") {
        return (
          <>
            <div className="text-base font-semibold text-slate-800">
              Delivery Base
            </div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
              17, Wharf Road,
              <br />
              Apapa, Lagos
              <br />
              Nigeria.
            </div>
          </>
        );
      }
      if (location === "delivery vessel") {
        return (
          <div className="text-base font-semibold text-slate-800">
            Delivery Vessel
          </div>
        );
      }
      return null;
    }

    return (
      <div
        ref={ref}
        className="bg-white px-12 md:px-16 lg:px-20 print:px-8 py-6 text-slate-900 max-w-5xl mx-auto"
      >
        <div className="px-4 py-4 border-b bg-gradient-to-r from-white to-slate-50">
          <h2 className="text-2xl font-extrabold">Purchase Order</h2>
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
                <div className="font-semibold">PON:</div>
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
            </div>
            <div className="flex justify-center items-center gap-2 mt-1">
              <div className="font-semibold">Timeline:</div>
              <div className="text-sm text-slate-500">{paymentType}</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2">
              Issued To:
            </div>
            <div>
              <div className="text-base font-semibold text-slate-800 ml-[3rem]">
                {vendorNameLine}
              </div>
              {addressPart ? (
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1 ml-[3rem]">
                  {addressPart}
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2">
              Ship To:
            </div>
            <div>
              {getShipToBlock(req) ? (
                getShipToBlock(req)
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-sm font-semibold mb-3">Purchase Order Items</h4>
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
                      <td className="py-3 text-slate-900">{it.name}</td>
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
                              ? req.shippingFee || 0
                              : it.shippingFee || 0,
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
                          {it.vat ? `${it.vat}%` : "-"}
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
                      <td colSpan={7} className="pt-4 text-right font-bold">
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

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2">Approved by</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  <div className="text-sm text-slate-500">
                    Loading signatures…
                  </div>
                ) : (
                  signaturesPrepared.map((s, idx) => {
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

export default PurchaseOrderPreview;
