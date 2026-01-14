import React, { useState, useRef } from "react";
import axios from "axios";
import { useGlobalAlert } from "../../shared/GlobalAlert";

const UPLOAD_OPTIONS = [
  { value: "grn", label: "Goods Received Note (GRN) File" },
  { value: "jobCompletion", label: "Job Completion Certificate" },
  { value: "invoice", label: "Invoice" },
];

const ENDPOINTS = {
  grn: "grn-files",
  jobCompletion: "job-completion-files",
  invoice: "invoice-files",
};

const InvoiceControllerUploads = ({
  requestId,
  apiBase,
  getToken,
  onFilesChanged,
}) => {
  const [uploadType, setUploadType] = useState("grn");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { showAlert } = useGlobalAlert();

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target?.files || []);
    if (files.length) setSelectedFiles(files);
    e.target.value = null;
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (!selectedFiles.length) return;
    setIsUploading(true);
    try {
      const token = getToken();
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      const endpoint = ENDPOINTS[uploadType];
      await axios.post(
        `${apiBase}/requests/${requestId}/${endpoint}`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSelectedFiles([]);
      if (typeof onFilesChanged === "function") onFilesChanged();
      showAlert("Files uploaded successfully.");
    } catch (err) {
      showAlert(err?.response?.data?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        Upload GRN, Job Completion, or Invoice Files
      </h3>
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
        <div className="mb-4 flex items-center gap-6">
          {UPLOAD_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="uploadType"
                value={opt.value}
                checked={uploadType === opt.value}
                onChange={(e) => {
                  setUploadType(e.target.value);
                  setSelectedFiles([]);
                }}
                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
        <div
          onDrop={(e) => {
            e.preventDefault();
            const files = Array.from(e.dataTransfer?.files || []);
            if (files.length) setSelectedFiles(files);
          }}
          onDragOver={(e) => e.preventDefault()}
          role="button"
          tabIndex={0}
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
                  : `Drag & drop files here, or click to browse`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF or images (any size)
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
            >
              Add Files
            </button>
            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadFiles();
                }}
                disabled={isUploading}
                className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition text-sm"
              >
                Upload All
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
          />
        </div>
        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border">
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL(e.target.src)}
                    />
                  ) : (
                    <div className="text-slate-600 text-sm px-2 text-center">
                      {file.type === "application/pdf" ? "PDF" : "FILE"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate w-72">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(idx);
                  }}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                >
                  Clear
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceControllerUploads;