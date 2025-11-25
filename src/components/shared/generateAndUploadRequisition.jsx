import React from "react";
import ReactDOM from "react-dom/client";
import RequisitionPreview from "./RequisitionPreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export async function generateAndUploadRequisition({
  request = {},
  items = [],
  requestId,
  vendorName = "vendor",
  token = null,
  apiBase = "https://hdp-backend-1vcl.onrender.com/api",
  maxWidthPx = 1200,
  jpegQuality = 0.78,
}) {
  if (!requestId) throw new Error("Missing requestId");
  if (!items || items.length === 0) return [];

  let vendorObj = null;
  try {
    const vendorIdFromItems = items[0]?.vendorId ?? items[0]?.vendor ?? null;
    if (vendorIdFromItems && token) {
      const vResp = await axios.get(
        `${apiBase}/vendors/${encodeURIComponent(vendorIdFromItems)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      vendorObj = vResp.data?.data ?? vResp.data ?? null;
    }
  } catch (fetchVendorErr) {
    // non-fatal: continue without vendor details
    console.warn(
      "generateAndUploadRequisition: failed to fetch vendor details",
      fetchVendorErr
    );
  }

  // ...existing code...
  // --- ADD: fetch latest request (to pick up newest signatures) and prepare signatures array ---
  let latestRequest = request;
  if (token) {
    try {
      const reqResp = await axios.get(
        `${apiBase}/requests/${encodeURIComponent(requestId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      latestRequest = reqResp.data?.data ?? reqResp.data ?? request;
    } catch (e) {
      console.warn(
        "generateAndUploadRequisition: failed to refresh request for signatures",
        e
      );
      latestRequest = request;
    }
  }

  const rawSignatures = Array.isArray(latestRequest.signatures)
    ? latestRequest.signatures.slice()
    : [];

  // sort oldest-first
  rawSignatures.sort((a, b) => {
    const ta = a.timestamp || a.time || a.createdAt || 0;
    const tb = b.timestamp || b.time || b.createdAt || 0;
    return new Date(ta).getTime() - new Date(tb).getTime();
  });

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
      const resp = await axios.get(url, {
        responseType: "arraybuffer",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const contentType =
        resp.headers && resp.headers["content-type"]
          ? resp.headers["content-type"]
          : "image/png";
      const base64 = arrayBufferToBase64(resp.data);
      return `data:${contentType};base64,${base64}`;
    } catch (err) {
      console.warn(
        "generateAndUploadRequisition: failed to fetch signature image",
        url,
        err
      );
      return null;
    }
  };

  // prepare signatures with inline images (if available)
  const signaturesPrepared = await Promise.all(
    rawSignatures.map(async (s) => {
      const imgData = s.signatureUrl
        ? await fetchImageAsDataUrl(s.signatureUrl)
        : null;
      return {
        userId: s.userId,
        name: s.name || s.userName || s.displayName || s.requesterName || "",
        role: s.role || s.position || "",
        timestamp: s.timestamp || s.time || s.createdAt || null,
        signatureUrl: s.signatureUrl || null,
        imageData: imgData, // base64 data URI or null
      };
    })
  );
  // ...existing code...

  // --- ADD: prepare Issued To name + address (escaped) ---
  const issuedToName = escapeHtml(
    (vendorObj && (vendorObj.name || vendorObj.vendorName)) || vendorName || ""
  );
  const issuedToAddress = (() => {
    if (!vendorObj) return "";
    const parts = [];
    if (vendorObj.address) parts.push(vendorObj.address);
    if (vendorObj.city) parts.push(vendorObj.city);
    if (vendorObj.state) parts.push(vendorObj.state);
    if (vendorObj.postalCode) parts.push(vendorObj.postalCode);
    if (vendorObj.country) parts.push(vendorObj.country);
    // compact, join with newlines, escape
    return escapeHtml(parts.filter(Boolean).join("\n"));
  })();
  // build rows
  const rowsHtml = items
    .map((it, i) => {
      const qty = Number(it.quantity || 0);
      const unitPrice = Number(it.unitPrice || 0);
      const discount = it.discount != null ? Number(it.discount) : null;
      const vat = it.vat != null ? it.vat : null;
      const total = it.total != null ? Number(it.total) : unitPrice * qty;
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${
          i + 1
        }</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${escapeHtml(
          it.name || ""
        )}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${qty}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${escapeHtml(
          it.unit || "pcs"
        )}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${
          request.currency || "NGN"
        } ${unitPrice.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${
          discount != null
            ? `${request.currency || "NGN"} ${discount.toFixed(2)}`
            : "-"
        }</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${
          vat != null ? `${vat}%` : "-"
        }</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${
          request.currency || "NGN"
        } ${Number(total).toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  const grandTotal = items.reduce((s, it) => {
    const qty = Number(it.quantity || 0);
    const total =
      it.total != null ? Number(it.total) : Number(it.unitPrice || 0) * qty;
    return s + (isNaN(total) ? 0 : total);
  }, 0);

  const css = `
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;background:#fff}
    .header{border-bottom:1px solid #e6e6e6;padding-bottom:10px;margin-bottom:10px}
    .header .logo{width:48px;height:48px}
    .header .company{font-weight:700;font-size:14px;margin-top:6px}
    .header .address{color:#64748b;margin-top:4px;white-space:pre-line;font-size:11px}
    .meta{float:right;text-align:right;font-size:12px;color:#0f172a}
    .meta div{margin-bottom:3px}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{padding:6px;border-bottom:1px solid #e6e6e6;font-size:11px}
    thead th{color:#475569;font-size:11px}
    tfoot td{border-top:2px solid #e6e6e6}
    .signature{margin-top:18px}
    .issued-block{border-radius:8px;padding:10px}
    .issued-block .title{font-weight:600;margin-bottom:4px;font-size:12px}
    .issued-block .content{white-space:pre-line;color:#334155;font-size:11px}
    @media print{ .page-break{page-break-after:always} }
  `;

  const reqIdStr = request.requestId || request.id || requestId;
  const createdAt = request.createdAt
    ? new Date(request.createdAt)
    : new Date();
  const dateStr = createdAt.toLocaleDateString();
  const requiredDate = new Date(
    createdAt.getTime() + 24 * 60 * 60 * 1000
  ).toLocaleDateString();
  const reference = request.reference || "N/A";

  const signatureHtml = `
    <div class="signature" style="margin-top:18px">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${signaturesPrepared
          .map((s) => {
            const name = escapeHtml(s.name || "Unknown");
            const role = escapeHtml(s.role || "");
            const ts = s.timestamp
              ? escapeHtml(new Date(s.timestamp).toLocaleString())
              : "";
            if (s.imageData) {
              return `
                <div style="text-align:left;min-height:60px">
                  <div style="height:36px">
                    <img src="${s.imageData}" style="max-width:120px;height:36px;object-fit:contain;border:none" />
                  </div>
                  <div style="font-family:'Brush Script MT','Lucida Handwriting',cursive;font-size:12px;margin-top:6px;color:#036173">${name}</div>
                  <div style="font-size:10px;color:#64748b">${role}</div>
                  <div style="font-size:10px;color:#94a3b8">${ts}</div>
                </div>
              `;
            }
            return `
              <div style="text-align:left;min-height:60px">
                <div style="height:36px;font-family:'Brush Script MT','Lucida Handwriting',cursive;font-size:20px;color:#036173">${name}</div>
                <div style="font-size:10px;color:#64748b">${role}</div>
                <div style="font-size:10px;color:#94a3b8">${ts}</div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Requisition ${escapeHtml(
    reqIdStr
  )}</title><style>${css}</style></head><body>
    <div class="header">
      <div style="float:left;max-width:60%">
        <div style="width:64px;height:64px;background:#10b981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:8px">G</div>
        <div style="font-weight:700;font-size:18px;margin-top:8px">Hydrodive Nigeria Ltd</div>
        <div style="color:#64748b;margin-top:6px;white-space:pre-line">17, Wharf Road,\nApapa, Lagos\nNigeria.</div>
      </div>
      <div class="meta">
        <div><strong>RequestId:</strong> ${escapeHtml(reqIdStr)}</div>
        <div><strong>Date:</strong> ${escapeHtml(dateStr)}</div>
        <div><strong>Required:</strong> ${escapeHtml(requiredDate)}</div>
        <div><strong>Reference:</strong> ${escapeHtml(reference)}</div>
      </div>
      <div style="clear:both"></div>
    </div>

   

   <div style="display:flex;gap:12px;margin-bottom:12px">
      <div style="flex:1;border:2px dashed #e6e6e6;padding:12px;border-radius:8px">
        <div style="font-weight:600;margin-bottom:6px;font-size:12px">Issued To:</div>
        <div style="white-space:pre-line;color:#334155;font-size:11px">
          ${issuedToName}${issuedToAddress ? "\n" + issuedToAddress : ""}
        </div>
      </div>
      <div style="flex:1;border:2px dashed #e6e6e6;padding:12px;border-radius:8px">
        <div style="font-weight:600;margin-bottom:6px">Ship To:</div>
        <div style="white-space:pre-line;color:#334155;font-size:13px">
          Hydrodive Nigeria Limited
          \n17, Wharf Road
          \nApapa
          \nLagos
          \nNigeria
        </div>
      </div>
    </div>

    <div>
      <h4 style="margin:0 0 8px 0">Requisition Items</h4>
      <table>
        <thead>
          <tr style="color:#475569;font-size:12px">
            <th style="text-align:left">#</th>
            <th style="text-align:left">Description</th>
            <th style="text-align:left">Qty</th>
            <th style="text-align:left">Unit</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Discount</th>
            <th style="text-align:right">VAT</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="7" style="text-align:right;font-weight:700;padding-top:12px">Grand Total</td>
            <td style="text-align:right;font-weight:700;padding-top:12px">${
              request.currency || "NGN"
            } ${Number(grandTotal).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

     ${signatureHtml}

  </body></html>`;

  // write into hidden same-origin iframe
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "800px";
  iframe.style.height = "1100px";
  document.body.appendChild(iframe);

  try {
    const idoc = iframe.contentDocument || iframe.contentWindow.document;
    idoc.open();
    idoc.write(html);
    idoc.close();

    // give browser a moment to render
    await new Promise((r) => setTimeout(r, 200));

    // capture
    const canvas = await html2canvas(idoc.body, {
      scale: 1,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    // downscale
    let sourceCanvas = canvas;
    if (canvas.width > maxWidthPx) {
      const scaleDown = maxWidthPx / canvas.width;
      const tmp = document.createElement("canvas");
      tmp.width = Math.round(canvas.width * scaleDown);
      tmp.height = Math.round(canvas.height * scaleDown);
      const tctx = tmp.getContext("2d");
      tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
      sourceCanvas = tmp;
    }

    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pxPerPt = sourceCanvas.width / pageWidth;
    const pagePixelHeight = Math.floor(pageHeight * pxPerPt);

    let y = 0;
    let first = true;
    while (y < sourceCanvas.height) {
      const thisPageHeight = Math.min(pagePixelHeight, sourceCanvas.height - y);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = sourceCanvas.width;
      pageCanvas.height = thisPageHeight;
      const pctx = pageCanvas.getContext("2d");
      pctx.drawImage(
        sourceCanvas,
        0,
        y,
        sourceCanvas.width,
        thisPageHeight,
        0,
        0,
        sourceCanvas.width,
        thisPageHeight
      );

      const pageImgData = pageCanvas.toDataURL("image/jpeg", jpegQuality);
      const imgHeightInPts = thisPageHeight / pxPerPt;

      if (first) {
        pdf.addImage(pageImgData, "JPEG", 0, 0, pageWidth, imgHeightInPts);
        first = false;
      } else {
        pdf.addPage();
        pdf.addImage(pageImgData, "JPEG", 0, 0, pageWidth, imgHeightInPts);
      }

      y += thisPageHeight;
    }

    const pdfBlob = pdf.output("blob");
    const filename = `${requestId}-${vendorName.replace(
      /\s+/g,
      "_"
    )}-requisition.pdf`;
    const file = new File([pdfBlob], filename, { type: "application/pdf" });

    const formData = new FormData();
    formData.append("files", file);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const resp = await axios.post(
      `${apiBase}/requests/${requestId}/requisition-files`,
      formData,
      { headers }
    );
    const uploadedFiles =
      (resp.data && (resp.data.uploadedFiles || resp.data.uploaded_files)) ||
      [];
    return uploadedFiles;
  } finally {
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }
}
