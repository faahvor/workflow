import React, { useRef, useState } from "react";
import axios from "axios";

const InvoiceFilesUpload = ({
  requestId,
  apiBase,
  getToken,
  onFilesChanged,
  isReadOnly = false,
  invoiceFiles = [],
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target?.files || []);
    if (files.length) setSelectedFiles(files);
    e.target.value = null;
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      await axios.post(
        `${apiBase}/requests/${requestId}/invoice-files`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSelectedFiles([]);
      if (onFilesChanged) onFilesChanged();
    } catch (err) {
      alert(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileUrl) => {
    if (!window.confirm("Delete this invoice file?")) return;
    try {
      const token = getToken();
      await axios.delete(
        `${apiBase}/requests/${requestId}/invoice-files`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
          data: { fileUrl },
        }
      );
      if (onFilesChanged) onFilesChanged();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        📄 Upload Invoice Files
      </h3>
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
        <div
          onClick={handleBrowseClick}
          className="w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors duration-200 p-6 flex items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
              📎
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : "Drag & drop invoice(s) here, or click to browse"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF or images (max 10MB each)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowseClick();
              }}
              className="px-4 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] transition"
              disabled={isReadOnly || uploading}
            >
              Add Files
            </button>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpload();
                }}
                disabled={isReadOnly || uploading}
                className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition text-sm"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleInputChange}
            multiple
            className="hidden"
            disabled={isReadOnly || uploading}
          />
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-slate-900">{file.name}</span>
                <span className="text-xs text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        )}
        {/* {invoiceFiles && invoiceFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-2">Uploaded Invoice Files</h4>
            <ul className="space-y-2">
              {invoiceFiles.map((f, idx) => (
                <li
                  key={f.url || f || idx}
                  className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-3"
                >
                  <a
                    href={typeof f === "string" ? f : f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-emerald-700 underline"
                  >
                    {typeof f === "string"
                      ? f.split("/").pop()
                      : f.name || f.url.split("/").pop()}
                  </a>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleDelete(typeof f === "string" ? f : f.url)}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm"
                      disabled={uploading}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default InvoiceFilesUpload;