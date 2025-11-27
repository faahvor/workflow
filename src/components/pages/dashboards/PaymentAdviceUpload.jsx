import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { MdAttachFile, MdUpload, MdClear } from "react-icons/md";

const PaymentAdviceUpload = ({
  requestId,
  apiBase = "https://hdp-backend-1vcl.onrender.com/api",
  getToken = () => null,
  onFilesChanged = () => {},
}) => {
  const fileInputRef = useRef(null);
  const [paymentFiles, setPaymentFiles] = useState([]); // { id, file, previewUrl, progress, uploaded }
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      paymentFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const handleBrowseClick = () => fileInputRef.current?.click();

  const processFiles = (files) => {
    const entries = Array.from(files).map((file, idx) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${idx}`;
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      return { id, file, previewUrl, progress: 0, uploaded: false };
    });
    if (entries.length) {
      setPaymentFiles((prev) => [...prev, ...entries]);
      // start immediate upload for each entry
      entries.forEach((e) => setTimeout(() => uploadEntryImmediate(e), 50));
    }
  };

  const handleInputChange = (e) => {
    const files = e.target.files || [];
    processFiles(files);
    e.target.value = null;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer?.files || [];
    processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const uploadEntryImmediate = async (entry) => {
    if (!entry || !requestId) return;
    const id = entry.id;
    try {
      setIsUploading(true);
      setPaymentFiles((prev) => (prev.find((p) => p.id === id) ? prev : [...prev, entry]));
      setPaymentFiles((prev) => prev.map((p) => (p.id === id ? { ...p, progress: 0, uploaded: false } : p)));
      const token = getToken ? getToken() : null;
      const formData = new FormData();
      formData.append("files", entry.file);

      await axios.post(
        `${apiBase}/requests/${encodeURIComponent(requestId)}/payment-advice-files`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (ev) => {
            const percent = Math.round((ev.loaded * 100) / (ev.total || 1));
            setPaymentFiles((prev) => prev.map((p) => (p.id === id ? { ...p, progress: percent } : p)));
          },
        }
      );

      setPaymentFiles((prev) => prev.map((p) => (p.id === id ? { ...p, progress: 100, uploaded: true } : p)));

      // refresh parent attachments
      try {
        await onFilesChanged();
      } catch {}
      // remove temporary entry from UI after short delay
      setTimeout(() => {
        setPaymentFiles((prev) => {
          const toRemove = prev.find((p) => p.id === id);
          if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
          return prev.filter((p) => p.id !== id);
        });
      }, 600);
    } catch (err) {
      console.error("Payment advice upload failed:", err);
      alert(err?.response?.data?.message || "Payment advice upload failed");
      setPaymentFiles((prev) => prev.map((p) => (p.id === id ? { ...p, uploaded: false } : p)));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadFile = async (id) => {
    const entry = paymentFiles.find((p) => p.id === id);
    if (!entry) return;
    await uploadEntryImmediate(entry);
  };

  const handleUploadAll = async () => {
    for (const entry of [...paymentFiles]) {
      if (!entry.uploaded) {
        // eslint-disable-next-line no-await-in-loop
        await handleUploadFile(entry.id);
      }
    }
  };

  const handleRemoveFile = (id) => {
    setPaymentFiles((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found?.previewUrl) {
        try {
          URL.revokeObjectURL(found.previewUrl);
        } catch {}
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <MdAttachFile className="text-xl" />
        Payment Advice Upload
      </h3>

      <div className={`bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg`}>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseClick}
          role="button"
          tabIndex={0}
          className={`w-full cursor-pointer rounded-xl border-2 p-6 flex items-center justify-between gap-6 transition-colors duration-200 ${
            dragActive ? "border-emerald-400 bg-emerald-50" : "border-dashed border-slate-200 bg-white/50"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
              <MdAttachFile />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {paymentFiles.length > 0 ? `${paymentFiles.length} file(s)` : "Drag & drop payment advice files here, or click to browse"}
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOC/DOCX or images accepted. Files are uploaded immediately.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              className="px-4 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] text-sm"
            >
              Add Files
            </button>

            {paymentFiles.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadAll();
                }}
                disabled={isUploading}
                className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 text-sm"
              >
                Upload All
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {paymentFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            {paymentFiles.map((entry) => (
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
                      <p className="text-xs text-slate-500">{(entry.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUploadFile(entry.id);
                        }}
                        disabled={isUploading || entry.uploaded}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${isUploading || entry.uploaded ? "bg-gray-200 text-slate-600 cursor-not-allowed" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}
                      >
                        {entry.uploaded ? "Uploaded" : "Upload"}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(entry.id);
                        }}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                      >
                        <MdClear />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-2 bg-emerald-500 transition-all" style={{ width: `${entry.progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {entry.progress}% {isUploading && entry.progress < 100 ? "• uploading" : entry.uploaded ? "• complete" : ""}
                    </p>
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

export default PaymentAdviceUpload;