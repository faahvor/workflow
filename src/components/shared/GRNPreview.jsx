import React, { forwardRef, useEffect, useState } from "react";
import axios from "axios";

const formatCurrency = (v, currency = "NGN") => {
  const n = Number(v || 0).toFixed(2);
  return `${currency} ${Number(n).toLocaleString()}`;
};

const GRNPreview = forwardRef(
  (
    {
      request = {},
      items = [],
      requestId = null,
      token = null,
      apiBase = import.meta.env.VITE_API_BASE_URL,
    },
    ref
  ) => {
    const [liveRequest, setLiveRequest] = useState(request || {});
    const [liveItems, setLiveItems] = useState(items || []);
    const [loading, setLoading] = useState(false);
    const [signaturesPrepared, setSignaturesPrepared] = useState([]);

useEffect(() => {
  let mounted = true;
  const load = async () => {
    setLoading(true);
    try {
      let sourceRequest = request || {};
      let sourceItems = Array.isArray(items) ? items.slice() : [];

      // Fetch real data if requestId is provided
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

      // Prepare signatures (similar to RequestFormPreview)
      console.log("sourceRequest.signatures:", sourceRequest.signatures);
      const rawSignatures = Array.isArray(sourceRequest.signatures)
        ? sourceRequest.signatures.slice()
        : [];
      rawSignatures.sort((a, b) => {
        const ta = a.timestamp || a.time || a.createdAt || 0;
        const tb = b.timestamp || b.time || b.createdAt || 0;
        return new Date(ta).getTime() - new Date(tb).getTime();
      });

      console.log("GRNPreview rawSignatures:", rawSignatures);
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
            action: s.action || "",
            timestamp: s.timestamp || s.time || s.createdAt || null,
            signatureUrl: s.signatureUrl || null,
            imageData: img,
          };
        })
      );
      console.log("GRNPreview signaturesPrepared:", prepared);

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

    // Helper: convert ArrayBuffer -> base64 for browser
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

    

    const req = liveRequest || {};
    const isPurchaseOrder = String(req.requestType || "").toLowerCase() === "purchaseorder";
   

// Helper: delivery roles for purchase order signatures
const deliveryRoles = ["delivery base", "delivery jetty", "delivery vessel"];
    const usedItems =
      Array.isArray(liveItems) && liveItems.length > 0
        ? liveItems
        : items || [];
    const createdAt = req.createdAt ? new Date(req.createdAt) : new Date();
    const dateStr = createdAt.toLocaleDateString();
    const grnNumber =
      req.grnNumber ||
      req.grnId ||
      req.requestId ||
      req.id ||
      requestId ||
      "N/A";
  const getVendorDisplayName = (vendorOrName) => {
  if (!vendorOrName) return "";
  if (typeof vendorOrName === "string") return vendorOrName;
  if (typeof vendorOrName === "object") {
    return (
      vendorOrName.name ||
      vendorOrName.vendorName ||
      vendorOrName.label ||
      vendorOrName.vendor ||
      vendorOrName.vendorId ||
      vendorOrName.id ||
      ""
    );
  }
  return String(vendorOrName);
};

const vendorName =
  getVendorDisplayName(req.vendorName) ||
  (usedItems[0] && getVendorDisplayName(usedItems[0].vendorName)) ||
  (usedItems[0] && getVendorDisplayName(usedItems[0].vendor)) ||
  "";
    const receivedBy = req.receivedBy || "N/A";
    const approvedBy = req.approvedBy || "N/A";
    const poNumber = req.poNumber || req.purchaseOrderNumber || "N/A";
    const grandTotal = usedItems.reduce((s, it) => {
      const total =
        it.totalPrice !== undefined
          ? Number(it.totalPrice)
          : it.total !== undefined
          ? Number(it.total)
          : Number(it.unitPrice || 0) * Number(it.quantity || 0);
      return s + (isNaN(total) ? 0 : total);
    }, 0);
    
 let approvedBySignatures = [];
if (isPurchaseOrder) {
  approvedBySignatures = signaturesPrepared.filter(
    (s) =>
      deliveryRoles.includes(String(s.role || "").trim().toLowerCase())
  );
} else {
  // Default: store base/jetty/vessel for inStock and others
  approvedBySignatures = signaturesPrepared.filter(
    (s) =>
      ["store base", "store jetty", "store vessel"].includes(
        String(s.role || "").trim().toLowerCase()
      )
  );
}
    return (
  <div
    ref={ref}
    className="bg-white p-8 rounded-xl shadow max-w-4xl mx-auto border border-slate-300"
    style={{ fontFamily: "Arial, sans-serif" }}
  >
    {/* Header */}
    <div className="flex justify-between items-start mb-2">
      <div>
        <div
          className="text-2xl font-bold text-sky-700"
          style={{ fontFamily: "Segoe UI, Arial, sans-serif" }}
        >
          HydroDive
        </div>
        <div className="text-xs mt-1 text-slate-700">
          17, WHARF ROAD, APAPA, LAGOS-NIGERIA
          <br />
          TEL: +234-1-5450946, +234-1-5870946
          <br />
          0700HYDRODIVE FAX: 4611443
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold text-slate-700">
          GOODS RECEIVED NOTE
        </div>
        <div className="text-xs text-slate-500 mt-1">
          NO:{" "}
          <span
            className="inline-block min-w-[60px] border-b border-slate-400 align-middle"
            style={{ letterSpacing: 2 }}
          >
            {grnNumber}
          </span>
        </div>
      </div>
    </div>
    {/* Vendor and PO info */}
    <div className="flex justify-between items-start mt-4 mb-2 gap-4">
      {/* Vendor Name box */}
      <div className="border border-slate-400 rounded-sm p-2 flex-1 max-w-[60%]">
        <div
          className="text-[11px] text-slate-700 mb-1"
          style={{ lineHeight: 4 }}
        >
          Vendor Name:
        </div>
        <div
          className="text-[13px] font-medium"
          style={{
            fontFamily: "cursive",
            borderBottom: "1px solid #bbb",
            minHeight: 22,
            paddingBottom: 2,
            color: "#444",
          }}
        >
          {vendorName}
        </div>
      </div>
      {/* PO/Reg/Date box */}
      <div className="border border-slate-400 rounded-sm p-2 flex flex-col min-w-[210px]">
        <div
          className="flex items-center text-[11px] text-slate-700 mb-1"
          style={{ lineHeight: 1 }}
        >
          <span className="mr-2">P.O No.:</span>
          <span
            className="text-[13px] font-medium flex-1"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minWidth: 40,
              minHeight: 20,
              paddingBottom: 2,
              color: "#444",
            }}
          >
            {poNumber}
          </span>
        </div>
        <div
          className="flex items-center text-[11px] text-slate-700 mb-1"
          style={{ lineHeight: 1 }}
        >
          <span className="mr-2">Reg No.:</span>
          <span
            className="text-[13px] font-medium flex-1"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minWidth: 60,
              minHeight: 20,
              paddingBottom: 2,
              color: "#444",
            }}
          >
            {req.regNo || req.registrationNumber || ""}
          </span>
        </div>
        <div
          className="flex items-center text-[11px] text-slate-700"
          style={{ lineHeight: 1 }}
        >
          <span className="mr-2">Date:</span>
          <span
            className="text-[13px] font-medium flex-1"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minWidth: 60,
              minHeight: 20,
              paddingBottom: 2,
              color: "#444",
            }}
          >
            {dateStr}
          </span>
        </div>
      </div>
    </div>
    {/* Table */}
    <table
      className="w-full border border-slate-400 text-xs mt-2 mb-8"
      cellPadding={0}
      cellSpacing={0}
    >
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-400 px-2 py-1 w-8">S/N</th>
          <th className="border border-slate-400 px-2 py-1">Description</th>
          <th className="border border-slate-400 px-2 py-1 w-12">Qty</th>
          <th className="border border-slate-400 px-2 py-1 w-16"></th>
        </tr>
      </thead>
      <tbody>
        {usedItems.map((item, idx) => (
          <tr key={item.itemId || idx}>
            <td className="border border-slate-400 px-2 py-1 text-center">
              {idx + 1}
            </td>
            <td className="border border-slate-400 px-2 py-1">
              {item.desc || item.name || item.description || ""}
            </td>
            <td className="border border-slate-400 px-2 py-1 text-center">
              {item.qty || item.quantity || ""}
            </td>
            <td className="border border-slate-400 px-2 py-1"></td>
          </tr>
        ))}
        {/* Add 10 empty rows */}
        {Array.from({ length: 10 }).map((_, idx) => (
          <tr key={`empty-${idx}`}>
            <td className="border border-slate-400 px-2 py-4 text-center">
              {usedItems.length + idx + 1}
            </td>
            <td className="border border-slate-400 px-2 py-4"></td>
            <td className="border border-slate-400 px-2 py-4 text-center"></td>
            <td className="border border-slate-400 px-2 py-4"></td>
          </tr>
        ))}
        {/* Diagonal line */}
        <tr>
          <td colSpan={4} className="relative p-0" style={{ height: 80 }}>
            <svg
              width="100%"
              height="80"
              style={{ position: "absolute", left: 0, top: 0 }}
            >
              <line
                x1="0"
                y1="80"
                x2="100%"
                y2="0"
                stroke="#888"
                strokeWidth="1"
              />
            </svg>
          </td>
        </tr>
      </tbody>
    </table>
    {/* Footer */}
    <div className="grid grid-cols-2 gap-[4rem] mt-8 text-xs">
{/* Left: Approved by */}
<div>
  <div className="mb-2 text-slate-700 font-semibold">Approved by:</div>
  <div>
    {loading ? (
      <div className="text-sm text-slate-500">
        Loading signatures…
      </div>
    ) : approvedBySignatures.length === 0 ? (
      <div className="text-sm text-slate-500">
        No signatures yet
      </div>
    ) : (
      approvedBySignatures.map((s, idx) => {
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
                  height: 25,
                  fontFamily:
                    "Brush Script MT, Lucida Handwriting, cursive",
                  fontSize: 15,
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
{/* Right: Received by */}
{!isPurchaseOrder && (
  <div>
    <div className="mb-2 text-slate-700 font-semibold">Received by:</div>
    <div className="">
      {loading ? (
        <div className="text-sm text-slate-500">
          Loading signatures…
        </div>
      ) : signaturesPrepared.filter(
          (s) =>
            (s.role || "").toLowerCase() === "requester" &&
            (s.action === "APPROVE" || !s.action)
        ).length === 0 ? (
        <div className="text-sm text-slate-500">
          No signatures
        </div>
      ) : (
        signaturesPrepared
          .filter(
            (s) =>
              (s.role || "").toLowerCase() === "requester" &&
              (s.action === "APPROVE" || !s.action)
          )
          .map((s, idx) => {
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
                      height: 25,
                      fontFamily:
                        "Brush Script MT, Lucida Handwriting, cursive",
                      fontSize: 15,
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
)}
</div>
    {loading && (
      <div className="text-xs text-slate-500 mt-2">Refreshing preview…</div>
    )}
  </div>
);
  }
);

export default GRNPreview;