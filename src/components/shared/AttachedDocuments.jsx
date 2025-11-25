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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {fileMeta.map((f, i) => (
              <div key={f.url + "_" + i} className="relative">
                {/* Delete button for quotation files — only procurement officer */}
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
