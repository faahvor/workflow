import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { MdAttachFile } from "react-icons/md";
import { useGlobalAlert } from "../../shared/GlobalAlert";

const InvoiceUpload = ({
  requestId,
  apiBase = "https://hdp-backend-1vcl.onrender.com/api",
  getToken = () => null,
  onFilesChanged = () => {},
}) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]); // { id, file, previewUrl, progress, uploaded }
  const [isUploading, setIsUploading] = useState(false);
const { showAlert } = useGlobalAlert();
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const handleBrowseClick = () => fileInputRef.current?.click();

  const processFiles = (fileList) => {
    const entries = Array.from(fileList).map((file, idx) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${idx}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      return { id, file, previewUrl, progress: 0, uploaded: false };
    }).slice(0, 10); // max 10
    if (!entries.length) return;
    setFiles((prev) => [...prev, ...entries]);
    entries.forEach((e) => setTimeout(() => uploadEntryImmediate(e), 50));
  };

  const handleInputChange = (e) => {
    const f = e.target.files || [];
    processFiles(f);
    e.target.value = null;
  };

  const uploadEntryImmediate = async (entry) => {
    if (!entry || !requestId) return;
    const id = entry.id;
    try {
      setIsUploading(true);
      setFiles((prev) => prev.map((p) => (p.id === id ? { ...p, progress: 0, uploaded: false } : p)));
      const token = getToken ? getToken() : null;
      const fd = new FormData();
      fd.append("files", entry.file);
      await axios.post(
        `${apiBase}/requests/${encodeURIComponent(requestId)}/invoice-files`,
        fd,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (ev) => {
            const percent = Math.round((ev.loaded * 100) / (ev.total || 1));
            setFiles((prev) => prev.map((p) => (p.id === id ? { ...p, progress: percent } : p)));
          },
        }
      );
      setFiles((prev) => prev.map((p) => (p.id === id ? { ...p, progress: 100, uploaded: true } : p)));
      try { await onFilesChanged(); } catch {}
      // leave uploaded entry in UI briefly then remove to keep list clean
      setTimeout(() => {
        setFiles((prev) => {
          const toRemove = prev.find((p) => p.id === id);
          if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
          return prev.filter((p) => p.id !== id);
        });
      }, 700);
    } catch (err) {
      console.error("Invoice upload failed:", err);
      showAlert(err?.response?.data?.message || "Invoice upload failed");
      setFiles((prev) => prev.map((p) => (p.id === id ? { ...p, uploaded: false } : p)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files || [];
    processFiles(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <MdAttachFile className="text-xl" />
        Upload Invoice
      </h3>

      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleBrowseClick}
          role="button"
          tabIndex={0}
          className="w-full cursor-pointer rounded-xl border-2 p-6 flex items-center justify-between gap-6 border-dashed border-slate-200 bg-white/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
              📎
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {files.length > 0 ? `${files.length} file(s) selected` : "Drag & drop invoice(s) here, or click to browse"}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF invoices recommended. Max 10 files.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}
              className="px-4 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] text-sm"
            >
              Add Files
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleInputChange}
            multiple
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-3">
            {files.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border">
                  {entry.previewUrl ? (
                    <img src={entry.previewUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-600 text-sm px-2 text-center">{entry.file.type === "application/pdf" ? "PDF" : "FILE"}</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 truncate w-72">{entry.file.name}</p>
                      <p className="text-xs text-slate-500">{(entry.file.size / 1024).toFixed(2)} KB</p>
                    </div>

                    <div className="text-xs text-slate-500">
                      {entry.progress}% {entry.uploaded ? "• complete" : ""}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 bg-emerald-500 transition-all" style={{ width: `${entry.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceUpload;