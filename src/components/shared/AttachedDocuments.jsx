import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import RequisitionPreview from "./RequisitionPreview";
import RequestFormPreview from "./RequestFormPreview";
import PurchaseOrderPreview from "./PurchaseOrderPreview";

import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
const arrayBufferToBase64 = (buffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const fetchImageAsDataUrl = async (url, token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const resp = await axios.get(url, { responseType: "arraybuffer", headers });
    const contentType =
      resp.headers && resp.headers["content-type"]
        ? resp.headers["content-type"]
        : "image/png";
    const base64 = arrayBufferToBase64(resp.data);
    return `data:${contentType};base64,${base64}`;
  } catch (err) {
    console.warn("fetchImageAsDataUrl failed:", url, err);
    return null;
  }
};

const AttachedDocuments = ({
  requestId,
  files = [],
  requestData: requestDataProp = null,
  filesRefreshCounter = 0,
  onFilesChanged = () => {},
}) => {
  const requisitionRef = useRef(null);
  const failedHeadUrlsRef = useRef(new Set());
  const { getToken, user } = useAuth();
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

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

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this quotation?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingUrl(fileUrl);
      const token = getToken ? getToken() : null;
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      };

      await axios.delete(`${API_BASE_URL}/requests/${requestId}/quotations`, {
        headers,
        data: { fileUrl },
      });

      // refresh request data locally so the files list is rebuilt
      try {
        const resp = await axios.get(`${API_BASE_URL}/requests/${requestId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = resp.data?.data ?? resp.data ?? resp.data;
        setRequestData(data);
        // notify parent to refresh file list
        try {
          onFilesChanged();
        } catch {}
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

  const deletePaymentAdvice = async (fileUrl) => {
    if (!fileUrl || !requestId) return;
    // role guard — only accounting officer can delete payment advice
    if (
      (user?.role || "").toLowerCase() !== "accounting officer" &&
      (user?.role || "").toLowerCase() !== "accountingofficer"
    )
      return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this payment advice file?"
    );
    if (!confirmDelete) return;

    try {
      setDeletingUrl(fileUrl);
      const token = getToken ? getToken() : null;
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        "Content-Type": "application/json",
      };

      await axios.delete(
        `${API_BASE_URL}/requests/${requestId}/payment-advice-files`,
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
        try {
          onFilesChanged();
        } catch {}
      } catch (err) {
        console.error("Error refreshing request after delete:", err);
      }
    } catch (err) {
      console.error("Failed to delete payment advice:", err);
      alert(err?.response?.data?.message || "Failed to delete payment advice");
    } finally {
      setDeletingUrl(null);
    }
  };

  useEffect(() => {
    // when parent bumps filesRefreshCounter, re-fetch request details and update local state
    if (filesRefreshCounter === undefined || filesRefreshCounter === null)
      return;
    if (!requestId) return;

    let mounted = true;
    const refresh = async () => {
      try {
        setLoadingRequest(true);
        const token = getToken ? getToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`${API_BASE_URL}/requests/${requestId}`, {
          headers,
        });
        if (!mounted) return;
        const data = resp.data || resp.data?.data || resp.data;
        setRequestData(data);
        setRequestItems(data?.items || []);
      } catch (err) {
        console.error(
          "Error refreshing request data for AttachedDocuments:",
          err
        );
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
    // when parent bumps filesRefreshCounter, re-fetch request details and update local state
    if (filesRefreshCounter === undefined || filesRefreshCounter === null)
      return;
    if (!requestId) return;

    let mounted = true;
    const refresh = async () => {
      try {
        setLoadingRequest(true);
        const token = getToken ? getToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`${API_BASE_URL}/requests/${requestId}`, {
          headers,
        });
        if (!mounted) return;
        const data = resp.data || resp.data?.data || resp.data;
        setRequestData(data);
        setRequestItems(data?.items || []);
      } catch (err) {
        console.error(
          "Error refreshing request data for AttachedDocuments:",
          err
        );
      } finally {
        if (mounted) setLoadingRequest(false);
      }
    };

    refresh();

    return () => {
      mounted = false;
    };
    // removed onFilesChanged from deps to avoid re-renders caused by unstable parent callback
  }, [filesRefreshCounter, requestId, getToken, API_BASE_URL]);

  useEffect(() => {
    let mounted = true;

    const extractVendorFromFilename = (name, typeKeyword = "requisition") => {
      try {
        const base = name.replace(/\.[^/.]+$/, "");
        const token = `-${typeKeyword}`.toLowerCase();
        const lowerBase = base.toLowerCase();
        const typeIdx = lowerBase.lastIndexOf(token);
        if (typeIdx > 0) {
          const before = base.substring(0, typeIdx);
          const prevHyphen = before.lastIndexOf("-");
          const vendorSegment =
            prevHyphen === -1 ? before : before.substring(prevHyphen + 1);
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
            if (m.type === "requisition" || m.type === "purchaseOrder") return;
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
      const invoiceFiles = Array.isArray(requestData.invoiceFiles)
        ? requestData.invoiceFiles
        : [];
      const poFiles = Array.isArray(requestData.purchaseOrderFiles)
        ? requestData.purchaseOrderFiles
        : [];
      const quotationFiles = Array.isArray(requestData.quotationFiles)
        ? requestData.quotationFiles
        : [];
      const paymentAdviceFiles = Array.isArray(requestData.paymentAdviceFiles)
        ? requestData.paymentAdviceFiles
        : [];
      console.log(
        "AttachedDocuments: requestData keys:",
        Object.keys(requestData || {})
      );
      console.log("AttachedDocuments: requestData sample (top-level):", {
        requestFiles: reqFiles?.length,
        requisitionFiles: requisitionFiles?.length,
        purchaseOrderFiles: poFiles?.length,
        quotationFiles: quotationFiles?.length,
        paymentAdviceFiles: paymentAdviceFiles?.length,
        invoiceFiles: invoiceFiles?.length,
      });

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
      const rawPaymentAdvice = buildMeta(paymentAdviceFiles, "paymentAdvice");
      const rawInvoices = buildMeta(invoiceFiles, "invoice");

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
        ...rawPaymentAdvice,
        ...rawInvoices,
      ];

      console.log("AttachedDocuments: poFiles:", poFiles);
      console.log("AttachedDocuments: rawPOs:", rawPOs);
      console.log("AttachedDocuments: poDeduped:", poDeduped);
      console.log(
        "AttachedDocuments: meta (summary):",
        meta.map((m) => ({ type: m.type, vendor: m.vendor, name: m.name }))
      );

      if (!mounted) return;
      setFileMeta(meta);

      await Promise.all(
        meta.map(async (m) => {
          if (failedHeadUrlsRef.current.has(m.url)) return;
          // skip HEAD for requisition files to avoid immediate 403 noise
          if (m.type === "requisition" || m.type === "purchaseOrder") return;
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
  }, [requestData, files, getToken]);

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
      } else if (m.type === "paymentAdvice") {
        display = "Payment Advice";
      } else if (m.type === "invoice") {
        display = "Invoice";
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

  // live preview refs / state and handlers (requisition only)
  const livePreviewRef = useRef(null);
  const [downloadingPreview, setDownloadingPreview] = useState(false);

  /* helper: copy computed styles from source element to target element */
  const copyComputedStyles = (sourceEl, targetEl) => {
    try {
      const cs = window.getComputedStyle(sourceEl);
      let cssText = "";
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        const val = cs.getPropertyValue(prop);
        const priority = cs.getPropertyPriority(prop);
        cssText += `${prop}: ${val}${priority ? " !important" : ""}; `;
      }
      targetEl.style.cssText = cssText;
    } catch (e) {
      // ignore failures copying styles
    }
  };

  /* helper: deep clone DOM node into a different document, inlining computed styles and handling images/canvas */
  const cloneNodeWithInlineStyles = (sourceNode, targetDoc) => {
    if (sourceNode.nodeType === Node.TEXT_NODE) {
      return targetDoc.createTextNode(sourceNode.textContent || "");
    }
    if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
      return targetDoc.createTextNode("");
    }

    const tagName = sourceNode.tagName.toLowerCase();
    const cloneEl = targetDoc.createElement(tagName);

    // copy attributes except style (we inline styles)
    const attrs = sourceNode.attributes || [];
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs[i];
      if (a.name === "style") continue;
      try {
        cloneEl.setAttribute(a.name, a.value);
      } catch {}
    }

    // special handling: canvas -> image, img -> ensure absolute src
    if (tagName === "canvas") {
      try {
        const dataUrl = sourceNode.toDataURL("image/png");
        const img = targetDoc.createElement("img");
        img.src = dataUrl;
        copyComputedStyles(sourceNode, img);
        return img;
      } catch {}
    }

    if (tagName === "img") {
      try {
        cloneEl.src = sourceNode.src || sourceNode.getAttribute("src") || "";
        cloneEl.setAttribute("crossorigin", "anonymous");
      } catch {}
    }

    // inline computed styles
    copyComputedStyles(sourceNode, cloneEl);

    // recurse children
    for (let c = 0; c < sourceNode.childNodes.length; c++) {
      const child = sourceNode.childNodes[c];
      const childClone = cloneNodeWithInlineStyles(child, targetDoc);
      if (childClone) cloneEl.appendChild(childClone);
    }

    return cloneEl;
  };

  const handlePrintLive = async () => {
    if (!livePreviewRef.current) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "0";
    document.body.appendChild(iframe);

    try {
      const idoc = iframe.contentDocument || iframe.contentWindow.document;

      // copy link/style tags from parent so preview prints similarly
      const styles = Array.from(
        document.querySelectorAll("link[rel='stylesheet'], style")
      )
        .map((n) => n.outerHTML)
        .join("\n");

      // base tag for resolving relative URLs in cloned content
      const base = `<base href="${location.origin}">`;
      const headStyles = `${base}${styles}<style>
      @page { size: A4; margin: 0; }
      html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
      body {
        background: #fff;
        color: #111;
        -webkit-print-color-adjust: exact;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
    </style>`;

      idoc.open();
      idoc.write(
        `<!doctype html><html><head><meta charset="utf-8">${headStyles}</head><body></body></html>`
      );
      idoc.close();

      // allow iframe to initialize
      await new Promise((r) => setTimeout(r, 80));

      // clone the live preview node into the iframe document with inline styles
      const cloned = cloneNodeWithInlineStyles(livePreviewRef.current, idoc);
      idoc.body.innerHTML = ""; // clear any existing content
      idoc.body.appendChild(cloned);

      // allow fonts/images to load and browser to compute layout
      await new Promise((r) => setTimeout(r, 300));
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (err) {
      console.error("Print live preview failed (clone):", err);
      alert("Failed to print preview. See console for details.");
    } finally {
      // remove iframe after print dialog opens
      setTimeout(() => {
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }
  };

  const handleDownloadLive = async () => {
    if (!livePreviewRef.current) return;
    setDownloadingPreview(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const canvas = await html2canvas(livePreviewRef.current, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: 1,
      });

      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pxPerPt = canvas.width / pageWidth;
      const pagePixelHeight = Math.floor(pageHeight * pxPerPt);

      let y = 0;
      let first = true;
      while (y < canvas.height) {
        const thisPageHeight = Math.min(pagePixelHeight, canvas.height - y);
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = thisPageHeight;
        const pctx = pageCanvas.getContext("2d");
        pctx.drawImage(
          canvas,
          0,
          y,
          canvas.width,
          thisPageHeight,
          0,
          0,
          canvas.width,
          thisPageHeight
        );

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.78);
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

      const blob = pdf.output("blob");
      const filename = `${requestId || "requisition"}-preview.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download live preview failed:", err);
      alert("Failed to generate PDF. See console for details.");
    } finally {
      setDownloadingPreview(false);
    }
  };

  const getVendorDisplayName = (vendorOrName) => {
    if (!vendorOrName) return "";
    if (typeof vendorOrName === "string") return vendorOrName;
    // vendorOrName may be an object — prefer common fields
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

  const vendorGroups = React.useMemo(() => {
    const items =
      (requestData && Array.isArray(requestData.items)
        ? requestData.items
        : requestItems) || [];
    const map = new Map();
    items.forEach((it) => {
      // vendor id may be in vendorId or inside vendor object
      const vid =
        it.vendorId ||
        (it.vendor && (it.vendor.vendorId || it.vendor.id)) ||
        null;
      if (!vid) return; // skip items with no vendor id
      const name =
        it.vendorName ||
        getVendorDisplayName(it.vendor) ||
        getVendorDisplayName(it.vendorName) ||
        String(vid);
      if (!map.has(vid))
        map.set(vid, { vendorId: vid, vendorName: name, items: [] });
      map.get(vid).items.push(it);
    });
    return Array.from(map.values());
  }, [requestData, requestItems]);

  const requestFormGroups = React.useMemo(() => {
    const items =
      (requestData && Array.isArray(requestData.items)
        ? requestData.items
        : requestItems) || [];
    const map = new Map();

    items.forEach((it) => {
      const vid =
        it.vendorId ||
        (it.vendor && (it.vendor.vendorId || it.vendor.id)) ||
        null;

      if (vid) {
        const name =
          it.vendorName ||
          getVendorDisplayName(it.vendor) ||
          getVendorDisplayName(it.vendorName) ||
          String(vid);
        if (!map.has(vid))
          map.set(vid, { vendorId: vid, vendorName: name, items: [] });
        map.get(vid).items.push(it);
        return;
      }

      // no-vendor group (single key)
      const noKey = "NO_VENDOR";
      if (!map.has(noKey))
        map.set(noKey, { vendorId: null, vendorName: null, items: [] });
      map.get(noKey).items.push(it);
    });

    // return array of groups; vendor groups and optional no-vendor group
    return Array.from(map.values());
  }, [requestData, requestItems]);

  return (
    <>
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Attached Documents
        </h3>

        {loadingRequest ? (
          <div className="p-6 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="ml-3 text-sm text-slate-600">
              Refreshing attachments...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 grid-flow-row-dense">
            {requestFormGroups &&
              requestFormGroups.length > 0 &&
              requestFormGroups.map((g, idx) => (
                <div
                  key={String(g.vendorId ?? `no-vendor-${idx}`)}
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() =>
                      openPreview({
                        type: "requestForm",
                        name: g.vendorName
                          ? `${g.vendorName} RequestForm`
                          : "No vendor RequestForm",
                        displayName: g.vendorName
                          ? `${g.vendorName} RequestForm`
                          : "No vendor RequestForm",
                        vendorId: g.vendorId,
                        vendorName: g.vendorName,
                        items: g.items,
                      })
                    }
                    className="bg-white/90 border-2 border-slate-200 rounded-lg p-3 text-left hover:border-slate-300 transition-colors text-sm w-full"
                  >
                    <div className="truncate font-semibold text-slate-900">
                      {g.vendorName
                        ? `${g.vendorName} RequestForm`
                        : "No vendor RequestForm"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Request Form (items: {g.items.length})
                    </div>
                  </button>
                </div>
              ))}
            {vendorGroups &&
              vendorGroups.length > 0 &&
              vendorGroups.map((g) => (
                <div key={String(g.vendorId)} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      openPreview({
                        type: "requisition",
                        name: `${g.vendorName} Requisition Preview`,
                        displayName: `${g.vendorName} Requisition Preview`,
                        vendorId: g.vendorId,
                        vendorName: g.vendorName,
                        items: g.items,
                      })
                    }
                    className="bg-white/90 border-2 border-slate-200 rounded-lg p-3 text-left hover:border-slate-300 transition-colors text-sm w-full"
                  >
                    <div className="truncate font-semibold text-slate-900">
                      {g.vendorName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Requisition Preview (items: {g.items.length})
                    </div>
                  </button>
                </div>
              ))}
            {vendorGroups &&
              vendorGroups.length > 0 &&
              vendorGroups.map((g) => (
                <div key={`po-${String(g.vendorId)}`} className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      openPreview({
                        type: "purchaseOrder",
                        name: `${g.vendorName} Purchase Order`,
                        displayName: `${g.vendorName} Purchase Order`,
                        vendorId: g.vendorId,
                        vendorName: g.vendorName,
                        items: g.items,
                      })
                    }
                    className="bg-white/90 border-2 border-slate-200 rounded-lg p-3 text-left hover:border-slate-300 transition-colors text-sm w-full"
                  >
                    <div className="truncate font-semibold text-slate-900">
                      {g.vendorName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Purchase Order (items: {g.items.length})
                    </div>
                  </button>
                </div>
              ))}

            {fileMeta.map((f, i) => (
              <div key={f.url + "_" + i} className="relative">
                {(user?.role || "").toLowerCase() === "procurement officer" &&
                  f.type === "quotation" && (
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
                {((user?.role || "").toLowerCase() === "accounting officer" ||
                  (user?.role || "").toLowerCase() === "accountingofficer") &&
                  f.type === "paymentAdvice" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!deletingUrl) deletePaymentAdvice(f.url);
                      }}
                      disabled={deletingUrl === f.url}
                      title="Delete payment advice"
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

      {active && active.type === "requestForm" && (
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
                  {active?.type === "requestForm" ? (
                    <>
                      <button
                        onClick={handlePrintLive}
                        className="px-3 py-2 bg-white border rounded-md text-sm"
                        title="Print preview"
                      >
                        Print
                      </button>
                      <button
                        onClick={handleDownloadLive}
                        disabled={downloadingPreview}
                        className="px-3 py-2 bg-white border rounded-md text-sm"
                        title="Download PDF"
                      >
                        {downloadingPreview ? "Preparing…" : "Download PDF"}
                      </button>
                    </>
                  ) : null}

                  <button
                    onClick={closePreview}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div
                  ref={livePreviewRef}
                  style={{
                    width: "100%",
                    minHeight: "60vh",
                    background: "#fff",
                  }}
                >
                  <RequestFormPreview
                    request={requestData || {}}
                    items={
                      active?.items && active.items.length
                        ? active.items
                        : requestItems || []
                    }
                    requestId={
                      active?.items && active.items.length ? null : requestId
                    }
                    token={getToken ? getToken() : null}
                    apiBase={API_BASE_URL}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
                    onClick={handlePrintLive}
                    className="px-3 py-2 bg-white border rounded-md text-sm"
                    title="Print preview"
                  >
                    Print
                  </button>
                  <button
                    onClick={handleDownloadLive}
                    disabled={downloadingPreview}
                    className="px-3 py-2 bg-white border rounded-md text-sm"
                    title="Download PDF"
                  >
                    {downloadingPreview ? "Preparing…" : "Download PDF"}
                  </button>
                  <button
                    onClick={closePreview}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div
                  ref={livePreviewRef}
                  style={{
                    width: "100%",
                    minHeight: "60vh",
                    background: "#fff",
                  }}
                >
                  <RequisitionPreview
                    request={requestData || {}}
                    // if we opened a vendor tile we pass only that vendor's items; else fall back to full request items
                    items={
                      active?.items && active.items.length
                        ? active.items
                        : requestItems || []
                    }
                    // when vendor-specific preview is used, avoid requestId so RequisitionPreview doesn't re-fetch the request
                    requestId={
                      active?.items && active.items.length ? null : requestId
                    }
                    token={getToken ? getToken() : null}
                    apiBase={API_BASE_URL}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {active && active.type === "purchaseOrder" && (
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
                    onClick={handlePrintLive}
                    className="px-3 py-2 bg-white border rounded-md text-sm"
                    title="Print preview"
                  >
                    Print
                  </button>
                  <button
                    onClick={handleDownloadLive}
                    disabled={downloadingPreview}
                    className="px-3 py-2 bg-white border rounded-md text-sm"
                    title="Download PDF"
                  >
                    {downloadingPreview ? "Preparing…" : "Download PDF"}
                  </button>
                  <button
                    onClick={closePreview}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div
                  ref={livePreviewRef}
                  style={{
                    width: "100%",
                    minHeight: "60vh",
                    background: "#fff",
                  }}
                >
                  <PurchaseOrderPreview
                    request={requestData || {}}
                    items={
                      active?.items && active.items.length
                        ? active.items
                        : requestItems || []
                    }
                    requestId={
                      active?.items && active.items.length ? null : requestId
                    }
                    token={getToken ? getToken() : null}
                    apiBase={API_BASE_URL}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {active &&
        active.type &&
        !["requisition", "requestForm"].includes(active.type) && (
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
                    <p></p>
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
