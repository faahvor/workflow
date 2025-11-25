import React, { useRef, useState, useEffect } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdPerson,
  MdAttachFile,
  MdCancel,
} from "react-icons/md";
import { useAuth } from "../context/AuthContext";

const SignaturePage = () => {
  const { user } = useAuth() || {};

  // Sidebar state (unchanged)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modes: digital (text-based) or upload (image)
  const [mode, setMode] = useState("digital");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [signedBy, setSignedBy] = useState(null);
  const [signedAt, setSignedAt] = useState(null);

  // Digital inputs (auto-filled from user or demo hardcoded values)
  const [digitalName, setDigitalName] = useState(
    user?.displayName || "John Doe"
  );
  const [digitalRole, setDigitalRole] = useState(
    (user?.role && user.role.toUpperCase()) || "PROCUREMENT OFFICER"
  );

  const fileInputRef = useRef(null);

  // Modern upload handler (small preview)
  const handleUploadFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploadedFile({ file, url });
    setMode("upload");
  };
  const onFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) handleUploadFile(f);
  };

  // Generate digital signature image from provided name & role
  const generateDigitalSignature = (name, role) => {
    const canvas = document.createElement("canvas");
    const width = 900;
    const height = 260;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // transparent background
    ctx.clearRect(0, 0, width, height);

    // subtle watermark
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#0f172a";
    ctx.font = "18px Inter, system-ui, Arial";
    ctx.fillText("HYDRODIVE", 18, 28);
    ctx.globalAlpha = 1;

    // stylized name
    ctx.fillStyle = "#0b5f63";
    ctx.font =
      'bold 56px "Brush Script MT", "Segoe Script", Pacifico, cursive, serif';
    ctx.fillText(name, 28, 120);

    // role
    ctx.font = "16px Inter, system-ui, Arial";
    ctx.fillStyle = "#475569";
    ctx.fillText(role, 28, 160);

    // e-sign info
    ctx.font = "12px Inter, system-ui, Arial";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`e-signature • ${new Date().toLocaleDateString()}`, 28, 185);

    return canvas.toDataURL("image/png");
  };

  // Save uses either uploaded image or generated digital signature (from inputs)
  const saveSignature = () => {
    if (mode === "upload" && uploadedFile) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const maxW = 900;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const c = canvas.getContext("2d");
        c.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL("image/png");
        setSavedSignature(data);
        setSignedBy(digitalName);
        setSignedAt(new Date().toISOString());
      };
      img.src = uploadedFile.url;
    } else {
      const data = generateDigitalSignature(digitalName, digitalRole);
      setSavedSignature(data);
      setSignedBy(digitalName);
      setSignedAt(new Date().toISOString());
    }
  };

  const downloadSignature = () => {
    if (!savedSignature) return;
    const a = document.createElement("a");
    a.href = savedSignature;
    a.download = `${digitalName.replace(/\s+/g, "_")}-${Date.now()}.png`;
    a.click();
  };

  const removeSaved = () => {
    setSavedSignature(null);
    setSignedBy(null);
    setSignedAt(null);
  };

  // Print/share (unchanged logic but kept for convenience)
  function handlePrintPreview() {
    if (!savedSignature) {
      alert("No saved signature to print. Save or upload a signature first.");
      return;
    }
    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup blocked. Allow popups to print.");
      return;
    }
    const html = `
      <div style="font-family:Inter,system-ui,Arial;padding:24px;color:#0f172a">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <h2 style="margin:0 0 8px 0">Hydrodive Nigeria Ltd</h2>
            <div style="color:#475569">17 Wharf Road, Apapa, Lagos</div>
          </div>
          <div style="text-align:right;color:#475569">
            <div>Date: ${new Date().toLocaleDateString()}</div>
            <div>Signature: ${signedBy || digitalName}</div>
          </div>
        </div>
        <hr style="margin:16px 0" />
        <div style="margin-top:12px"><img src="${savedSignature}" style="max-height:240px; max-width:100%"/></div>
        <div style="margin-top:12px;color:#475569">Signed by: ${
          signedBy || digitalName
        } (${digitalRole})</div>
      </div>
    `;
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }

  

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-40 left-1/4 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        />
      </div>

      {/* Grid pattern background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Radial gradient fade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.7) 60%, rgba(255, 255, 255, 0.95) 100%)",
        }}
      />

      {/* Sidebar (kept identical styling) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0a0a0a] border-r border-gray-800/50 transition-transform transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* ...existing sidebar content... */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              G
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Gemz Software</h1>
              <p className="text-gray-400 text-xs">Signature Manager</p>
            </div>
          </div>
        </div>
        <nav className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition">
              <MdDashboard className="text-xl" />
              <span className="text-sm font-medium">Overview</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
              <MdPendingActions className="text-xl" />
              <span className="text-sm font-medium">Signatures</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition">
              <MdCheckCircle className="text-xl" />
              <span className="text-sm font-medium">Approved</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800/50 transition">
              <MdHistory className="text-xl" />
              <span className="text-sm font-medium">History</span>
            </button>
          </div>
        </nav>
        <div className="p-4 border-t border-gray-800/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
              {user?.displayName
                ?.split?.(" ")
                ?.map((s) => s[0])
                ?.slice(0, 2)
                .join("") || "PO"}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.displayName || "John Doe"}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {(user?.role || "PROCUREMENT").toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
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
            <button
              onClick={() => setIsSidebarOpen((s) => !s)}
              className="lg:hidden p-3 rounded-lg bg-[#0a0a0a] text-white"
            >
              {isSidebarOpen ? <IoMdClose /> : <IoMdMenu />}
            </button>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-200/40 rounded-2xl p-8  shadow-md min-h-[520px] md:min-h-[640px] lg:min-h-[720px]">
            <div className="flex items-center justify-center gap-3 mb-[6rem]">
             
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

          
            {/* Modern upload dropzone */}
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
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                {uploadedFile && (
                  <div className="mt-4 flex items-center gap-4">
                    <img
                      src={uploadedFile.url}
                      alt="uploaded"
                      className="w-36 h-24 object-contain rounded-md border"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">
                        {uploadedFile.file.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-sm text-red-600 px-3 py-1 rounded-md border"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 mt-[5rem]">
              <button
                onClick={saveSignature}
                className="px-4 py-2 bg-[#036173] text-white rounded-lg"
              >
                Save Signature
              </button>
            </div>

            {/* Saved signature preview */}
            <div className="mt-6  ">
              {savedSignature ? (
                <div className="bg-white p-4 rounded-lg border flex items-center gap-4 justify-center">
                  <img
                    src={savedSignature}
                    alt="saved"
                    className="w-48 h-28 object-contain rounded"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {signedBy}
                    </div>
                    <div className="text-xs text-slate-400 mt-2">
                      Saved:{" "}
                      {signedAt ? new Date(signedAt).toLocaleString() : "-"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 items-center justify-center flex">
                  No saved signature yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePage;
