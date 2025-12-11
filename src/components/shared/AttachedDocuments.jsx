import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import RequisitionPreview from "./RequisitionPreview";
import RequestFormPreview from "./RequestFormPreview";
import PurchaseOrderPreview from "./PurchaseOrderPreview";
import EmailComposer from "../pages/EmailComposer";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
// ...existing code...

const AttachedDocuments = ({
  requestId,
  files = [],
  filesRefreshCounter = 0,
  onFilesChanged = () => {},
}) => {
  const failedHeadUrlsRef = useRef(new Set());
  const { getToken, user } = useAuth();
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  const [fileMeta, setFileMeta] = useState([]);
  const [active, setActive] = useState(null);

  const [requestData, setRequestData] = useState(null);
  const [requestItems, setRequestItems] = useState([]);
  const [loadingRequest, setLoadingRequest] = useState(false);

  const [deletingUrl, setDeletingUrl] = useState(null);
  const [showPurchaseOrder, setShowPurchaseOrder] = useState(false);

  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailInitialAttachments, setEmailInitialAttachments] = useState([]);
  const [preparingEmailPdf, setPreparingEmailPdf] = useState(false);
  function isAtOrPastProcurementManager(request) {
    const states = [
      "PENDING_PROCUREMENT_MANAGER_APPROVAL",
      "PENDING_INVOICE_CONTROLLER_APPROVAL",
      "PENDING_ACCOUNTING_OFFICER_APPROVAL",
      "PENDING_DELIVERY_BASE_APPROVAL",
      "COMPLETED",
      "APPROVED",
      "REJECTED",
    ];
    const currentState =
      request.currentState ||
      (request.flow && request.flow.currentState) ||
      request.status ||
      "";
    return states.includes(currentState);
  }

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

  // Build a unified list of all previewable documents for the folder
  const folderDocs = React.useMemo(() => {
    const docs = [];

    // Request Form(s)
    if (requestData?.doVendorSplit) {
      if (requestFormGroups && requestFormGroups.length > 0) {
        requestFormGroups.forEach((g, idx) => {
          docs.push({
            type: "requestForm",
            name: g.vendorName ? `${g.vendorName} RequestForm` : "Request Form",
            displayName: g.vendorName
              ? `${g.vendorName} RequestForm`
              : "Request Form",
            vendorId: g.vendorId,
            vendorName: g.vendorName,
            items:
              requestData &&
              Array.isArray(requestData.originalItemsSnapshot) &&
              requestData.originalItemsSnapshot.length > 0 &&
              isAtOrPastProcurementManager(requestData)
                ? requestData.originalItemsSnapshot
                : g.items,
          });
        });
      }
    } else {
      docs.push({
        type: "requestForm",
        name: " Request Form",
        displayName: " Request Form",
        vendorId: null,
        vendorName: "Multiple Vendors",
        items:
          requestData &&
          Array.isArray(requestData.originalItemsSnapshot) &&
          requestData.originalItemsSnapshot.length > 0 &&
          isAtOrPastProcurementManager(requestData)
            ? requestData.originalItemsSnapshot
            : requestData?.items || requestItems || [],
      });
    }

    // Requisition(s)
    if (requestData?.doVendorSplit) {
      if (vendorGroups && vendorGroups.length > 0) {
        vendorGroups.forEach((g) => {
          docs.push({
            type: "requisition",
            name: `${g.vendorName} Requisition Preview`,
            displayName: `${g.vendorName} Requisition Preview`,
            vendorId: g.vendorId,
            vendorName: g.vendorName,
            items:
              requestData &&
              Array.isArray(requestData.originalItemsSnapshot) &&
              requestData.originalItemsSnapshot.length > 0 &&
              isAtOrPastProcurementManager(requestData)
                ? requestData.originalItemsSnapshot
                : g.items,
          });
        });
      }
    } else if (vendorGroups && vendorGroups.length > 0) {
      docs.push({
        type: "requisition",
        name: " Requisition File",
        displayName: " Requisition File",
        vendorId: null,
        vendorName: "Multiple Vendors",
        items:
          requestData &&
          Array.isArray(requestData.originalItemsSnapshot) &&
          requestData.originalItemsSnapshot.length > 0 &&
          isAtOrPastProcurementManager(requestData)
            ? requestData.originalItemsSnapshot
            : vendorGroups.flatMap((g) => g.items),
      });
    }

    // Purchase Order(s)
    if (showPurchaseOrder && vendorGroups && vendorGroups.length > 0) {
      vendorGroups.forEach((g) => {
        docs.push({
          type: "purchaseOrder",
          name: `${g.vendorName} Purchase Order`,
          displayName: `${g.vendorName} Purchase Order`,
          vendorId: g.vendorId,
          vendorName: g.vendorName,
          items: g.items,
        });
      });
    }

    // Other files (quotations, payment advice, invoices, images, etc.)
    fileMeta.forEach((f) => {
      docs.push({ ...f });
    });

    return docs;
  }, [
    requestData,
    requestItems,
    requestFormGroups,
    vendorGroups,
    showPurchaseOrder,
    fileMeta,
  ]);

  // Keyboard navigation for folder modal
  useEffect(() => {
    if (!active || !active.folder) return;
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setActive((prev) =>
          prev && prev.folder && prev.index > 0
            ? { ...prev, index: prev.index - 1 }
            : prev
        );
      }
      if (e.key === "ArrowRight") {
        setActive((prev) =>
          prev && prev.folder && prev.index < folderDocs.length - 1
            ? { ...prev, index: prev.index + 1 }
            : prev
        );
      }
      if (e.key === "Escape") {
        setActive(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, folderDocs.length]);

  const generatePdfFromElement = async (element, filename) => {
    const rect = element.getBoundingClientRect();

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "-10000px";
    container.style.top = "0";
    container.style.width = rect.width + "px";
    container.style.backgroundColor = "#ffffff";
    container.style.zIndex = "-9999";

    const clone = element.cloneNode(true);
    container.appendChild(clone);
    document.body.appendChild(container);

    const allElements = container.querySelectorAll("*");
    allElements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      const color = computed.color;
      const bgColor = computed.backgroundColor;
      const borderColor = computed.borderColor;

      if (
        color &&
        (color.includes("oklch") ||
          color.includes("oklab") ||
          color.includes("color("))
      ) {
        el.style.color = "#000000";
      }
      if (
        bgColor &&
        (bgColor.includes("oklch") ||
          bgColor.includes("oklab") ||
          bgColor.includes("color("))
      ) {
        el.style.backgroundColor = "#ffffff";
      }
      if (
        borderColor &&
        (borderColor.includes("oklch") ||
          borderColor.includes("oklab") ||
          borderColor.includes("color("))
      ) {
        el.style.borderColor = "#cccccc";
      }
    });

    const images = container.querySelectorAll("img");
    images.forEach((img) => {
      const src = img.src || "";
      if (
        src.includes("s3.") ||
        src.includes("amazonaws.com") ||
        src.includes("cloudinary") ||
        (src.startsWith("http") && !src.startsWith(window.location.origin))
      ) {
        const placeholder = document.createElement("div");
        placeholder.style.width = img.width ? img.width + "px" : "100px";
        placeholder.style.height = img.height ? img.height + "px" : "50px";
        placeholder.style.backgroundColor = "#f0f0f0";
        placeholder.style.border = "1px solid #ddd";
        placeholder.style.display = "flex";
        placeholder.style.alignItems = "center";
        placeholder.style.justifyContent = "center";
        placeholder.style.fontSize = "10px";
        placeholder.style.color = "#666";
        placeholder.textContent = "[Signature]";
        if (img.parentNode) {
          img.parentNode.replaceChild(placeholder, img);
        }
      } else if (
        src.startsWith("/") ||
        src.startsWith(window.location.origin)
      ) {
        img.crossOrigin = "anonymous";
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: rect.width,
      windowWidth: rect.width,
      onclone: (clonedDoc) => {
        const styles = clonedDoc.querySelectorAll("style");
        styles.forEach((style) => {
          if (style.textContent) {
            style.textContent = style.textContent
              .replace(/oklch\([^)]*\)/gi, "#666666")
              .replace(/oklab\([^)]*\)/gi, "#666666")
              .replace(/color\([^)]*\)/gi, "#666666")
              .replace(/lab\([^)]*\)/gi, "#666666")
              .replace(/lch\([^)]*\)/gi, "#666666");
          }
        });

        const allEls = clonedDoc.querySelectorAll("*");
        allEls.forEach((el) => {
          const style = el.getAttribute("style") || "";
          if (
            style.includes("oklch") ||
            style.includes("oklab") ||
            style.includes("color(") ||
            style.includes("lab(") ||
            style.includes("lch(")
          ) {
            el.setAttribute(
              "style",
              style
                .replace(/oklch\([^)]*\)/gi, "#666666")
                .replace(/oklab\([^)]*\)/gi, "#666666")
                .replace(/color\([^)]*\)/gi, "#666666")
                .replace(/lab\([^)]*\)/gi, "#666666")
                .replace(/lch\([^)]*\)/gi, "#666666")
            );
          }
        });
      },
    });

    document.body.removeChild(container);

    const imgData = canvas.toDataURL("image/png", 1.0);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      let remainingHeight = imgHeight;
      let currentY = 0;
      let pageIndex = 0;

      while (remainingHeight > 0) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const sliceHeight = Math.min(pageHeight, remainingHeight);
        const sourceY = (currentY / imgHeight) * canvas.height;
        const sourceH = (sliceHeight / imgHeight) * canvas.height;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.ceil(sourceH);

        const sliceCtx = sliceCanvas.getContext("2d");
        sliceCtx.fillStyle = "#ffffff";
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        sliceCtx.drawImage(
          canvas,
          0,
          Math.floor(sourceY),
          canvas.width,
          Math.ceil(sourceH),
          0,
          0,
          sliceCanvas.width,
          sliceCanvas.height
        );

        const sliceData = sliceCanvas.toDataURL("image/png", 1.0);
        pdf.addImage(sliceData, "PNG", 0, 0, imgWidth, sliceHeight);

        remainingHeight -= sliceHeight;
        currentY += sliceHeight;
        pageIndex++;
      }
    }

    const pdfBlob = pdf.output("blob");
    return new File([pdfBlob], filename, { type: "application/pdf" });
  };

  const handleSendAsMailFromRequestForm = async () => {
    if (!livePreviewRef.current) {
      alert("Preview content not found");
      return;
    }

    setPreparingEmailPdf(true);

    try {
      const reqId =
        requestData?.requestId || requestData?.id || requestId || "REQ-XXXX";
      const filename = `Request_Form_${reqId}.pdf`;

      const pdfFile = await generatePdfFromElement(
        livePreviewRef.current,
        filename
      );

      setEmailInitialAttachments([pdfFile]);
      setActive(null);
      setTimeout(() => setShowEmailComposer(true), 120);
    } catch (err) {
      console.error("Failed to generate PDF for email:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPreparingEmailPdf(false);
    }
  };

  useEffect(() => {
    if (!requestId) return;
    let mounted = true;
    const fetchFlow = async () => {
      try {
        const token = getToken ? getToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(
          `${API_BASE_URL}/requests/${encodeURIComponent(requestId)}/flow`,
          { headers }
        );
        if (!mounted) return;
        const data = resp.data || resp.data?.data || resp.data;
        const path = Array.isArray(data?.path) ? data.path : [];
        const targetState = "PENDING_PROCUREMENT_MANAGER_APPROVAL";
        const targetIndex = path.findIndex((p) => p.state === targetState);
        const currentIndex = path.findIndex((p) => p.status === "current");
        const shouldShow =
          targetIndex !== -1 &&
          currentIndex !== -1 &&
          currentIndex >= targetIndex;
        setShowPurchaseOrder(Boolean(shouldShow));
      } catch {}
    };
    fetchFlow();
    return () => {
      mounted = false;
    };
  }, [requestId, getToken, API_BASE_URL]);
  // ...existing code...

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
        try {
          onFilesChanged();
        } catch {}
      } catch {}
    } catch (err) {
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
      } catch {}
    } catch (err) {
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
      } catch {
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
      } catch {
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
        const jobCompletionFiles = Array.isArray(requestData.jobCompletionCertificateFiles)
  ? requestData.jobCompletionCertificateFiles
  : [];
      const requestImages = Array.isArray(requestData.requestImages)
        ? requestData.requestImages
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
      const rawPaymentAdvice = buildMeta(paymentAdviceFiles, "paymentAdvice");
      const rawInvoices = buildMeta(invoiceFiles, "invoice");
      const rawRequestImages = buildMeta(requestImages, "requestImage");
      const rawJobCompletion = buildMeta(jobCompletionFiles, "jobCompletion");

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
        ...rawRequestImages,
        ...rawJobCompletion, 
      ];

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
      } else if (m.type === "jobCompletion") {
  display = "Waybill ";
}
      else if (m.type === "requestImage") {
        // ✅ ADD: Display name for request images
        // Count how many requestImages we've seen so far
        const imageIndex = fileMeta
          .slice(0, fileMeta.indexOf(m) + 1)
          .filter((x) => x.type === "requestImage").length;
        display = `Request Image ${imageIndex}`;
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
    } catch {}
  };

  const cloneNodeWithInlineStyles = (sourceNode, targetDoc) => {
    if (sourceNode.nodeType === Node.TEXT_NODE) {
      return targetDoc.createTextNode(sourceNode.textContent || "");
    }
    if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
      return targetDoc.createTextNode("");
    }

    const tagName = sourceNode.tagName.toLowerCase();
    const cloneEl = targetDoc.createElement(tagName);

    const attrs = sourceNode.attributes || [];
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs[i];
      if (a.name === "style") continue;
      try {
        cloneEl.setAttribute(a.name, a.value);
      } catch {}
    }

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

    copyComputedStyles(sourceNode, cloneEl);

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
    } catch {
      alert("Failed to print preview. See console for details.");
    } finally {
      setTimeout(() => {
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    }
  };

  const getDownloadFilename = (type, vendorName) => {
    const reqId =
      requestData?.requestId || requestData?.id || requestId || "document";
    const vendorPart = vendorName ? `_${vendorName.replace(/\s+/g, "_")}` : "";

    switch (type) {
      case "requestForm":
        return `Request_Form_${reqId}${vendorPart}.pdf`;
      case "requisition":
        return `Requisition_${reqId}${vendorPart}.pdf`;
      case "purchaseOrder":
        return `Purchase_Order_${reqId}${vendorPart}.pdf`;
      default:
        return `${reqId}-preview.pdf`;
    }
  };

  const handleDownloadLive = async () => {
    if (!livePreviewRef.current) {
      alert("Preview content not found");
      return;
    }

    setDownloadingPreview(true);

    try {
      const filename = getDownloadFilename(active?.type, active?.vendorName);
      const pdfFile = await generatePdfFromElement(
        livePreviewRef.current,
        filename
      );

      const url = URL.createObjectURL(pdfFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try the Print option instead.");
    } finally {
      setDownloadingPreview(false);
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
          <>
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setActive({ folder: true, index: 0 })}
                className="flex items-center gap-4 px-6 py-5 rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 shadow hover:shadow-lg transition-all w-full sm:w-auto"
                style={{ minWidth: 260 }}
                title="Open all attached documents"
              >
                <span className="text-3xl">📁</span>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-slate-900 text-base">
                    All Documents
                  </span>
                  <span className="text-xs text-slate-600 mt-1">
                    {folderDocs.length} document
                    {folderDocs.length === 1 ? "" : "s"}
                  </span>
                </div>
                <span className="ml-auto text-slate-400 text-lg">&#9654;</span>
              </button>
            </div>
            {/* <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 grid-flow-row-dense">
         {requestData?.doVendorSplit
  ? (
    requestFormGroups &&
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
                : " RequestForm",
              displayName: g.vendorName
                ? `${g.vendorName} RequestForm`
                : " RequestForm",
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
              : " RequestForm"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Request Form (items: {g.items.length})
          </div>
        </button>
      </div>
    ))
  )
  : (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          openPreview({
            type: "requestForm",
            name: "Multiple Vendors Request Form",
            displayName: "Multiple Vendors Request Form",
            vendorId: null,
            vendorName: "Multiple Vendors",
            items: (requestData?.items || requestItems || []),
          })
        }
        className="bg-white/90 border-2 border-slate-200 rounded-lg p-3 text-left hover:border-slate-300 transition-colors text-sm w-full"
      >
        <div className="truncate font-semibold text-slate-900">
          Multiple Vendors Request Form
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Request Form (items: {(requestData?.items || requestItems || []).length})
        </div>
      </button>
    </div>
  )
}
            {requestData?.doVendorSplit
              ? vendorGroups &&
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
                ))
              : vendorGroups &&
                vendorGroups.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        openPreview({
                          type: "requisition",
                          name: "Multiple Vendors Requisition File",
                          displayName: "Multiple Vendors Requisition File",
                          vendorId: null,
                          vendorName: "Multiple Vendors",
                          items: vendorGroups.flatMap((g) => g.items),
                        })
                      }
                      className="bg-white/90 border-2 border-slate-200 rounded-lg p-3 text-left hover:border-slate-300 transition-colors text-sm w-full"
                    >
                      <div className="truncate font-semibold text-slate-900">
                        Multiple Vendors Requisition File
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Requisition Preview (items:{" "}
                        {vendorGroups.flatMap((g) => g.items).length})
                      </div>
                    </button>
                  </div>
                )}
            {showPurchaseOrder &&
              vendorGroups &&
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
          </div> */}
          </>
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
                  {active.vendorId === null &&
                    ((user?.role || "").toLowerCase() ===
                      "procurement officer" ||
                      (user?.role || "").toLowerCase() ===
                        "procurementofficer") && (
                      <button
                        onClick={handleSendAsMailFromRequestForm}
                        disabled={preparingEmailPdf}
                        className={`px-3 py-2 rounded-lg shadow-md transition text-sm flex items-center gap-2 ${
                          preparingEmailPdf
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                      >
                        ✉️{" "}
                        {preparingEmailPdf ? "Preparing PDF…" : "Send as Mail"}
                      </button>
                    )}
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
                      requestData &&
                      Array.isArray(requestData.originalItemsSnapshot) &&
                      requestData.originalItemsSnapshot.length > 0 &&
                      isAtOrPastProcurementManager(requestData)
                        ? requestData.originalItemsSnapshot
                        : doc.items
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
                    doVendorSplit={requestData?.doVendorSplit}
                    request={requestData || {}}
                    items={
                      requestData &&
                      Array.isArray(requestData.originalItemsSnapshot) &&
                      requestData.originalItemsSnapshot.length > 0 &&
                      isAtOrPastProcurementManager(requestData)
                        ? requestData.originalItemsSnapshot
                        : active?.items && active.items.length
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
        !["requisition", "requestForm", "purchaseOrder"].includes(
          active.type
        ) && (
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
                      onClick={() => handleDownload(active.url)}
                      className="px-3 py-2 bg-white border rounded-md text-sm"
                      title="Download file"
                    >
                      Download
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
      {active && active.folder && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closePreview}
            tabIndex={-1}
          />
          <div className="fixed left-1/2 transform -translate-x-1/2 top-12 z-50 w-[95%] md:w-[90%] lg:w-[80%] max-h-[85vh] overflow-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📁</span>
                  <span className="font-semibold text-slate-900">
                    {folderDocs[active.index]?.displayName ||
                      folderDocs[active.index]?.name}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    ({active.index + 1} of {folderDocs.length})
                  </span>
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
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b">
                <button
                  onClick={() =>
                    setActive((prev) => ({
                      ...prev,
                      index: prev.index > 0 ? prev.index - 1 : prev.index,
                    }))
                  }
                  disabled={active.index === 0}
                  className="px-3 py-2 rounded bg-slate-200 text-slate-700 font-bold text-lg disabled:opacity-50"
                  title="Previous"
                >
                  &#8592;
                </button>
                <button
                  onClick={() =>
                    setActive((prev) => ({
                      ...prev,
                      index:
                        prev.index < folderDocs.length - 1
                          ? prev.index + 1
                          : prev.index,
                    }))
                  }
                  disabled={active.index === folderDocs.length - 1}
                  className="px-3 py-2 rounded bg-slate-200 text-slate-700 font-bold text-lg disabled:opacity-50"
                  title="Next"
                >
                  &#8594;
                </button>
              </div>
              <div className="p-4">
                {(() => {
                  const doc = folderDocs[active.index];
                  if (!doc)
                    return (
                      <div className="text-center text-slate-500">
                        No document
                      </div>
                    );
                  if (doc.type === "requestForm") {
                    return (
                      <RequestFormPreview
                        request={requestData || {}}
                        items={doc.items}
                        requestId={null}
                        token={getToken ? getToken() : null}
                        apiBase={API_BASE_URL}
                      />
                    );
                  }
                  if (doc.type === "requisition") {
                    return (
                      <RequisitionPreview
                        doVendorSplit={requestData?.doVendorSplit}
                        request={requestData || {}}
                        items={doc.items}
                        requestId={null}
                        token={getToken ? getToken() : null}
                        apiBase={API_BASE_URL}
                      />
                    );
                  }
                  if (doc.type === "purchaseOrder") {
                    return (
                      <PurchaseOrderPreview
                        request={requestData || {}}
                        items={doc.items}
                        requestId={null}
                        token={getToken ? getToken() : null}
                        apiBase={API_BASE_URL}
                      />
                    );
                  }
                  // For files (pdf, images, etc.)
                  if (doc.ext === "pdf") {
                    return (
                      <iframe
                        title={doc.name}
                        src={doc.url}
                        style={{
                          width: "100%",
                          height: "70vh",
                          border: "none",
                        }}
                      />
                    );
                  }
                  if (
                    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(
                      doc.ext
                    )
                  ) {
                    return (
                      <img
                        src={doc.url}
                        alt={doc.name}
                        className="w-full max-h-[70vh] object-contain"
                      />
                    );
                  }
                  return (
                    <div className="text-center text-slate-500">
                      Cannot preview this file type.
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* NEW: Email Composer modal */}
      {showEmailComposer && (
        <EmailComposer
          initialAttachments={emailInitialAttachments}
          subject={`Request Form ${
            requestData?.requestId || requestData?.id || requestId || "REQ-XXXX"
          }`}
          onClose={() => setShowEmailComposer(false)}
          onSent={() => {
            setShowEmailComposer(false);
            alert("Demo email sent (simulated).");
          }}
        />
      )}
    </>
  );
};

export default AttachedDocuments;
