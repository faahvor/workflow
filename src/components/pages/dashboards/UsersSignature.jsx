import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { MdAttachFile } from "react-icons/md";
import { useAuth } from "../../context/AuthContext";
import { useGlobalAlert } from "../../shared/GlobalAlert";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const UsersSignature = () => {
  const { user, getToken } = useAuth();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState("upload"); // default to upload as requested
  const [uploadedFile, setUploadedFile] = useState(null); // { file, url }
  const [savedSignature, setSavedSignature] = useState(null); // url
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    // prefer signature url from auth user object if available
    if (user?.signatureFile) {
      setSavedSignature(user.signatureFile);
      return;
    }

    // try to fetch lightweight profile if not present on user object
    (async () => {
      try {
        const token = getToken ? getToken() : null;
        const resp = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const sig =
          resp?.data?.signatureFile ||
          resp?.data?.data?.signatureFile ||
          resp?.data?.user?.signatureFile ||
          null;
        if (sig) setSavedSignature(sig);
      } catch (err) {
        // ignore quietly — profile endpoint may differ on your backend
        // console.debug("Could not fetch profile for signature:", err);
      }
    })();
  }, [user, getToken]);

  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const maxSize = 10 * 1024 * 1024;
    if (f.size > maxSize) {
      showAlert("File too large. Max 10MB allowed.");
      return;
    }
    if (!f.type.startsWith("image/")) {
      showAlert("Please select a PNG or JPG image.");
      return;
    }

    const url = URL.createObjectURL(f);
    setUploadedFile({ file: f, url });
  };

  const removeSelected = () => {
    if (uploadedFile?.url) URL.revokeObjectURL(uploadedFile.url);
    setUploadedFile(null);
    setUploadProgress(0);
  };

  const saveSignature = async () => {
    if (!uploadedFile || !uploadedFile.file) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const token = getToken ? getToken() : null;
      const form = new FormData();
      form.append("signatureFile", uploadedFile.file);

      const resp = await axios.post(`${API_BASE_URL}/user/signature`, form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (ev) => {
          if (ev.total) {
            const pct = Math.round((ev.loaded * 100) / ev.total);
            setUploadProgress(pct);
          }
        },
      });

      // On success: show only the single showAlert requested.
      if (resp?.status >= 200 && resp.status < 300) {
        const signatureUrl =
          resp?.data?.signatureUrl || resp?.data?.signatureFile || null;
        if (signatureUrl) {
          setSavedSignature(signatureUrl);
          removeSelected();
        } else {
          // clear selected preview if you want, no showAlerts
          removeSelected();
        }
        showAlert("Signature uploaded successfully.");
      }
    } catch (err) {
      console.error("Error uploading signature:", err);
      showAlert("Failed to upload signature.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  // ...existing code...

  return (
    <div className="ml-0 lg:ml-72 transition-all p-8 flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Signature Manager
            </h2>
            <p className="text-slate-500 mt-1">
              Create an office-grade electronic signature
            </p>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-md border border-slate-200/40 rounded-2xl p-8 shadow-md min-h-[520px] md:min-h-[640px] lg:min-h-[520px]">
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              className={`px-10 py-[13px] rounded-full text-sm font-medium ${
                mode === "upload"
                  ? "bg-[#036173] text-white"
                  : "bg-white text-slate-700 border"
              }`}
              onClick={() => setMode("upload")}
            >
              Upload
            </button>
          </div>

          {/* Upload dropzone */}
          {mode === "upload" && (
            <div className="mb-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full cursor-pointer rounded-lg border-2 border-dashed border-slate-200 p-4 flex items-center gap-4 hover:border-[#036173] transition"
              >
                <div className="w-12 h-12 rounded-md bg-[#036173] text-white flex items-center justify-center">
                  <MdAttachFile />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-slate-900">
                    Upload signature image
                  </div>
                  <div className="text-xs text-slate-500">
                    PNG, JPG — max 10MB. Click or drag to upload.
                  </div>
                </div>
                <div className="text-xs text-slate-400">Browse</div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                onChange={onFileChange}
                className="hidden"
              />

              {uploadedFile && (
                <div className="mt-4 flex items-center gap-4">
                  <img
                    src={uploadedFile.url}
                    alt="uploaded preview"
                    className="w-48 h-32 object-contain rounded-md border"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900">
                      {uploadedFile.file.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={removeSelected}
                        className="text-sm text-red-600 px-3 py-1 rounded-md border"
                        disabled={isUploading}
                      >
                        Remove
                      </button>
                    </div>
                    {isUploading && (
                      <div className="mt-2 text-sm text-slate-600">
                        Uploading... {uploadProgress}%
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={saveSignature}
              className="px-4 py-2 bg-[#036173] text-white rounded-lg disabled:opacity-60"
              disabled={!uploadedFile || isUploading}
            >
              {isUploading ? `Saving... ${uploadProgress}%` : "Save Signature"}
            </button>
          </div>

          {/* Saved signature preview (smaller) */}
          <div className="mt-8">
            {savedSignature ? (
              <div className="bg-white p-4 rounded-lg border flex items-center gap-4 justify-center">
                <img
                  src={savedSignature}
                  alt="saved signature"
                  className="w-36 h-20 object-contain rounded"
                />
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {user?.displayName || "Signed User"}
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Saved:{" "}
                    {user?.signatureUpdatedAt
                      ? new Date(user.signatureUpdatedAt).toLocaleString()
                      : "-"}
                  </div>
                </div>
              </div>
            ) : (
              <p></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersSignature;
