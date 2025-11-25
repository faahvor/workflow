// ...existing code...
import React, { forwardRef, useEffect, useState } from "react";
import axios from "axios";

const formatCurrency = (v, currency = "NGN") => {
  const n = Number(v || 0).toFixed(2);
  return `${currency} ${Number(n).toLocaleString()}`;
};

const RequisitionPreview = forwardRef(
  ({ request = {}, items = [], requestId = null, token = null, apiBase = "https://hdp-backend-1vcl.onrender.com/api" }, ref) => {
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
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(url, { responseType: "arraybuffer", headers });
        const contentType = resp.headers && resp.headers["content-type"] ? resp.headers["content-type"] : "image/png";
        const base64 = arrayBufferToBase64(resp.data);
        return `data:${contentType};base64,${base64}`;
      } catch (err) {
        // silently fail and return null so we fallback to name rendering
        console.warn("RequisitionPreview: failed to fetch signature image", url, err);
        return null;
      }
    };

    useEffect(() => {
      let mounted = true;
      const load = async () => {
        if (!requestId) {
          // use provided request/items if no requestId
          setLiveRequest(request || {});
          setLiveItems(items || []);
          return;
        }
        setLoading(true);
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const resp = await axios.get(`${apiBase}/requests/${encodeURIComponent(requestId)}`, { headers });
          if (!mounted) return;
          const data = resp.data?.data ?? resp.data ?? {};
          setLiveRequest(data);
          setLiveItems(Array.isArray(data.items) ? data.items : items || []);

          // fetch vendor info for "Issued To" using first item's vendorId (if present)
          const vendorIdFromItems = (data.items && data.items[0] && (data.items[0].vendorId || data.items[0].vendor)) || null;
          if (vendorIdFromItems) {
            try {
              const vResp = await axios.get(`${apiBase}/vendors/${encodeURIComponent(vendorIdFromItems)}`, { headers });
              if (!mounted) return;
              setVendorInfo(vResp.data?.data ?? vResp.data ?? null);
            } catch (verr) {
              console.warn("RequisitionPreview: vendor fetch failed", verr);
              setVendorInfo(null);
            }
          } else {
            setVendorInfo(null);
          }

          // prepare signatures — sort oldest first and fetch images
          const rawSignatures = Array.isArray(data.signatures) ? data.signatures.slice() : [];
          rawSignatures.sort((a, b) => {
            const ta = a.timestamp || a.time || a.createdAt || 0;
            const tb = b.timestamp || b.time || b.createdAt || 0;
            return new Date(ta).getTime() - new Date(tb).getTime();
          });

          const prepared = await Promise.all(
            rawSignatures.map(async (s) => {
              const img = s.signatureUrl ? await fetchImageAsDataUrl(s.signatureUrl) : null;
              return {
                userId: s.userId,
                name: s.name || s.userName || s.displayName || s.requesterName || "",
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
          console.error("RequisitionPreview: failed to load request", err);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, [requestId, token, apiBase]); // refresh when requestId or token changes

    const req = liveRequest || {};
    const usedItems = Array.isArray(liveItems) && liveItems.length > 0 ? liveItems : items || [];
    const reqIdStr = req.requestId || req.id || requestId || "N/A";
    const createdAt = req.createdAt ? new Date(req.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString();
    const requiredDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString();
    const reference = req.reference || "N/A";
    const grandTotal = usedItems.reduce((s, it) => {
      const qty = Number(it.quantity || 0);
      const total = it.total != null ? Number(it.total) : Number(it.unitPrice || 0) * qty;
      return s + (isNaN(total) ? 0 : total);
    }, 0);

    const issuedToLines = vendorInfo
      ? [vendorInfo.name || vendorInfo.vendorName || "", vendorInfo.address || "", vendorInfo.city || "", vendorInfo.state || "", vendorInfo.country || ""].filter(Boolean).join("\n")
      : (usedItems[0] && (usedItems[0].vendor || usedItems[0].vendorName)) || "Vendor";

    return (
      <div ref={ref} className="bg-white p-6 print:p-8 text-slate-900">
        <div className="px-4 py-4 border-b bg-gradient-to-r from-white to-slate-50">
          <h2 className="text-2xl font-extrabold">Requisition Form</h2>
        </div>

        <div className="px-6 py-5 border-b">
          <div className="grid gap-2 md:grid-cols-[1fr_250px] grid-cols-1 md:gap-4">
            <div className="flex flex-col items-start gap-4 min-w-0">
              <div className="w-16 h-16 flex-shrink-0 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                G
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">Hydrodive Nigeria Ltd</div>
                <div className="text-sm text-slate-500 mt-1 leading-relaxed">
                  17, Wharf Road, <br />
                  Apapa, Lagos <br />
                  Nigeria.
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col justify-start items-start">
              <div className="flex justify-center items-center gap-2">
                <div className="font-semibold">Number:</div>
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
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2">Issued To:</div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{issuedToLines}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2">Ship To:</div>
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              Hydrodive Nigeria Limited
              {"\n"}17, Wharf Road
              {"\n"}Apapa
              {"\n"}Lagos
              {"\n"}Nigeria
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-sm font-semibold mb-3">Requisition Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Description</th>
                    <th className="pb-2">Qty</th>
                    <th className="pb-2">Unit</th>
                    <th className="pb-2 text-right">Unit Price</th>
                    <th className="pb-2 text-right">Discount</th>
                    <th className="pb-2 text-right">VAT</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usedItems.map((it, i) => (
                    <tr key={it.itemId || i} className="py-2">
                      <td className="py-3 text-slate-700">{i + 1}</td>
                      <td className="py-3 text-slate-900">{it.name}</td>
                      <td className="py-3 text-slate-700">{it.quantity}</td>
                      <td className="py-3 text-slate-700">{it.unit || "pcs"}</td>
                      <td className="py-3 text-right text-slate-700">{formatCurrency(it.unitPrice, req.currency)}</td>
                      <td className="py-3 text-right text-slate-700">{it.discount ? formatCurrency(it.discount, req.currency) : "-"}</td>
                      <td className="py-3 text-right text-slate-700">{it.vat ? `${it.vat}%` : "-"}</td>
                      <td className="py-3 text-right font-semibold text-slate-900">{formatCurrency(it.total || (it.unitPrice * it.quantity), req.currency)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={7} className="pt-4 text-right font-bold">Grand Total</td>
                    <td className="pt-4 text-right text-xl font-bold">{formatCurrency(grandTotal, req.currency)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t"></div>

          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2">Approved by</p>

              {/* signatures grid (live) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                  <div className="text-sm text-slate-500">Loading signatures…</div>
                ) : signaturesPrepared.length === 0 ? (
                  <div className="text-sm text-slate-500">No signatures yet</div>
                ) : (
                  signaturesPrepared.map((s, idx) => {
                    const ts = s.timestamp ? new Date(s.timestamp).toLocaleString() : "";
                    return (
                      <div key={s.userId || idx} className="bg-white p-3 rounded-xl border border-slate-100">
                        {s.imageData ? (
                          <div style={{ height: 40 }}>
                            <img src={s.imageData} alt={s.name} style={{ maxWidth: 160, height: 36, objectFit: "contain" }} />
                          </div>
                        ) : (
                          <div style={{ height: 36, fontFamily: "Brush Script MT, Lucida Handwriting, cursive", fontSize: 20, color: "#036173" }}>{s.name}</div>
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

            <div className="text-right md:text-left">
              <p className="text-xs text-slate-500">Contact</p>
              <p className="font-semibold text-slate-900">procurement@gemz.com</p>
            </div>
          </div>
        </div>

        {loading && <div className="text-xs text-slate-500 mt-2">Refreshing preview…</div>}
      </div>
    );
  }
);
// ...existing code...
export default RequisitionPreview;