import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const formatBytes = (bytes) => {
  if (!bytes) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const getFileNameFromUrl = (url) => {
  try {
    const parts = url.split("/").pop().split("?")[0];
    return decodeURIComponent(parts);
  } catch {
    return "file";
  }
};

const fetchHeadSize = async (url) => {
  try {
    const resp = await fetch(url, { method: "HEAD", mode: "cors" });
    if (!resp.ok) return null;
    const len = resp.headers.get("content-length");
    return len ? Number(len) : null;
  } catch {
    return null;
  }
};

const AttachedDocuments = ({
  requestId,
  files = [],
  requestData: requestDataProp = null,
    filesRefreshCounter = 0,
}) => {
  const requisitionRef = useRef(null);
  const failedHeadUrlsRef = useRef(new Set());
const { getToken, user } = useAuth();  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  const [fileMeta, setFileMeta] = useState([]);
  const [active, setActive] = useState(null);

  // request details for RequisitionPreview
  const [requestData, setRequestData] = useState(null);
  const [requestItems, setRequestItems] = useState([]);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [uploadingRequisition, setUploadingRequisition] = useState(false);
  const [requisitionUploaded, setRequisitionUploaded] = useState(false);

  const [deletingUrl, setDeletingUrl] = useState(null);

const deleteQuotation = async (fileUrl) => {
  if (!fileUrl || !requestId) return;
  // role guard — only procurement officer can delete
  if ((user?.role || "").toLowerCase() !== "procurement officer") return;

  const confirmDelete = window.confirm("Are you sure you want to delete this quotation?");
  if (!confirmDelete) return;

  try {
    setDeletingUrl(fileUrl);
    const token = getToken ? getToken() : null;
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    };

    await axios.delete(
      `${API_BASE_URL}/requests/${requestId}/quotations`,
      {
        headers,
        data: { fileUrl },
      }
    );

    // refresh request data locally so the files list is rebuilt
    try {
      const resp = await axios.get(`${API_BASE_URL}/requests/${requestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = resp.data?.data ?? resp.data ?? resp.data;
      setRequestData(data);
      // fileMeta will be rebuilt by the existing effect that watches requestData
    } catch (err) {
      console.error("Error refreshing request after delete:", err);
    }
  } catch (err) {
    console.error("Failed to delete quotation:", err);
    alert(err?.response?.data?.message || "Failed to delete quotation");
  } finally {
    setDeletingUrl(null);
  }
};

  useEffect(() => {
  // when parent bumps filesRefreshCounter, re-fetch request details and update local state
  if (filesRefreshCounter === undefined || filesRefreshCounter === null) return;
  if (!requestId) return;

  let mounted = true;
  const refresh = async () => {
    try {
      setLoadingRequest(true);
      const token = getToken ? getToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get(`${API_BASE_URL}/requests/${requestId}`, { headers });
      if (!mounted) return;
      const data = resp.data || resp.data?.data || resp.data;
      setRequestData(data);
      setRequestItems(data?.items || []);
    } catch (err) {
      console.error("Error refreshing request data for AttachedDocuments:", err);
    } finally {
      if (mounted) setLoadingRequest(false);
    }
  };

  refresh();

  return () => {
    mounted = false;
  };
}, [filesRefreshCounter, requestId, getToken, API_BASE_URL]);

  useEffect(() => {
    let mounted = true;

    const extractVendorFromFilename = (name, typeKeyword = "requisition") => {
      try {
        const base = name.replace(/\.[^/.]+$/, "");
        // find the last occurrence of the type token (e.g. "-requisition")
        const token = `-${typeKeyword}`.toLowerCase();
        const lowerBase = base.toLowerCase();
        const typeIdx = lowerBase.lastIndexOf(token);
        if (typeIdx > 0) {
          // substring before the "-requisition"
          const before = base.substring(0, typeIdx);
          // find the hyphen that separates requestId and vendor (the last hyphen in `before`)
          const prevHyphen = before.lastIndexOf("-");
          const vendorSegment =
            prevHyphen === -1 ? before : before.substring(prevHyphen + 1);
          // vendor names were saved with underscores for spaces; convert back to spaces
          return vendorSegment.replace(/_/g, " ").trim() || null;
        }
        return null;
      } catch {
        return null;
      }
    };

    const loadFilesFromRequest = async () => {
  if (!requestData) {
    const rawMeta = (files || []).map((url) => {
      const name = getFileNameFromUrl(url);
      const ext = (name.split(".").pop() || "").toLowerCase();
      return { url, name, size: null, ext, type: "unknown", vendor: null };
    });

    if (!mounted) return;
    setFileMeta(rawMeta);

    await Promise.all(
      rawMeta.map(async (m) => {
        if (failedHeadUrlsRef.current.has(m.url)) return;
        // skip HEAD for requisition files to avoid immediate 403 noise
        if (m.type === "requisition") return;
        try {
          const size = await fetchHeadSize(m.url);
          if (!mounted) return;
          if (size == null) {
            failedHeadUrlsRef.current.add(m.url);
            setFileMeta((prev) => prev.filter((p) => p.url !== m.url));
            return;
          }
          setFileMeta((prev) =>
            prev.map((p) => (p.url === m.url ? { ...p, size } : p))
          );
        } catch {
          failedHeadUrlsRef.current.add(m.url);
          setFileMeta((prev) => prev.filter((p) => p.url !== m.url));
        }
      })
    );

    return;
  }

  const reqFiles = Array.isArray(requestData.requestFiles)
    ? requestData.requestFiles
    : [];
  const requisitionFiles = Array.isArray(requestData.requisitionFiles)
    ? requestData.requisitionFiles
    : [];
  const poFiles = Array.isArray(requestData.purchaseOrderFiles)
    ? requestData.purchaseOrderFiles
    : [];
  const quotationFiles = Array.isArray(requestData.quotationFiles)
    ? requestData.quotationFiles
    : [];

  const buildMeta = (arr, typeKey) =>
    (arr || []).map((url) => {
      const name = getFileNameFromUrl(url);
      const ext = (name.split(".").pop() || "").toLowerCase();
      const vendor =
        typeKey === "requisition" ||
        typeKey === "purchaseOrder" ||
        typeKey === "request"
          ? extractVendorFromFilename(name, typeKey)
          : null;
      return { url, name, size: null, ext, type: typeKey, vendor };
    });

  const rawRequisitions = buildMeta(requisitionFiles, "requisition");
  const rawPOs = buildMeta(poFiles, "purchaseOrder");
  const rawReqFiles = buildMeta(reqFiles, "request");
  const rawQuotations = buildMeta(quotationFiles, "quotation");

  const dedupeByVendor = (list) => {
    const map = new Map();
    list.forEach((item) => {
      if (item.vendor) {
        map.set(item.vendor, item);
      } else {
        map.set(Symbol(), item);
      }
    });
    return Array.from(map.values());
  };

  const requisitionsDeduped = dedupeByVendor(rawRequisitions);
  const poDeduped = dedupeByVendor(rawPOs);
  const reqFilesDeduped = dedupeByVendor(rawReqFiles);

  const meta = [
    ...requisitionsDeduped,
    ...poDeduped,
    ...reqFilesDeduped,
    ...rawQuotations,
  ];

  if (!mounted) return;
  setFileMeta(meta);

   await Promise.all(
      meta.map(async (m) => {
        if (failedHeadUrlsRef.current.has(m.url)) return;
        // skip HEAD for requisition files to avoid immediate 403 noise
        if (m.type === "requisition") return;
        try {
          const size = await fetchHeadSize(m.url);
          if (!mounted) return;
          if (size == null) {
            failedHeadUrlsRef.current.add(m.url);
            setFileMeta((prev) => prev.filter((p) => p.url !== m.url));
            return;
          }
          setFileMeta((prev) =>
            prev.map((p) => (p.url === m.url ? { ...p, size } : p))
          );
        } catch {
          failedHeadUrlsRef.current.add(m.url);
          setFileMeta((prev) => prev.filter((p) => p.url !== m.url));
        }
      })
    );
};
    loadFilesFromRequest();

    return () => {
      mounted = false;
    };
  }, [requestData, files]);
  
  useEffect(() => {
    if (!active) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setActive(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  useEffect(() => {
    if (!fileMeta || fileMeta.length === 0) return;

    // compute displayName only when missing to avoid loops
    let quoteCounter = 0;
    let changed = false;
    const next = fileMeta.map((m) => {
      if (m.displayName) return m;

      let display = m.name;

      if (m.type === "quotation") {
        quoteCounter = quoteCounter + 1;
        display =
          quoteCounter === 1
            ? "Quotation File"
            : `Quotation File ${quoteCounter}`;
      } else if (["requisition", "purchaseOrder", "request"].includes(m.type)) {
        const vendor = m.vendor || "Vendor";
        const typeLabel =
          m.type === "requisition"
            ? "Requisition File"
            : m.type === "purchaseOrder"
            ? "Purchase Order File"
            : "Request File";
        display = `${vendor} ${typeLabel}`;
      }

      changed = true;
      return { ...m, displayName: display };
    });

    if (changed) setFileMeta(next);
  }, [fileMeta]);

  const openPreview = (meta) => setActive(meta);
  const closePreview = () => setActive(null);

  const handleDownload = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleShare = async (url, name) => {
    const text = `${name}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("File URL copied to clipboard");
      } catch {
        alert("Share not supported");
      }
    }
  };

  const handlePrint = (url, ext) => {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      alert("Popup blocked — allow popups to print this file.");
      return;
    }
    let content = "";
    if (ext === "pdf") {
      content = `<iframe src="${url}" style="width:100%;height:100vh;border:none;"></iframe>`;
    } else if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      content = `<img src="${url}" style="max-width:100%;height:auto;display:block;margin:0 auto;" />`;
    } else {
      win.location.href = url;
      return;
    }
    win.document.open();
    win.document.write(
      `<!doctype html><html><head><title>Preview</title><style>body{margin:0;background:#fff}</style></head><body>${content}</body></html>`
    );
    win.document.close();
    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch {}
    }, 500);
  };

    const uploadRequisition = async () => {
    if (!requestId) {
      alert("Missing requestId");
      return;
    }

    // make sure we have data to build a standalone requisition HTML
    if (!requestData) {
      alert("Request data not loaded yet.");
      return;
    }

    setUploadingRequisition(true);
    let iframe = null;
    try {
      // build minimal, self-contained HTML from requestData + requestItems
      const escapeHtml = (str = "") =>
        String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

      const req = requestData || {};
      const reqId = req.requestId || req.id || "N/A";
      const createdAt = req.createdAt ? new Date(req.createdAt) : new Date();
      const dateStr = createdAt.toLocaleDateString();
      const requiredDate = new Date(
        createdAt.getTime() + 24 * 60 * 60 * 1000
      ).toLocaleDateString();
      const reference = req.reference || "N/A";
      const currency = req.currency || "NGN";

      const rowsHtml = (requestItems || [])
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
            <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${currency} ${unitPrice.toFixed(
            2
          )}</td>
            <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${
              discount != null ? `${currency} ${discount.toFixed(2)}` : "-"
            }</td>
            <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${
              vat != null ? `${vat}%` : "-"
            }</td>
            <td style="padding:8px;border-bottom:1px solid #e6e6e6;text-align:right;vertical-align:top">${currency} ${Number(
            total
          ).toFixed(2)}</td>
          </tr>`;
        })
        .join("");

      const grandTotal = (requestItems || []).reduce((s, it) => {
        const qty = Number(it.quantity || 0);
        const total =
          it.total != null ? Number(it.total) : Number(it.unitPrice || 0) * qty;
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

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Requisition ${escapeHtml(
        reqId
      )}</title><style>${css}</style></head><body>
        <div class="header">
          <div style="float:left;max-width:60%">
            <div style="width:64px;height:64px;background:#10b981;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;border-radius:8px">G</div>
            <div style="font-weight:700;font-size:18px;margin-top:8px">Hydrodive Nigeria Ltd</div>
            <div style="color:#64748b;margin-top:6px;white-space:pre-line">17, Wharf Road,\nApapa, Lagos\nNigeria.</div>
          </div>
          <div class="meta">
            <div><strong>Number:</strong> ${escapeHtml(reqId)}</div>
            <div><strong>Date:</strong> ${escapeHtml(dateStr)}</div>
            <div><strong>Required:</strong> ${escapeHtml(requiredDate)}</div>
            <div><strong>Reference:</strong> ${escapeHtml(reference)}</div>
          </div>
          <div style="clear:both"></div>
        </div>

        <div style="display:flex;gap:12px;margin-bottom:12px">
          <div style="flex:1;border:2px dashed #e6e6e6;padding:12px;border-radius:8px">
            <div style="font-weight:600;margin-bottom:6px">Issued To:</div>
            <div style="white-space:pre-line;color:#334155">AVL Integrated Technology Solution\nBlock B, Suite 366, Sura Shopping Complex\nIkeja\nLagos</div>
          </div>
          <div style="flex:1;border:2px dashed #e6e6e6;padding:12px;border-radius:8px">
            <div style="font-weight:600;margin-bottom:6px">Ship To:</div>
            <div style="white-space:pre-line;color:#334155">Hydrodive Nigeria Limited\n17, Wharf Road\nApapa\nLagos\nNigeria</div>
          </div>
        </div>

        <div>
          <h4 style="margin:0 0 8px 0">Requisition Items</h4>
          <table>
            <thead>
              <tr style="color:#475569;font-size:12px">
                <th>#</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit</th>
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
                <td colspan="7" style="text-align:right;font-weight:700">Grand Total</td>
                <td style="text-align:right;font-weight:700">${currency} ${Number(
        grandTotal
      ).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="signature">
          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:18px">
            <div>
              <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">Approved by</div>
              <div style="border:1px solid #e6e6e6;padding:12px;border-radius:12px;max-width:360px">
                <svg width="240" height="70" viewBox="0 0 240 70" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 40 C40 10, 80 10, 110 40 S180 70, 230 40" stroke="#036173" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <div style="margin-top:8px;font-weight:600">Procurement Officer</div>
                <div style="font-size:12px;color:#64748b">e-signature • ${new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div style="text-align:right">
              <div style="font-size:12px;color:#94a3b8">Contact</div>
              <div style="font-weight:600">procurement@gemz.com</div>
            </div>
          </div>
        </div>
      </body></html>`;

      // create a hidden same-origin iframe and write the standalone HTML into it
      iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.left = "-9999px";
      iframe.style.top = "0";
      iframe.style.width = "800px";
      iframe.style.height = "1100px";
      document.body.appendChild(iframe);

      const idoc = iframe.contentDocument || iframe.contentWindow.document;
      idoc.open();
      idoc.write(html);
      idoc.close();

      // give browser a moment to render
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(idoc.body, {
        scale: 1,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      // downscale large captures to a reasonable max width in pixels
      const MAX_WIDTH_PX = 1200;
      let sourceCanvas = canvas;
      if (canvas.width > MAX_WIDTH_PX) {
        const scaleDown = MAX_WIDTH_PX / canvas.width;
        const tmp = document.createElement("canvas");
        tmp.width = Math.round(canvas.width * scaleDown);
        tmp.height = Math.round(canvas.height * scaleDown);
        const tctx = tmp.getContext("2d");
        tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
        sourceCanvas = tmp;
      }

      // prepare PDF (A4 points)
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth(); // in points
      const pageHeight = pdf.internal.pageSize.getHeight(); // in points

      // compute pixels per PDF point so we can crop by page height in pixels
      const pxPerPt = sourceCanvas.width / pageWidth;
      const pagePixelHeight = Math.floor(pageHeight * pxPerPt);

      let y = 0;
      let first = true;
      while (y < sourceCanvas.height) {
        const thisPageHeight = Math.min(
          pagePixelHeight,
          sourceCanvas.height - y
        );
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

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.78); // quality 0.78 -> much smaller file

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
      const filename = `${requestId}-requisition.pdf`;
      const file = new File([pdfBlob], filename, { type: "application/pdf" });

      const formData = new FormData();
      formData.append("files", file);

      const token = getToken ? getToken() : null;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const uploadResp = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/requisition-files`,
        formData,
        { headers }
      );

      const uploadedFiles =
        (uploadResp.data &&
          (uploadResp.data.uploadedFiles || uploadResp.data.uploaded_files)) ||
        [];

      const requisitionMeta = (uploadedFiles || []).map((url) => {
        const name = getFileNameFromUrl(url);
        const ext = (name.split(".").pop() || "").toLowerCase();
        return { url, name, size: null, ext, isRequisition: true };
      });

      const others = fileMeta.filter((m) => !m.isRequisition);
      setFileMeta([...requisitionMeta, ...others]);

      setRequisitionUploaded(true);
      alert("Requisition uploaded successfully");
    } catch (err) {
      console.error("Error uploading requisition:", err);
      alert(
        err?.response?.data?.message ||
          "Failed to upload requisition (see console)"
      );
    } finally {
      setUploadingRequisition(false);
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }
  };
    return (
    <>
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Attached Documents
        </h3>

        {loadingRequest ? (
  <div className="p-6 flex items-center justify-center">
    <svg className="animate-spin h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
    <span className="ml-3 text-sm text-slate-600">Refreshing attachments...</span>
  </div>
) : (
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {fileMeta.map((f, i) => (
    <div key={f.url + "_" + i} className="relative">
      {/* Delete button for quotation files — only procurement officer */}
      {((user?.role || "").toLowerCase() === "procurement officer") && f.type === "quotation" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!deletingUrl) deleteQuotation(f.url);
          }}
          disabled={deletingUrl === f.url}
          title="Delete quotation"
          className="absolute right-2 top-2 z-10 px-2 py-1 bg-white border rounded text-red-600 text-xs hover:bg-red-50"
        >
          {deletingUrl === f.url ? "Deleting…" : "✕"}
        </button>
      )}

      <button
        type="button"
        onClick={() => openPreview(f)}
        className="bg-white/90 border-2 border-slate-200 rounded-lg p-3 text-left hover:border-slate-300 transition-colors text-sm w-full"
      >
        <div className="truncate font-semibold text-slate-900">
          {f.displayName || f.name}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {f.size ? formatBytes(f.size) : ""}
        </div>
      </button>
    </div>
  ))}
</div>
)}
      </div>

      {active && active.type === "requisition" && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closePreview}
          />
          <div className="fixed left-1/2 transform -translate-x-1/2 top-12 z-50 w-[95%] md:w-[90%] lg:w-[80%] max-h-[85vh] overflow-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-slate-900 truncate max-w-[360px]">
                    {active.displayName || active.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {active.size ? formatBytes(active.size) : ""}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closePreview}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4">
                {active.ext === "pdf" ? (
                  <iframe
                    title={active.name}
                    src={active.url}
                    style={{ width: "100%", height: "70vh", border: "none" }}
                  />
                ) : ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
                    active.ext
                  ) ? (
                  <img
                    src={active.url}
                    alt={active.name}
                    className="w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-slate-600">
                      Preview not available for this file type. Use Download or
                      Open in new tab.
                    </p>
                    <div className="mt-4">
                      <a
                        href={active.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-500 text-white rounded-md"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Existing file preview modal (unchanged) */}
      {active && active.type !== "requisition" && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closePreview}
          />
          <div className="fixed left-1/2 transform -translate-x-1/2 top-12 z-50 w-[95%] md:w-[90%] lg:w-[80%] max-h-[85vh] overflow-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-slate-900 truncate max-w-[360px]">
                    {active.displayName || active.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {active.size ? formatBytes(active.size) : ""}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={closePreview}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4">
                {active.ext === "pdf" ? (
                  <iframe
                    title={active.name}
                    src={active.url}
                    style={{ width: "100%", height: "70vh", border: "none" }}
                  />
                ) : ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
                    active.ext
                  ) ? (
                  <img
                    src={active.url}
                    alt={active.name}
                    className="w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-slate-600">
                      Preview not available for this file type. Use Download or
                      Open in new tab.
                    </p>
                    <div className="mt-4">
                      <a
                        href={active.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-500 text-white rounded-md"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AttachedDocuments;
