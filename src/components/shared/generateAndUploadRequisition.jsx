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

  // build rows
  const rowsHtml = items
    .map((it, i) => {
      const qty = Number(it.quantity || 0);
      const unitPrice = Number(it.unitPrice || 0);
      const discount = it.discount != null ? Number(it.discount) : null;
      const vat = it.vat != null ? it.vat : null;
      const total = it.total != null ? Number(it.total) : unitPrice * qty;
      return `<tr>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${escapeHtml(
          it.name || ""
        )}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${qty}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;vertical-align:top">${escapeHtml(
          it.unit || "pcs"
        )}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${request.currency ||
          "NGN"} ${unitPrice.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${discount != null
          ? `${request.currency || "NGN"} ${discount.toFixed(2)}`
          : "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${vat != null
          ? `${vat}%`
          : "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${request.currency ||
          "NGN"} ${Number(total).toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  const grandTotal = items.reduce((s, it) => {
    const qty = Number(it.quantity || 0);
    const total = it.total != null ? Number(it.total) : Number(it.unitPrice || 0) * qty;
    return s + (isNaN(total) ? 0 : total);
  }, 0);

  const css = `
    body{font-family:Arial,Helvetica,sans-serif;color:#0f172a;padding:24px;background:#fff}
    .header{border-bottom:1px solid #e6e6e6;padding-bottom:12px;margin-bottom:12px}
    .meta{float:right;text-align:right}
    table{width:100%;border-collapse:collapse;margin-top:12px}
    th,td{padding:8px;border-bottom:1px solid #e6e6e6}
    tfoot td{border-top:2px solid #e6e6e6}
    .signature{margin-top:24px}
    @media print{ .page-break{page-break-after:always} }
  `;

  const reqIdStr = request.requestId || request.id || requestId;
  const createdAt = request.createdAt ? new Date(request.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString();
  const requiredDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString();
  const reference = request.reference || "N/A";

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
        <div><strong>Number:</strong> ${escapeHtml(reqIdStr)}</div>
        <div><strong>Date:</strong> ${escapeHtml(dateStr)}</div>
        <div><strong>Required:</strong> ${escapeHtml(requiredDate)}</div>
        <div><strong>Reference:</strong> ${escapeHtml(reference)}</div>
      </div>
      <div style="clear:both"></div>
    </div>

    <div style="margin:14px 0 8px 0">
      <div style="font-weight:600;margin-bottom:6px">Vendor: ${escapeHtml(vendorName)}</div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:12px">
      <div style="flex:1;border:2px dashed #e6e6e6;padding:12px;border-radius:8px">
        <div style="font-weight:600;margin-bottom:6px">Issued To:</div>
        <div style="white-space:pre-line;color:#334155;font-size:13px">
          AVL Integrated Technology Solution
          \nBlock B, Suite 366, Sura Shopping Complex
          \nIkeja
          \nLagos
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
            <td style="text-align:right;font-weight:700;padding-top:12px">${request.currency || "NGN"} ${Number(
    grandTotal
  ).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div class="signature">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px">
        <div style="flex:1">
          <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">Approved by</div>
          <div style="border:1px solid #e6e6e6;padding:12px;border-radius:12px;max-width:360px">
            <svg width="240" height="70" viewBox="0 0 240 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 40 C40 10, 80 10, 110 40 S180 70, 230 40" stroke="#036173" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div style="margin-top:8px;font-weight:600">Procurement Officer</div>
            <div style="font-size:12px;color:#64748b">e-signature • ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div style="text-align:right;min-width:200px;margin-left:16px">
          <div style="font-size:12px;color:#94a3b8">Contact</div>
          <div style="font-weight:600">procurement@gemz.com</div>
        </div>
      </div>
    </div>
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
    const canvas = await html2canvas(idoc.body, { scale: 1, useCORS: true, backgroundColor: "#ffffff" });

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
      pctx.drawImage(sourceCanvas, 0, y, sourceCanvas.width, thisPageHeight, 0, 0, sourceCanvas.width, thisPageHeight);

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
    const filename = `${requestId}-${vendorName.replace(/\s+/g, "_")}-requisition.pdf`;
    const file = new File([pdfBlob], filename, { type: "application/pdf" });

    const formData = new FormData();
    formData.append("files", file);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const resp = await axios.post(`${apiBase}/requests/${requestId}/requisition-files`, formData, { headers });
    const uploadedFiles = (resp.data && (resp.data.uploadedFiles || resp.data.uploaded_files)) || [];
    return uploadedFiles;
  } finally {
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
  }
}