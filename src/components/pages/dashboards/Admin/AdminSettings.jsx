import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

/*
  AdminSettings - extracted from NewDashboard settings section
  Props:
    - vatRate, setVatRate
*/

const API_BASE = "https://hdp-backend-1vcl.onrender.com/api";

const AdminSettings = ({
  vatRate: initialVat = 7.5,
  setVatRate = () => {},
}) => {
  const { getToken } = useAuth();
  const [vat, setVat] = useState(initialVat);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- Logo upload prototype (local preview + localStorage) ---
  const [logoFile, setLogoFile] = useState(null);
  // logoPreview may be a blob URL (temp) or a data URL persisted in localStorage
  const [logoPreview, setLogoPreview] = useState(
    () => localStorage.getItem("adminLogo") || ""
  );
  const logoInputRef = React.useRef(null);
  const [dragLogo, setDragLogo] = useState(false);

  const readFileAsDataURL = (file) =>
    new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });

  const handleLogoSelect = (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setLogoFile(f);
    // temp preview using object URL for immediate feedback
    try {
      const url = URL.createObjectURL(f);
      setLogoPreview(url);
    } catch {
      setLogoPreview("");
    }
  };

  const handleLogoDrop = async (e) => {
    e.preventDefault();
    setDragLogo(false);
    if (e.dataTransfer?.files) handleLogoSelect(e.dataTransfer.files);
  };

  const handleLogoClickPick = () => {
    if (logoInputRef.current) logoInputRef.current.click();
  };

  const saveLogoPrototype = async () => {
    setError("");
    setSuccess("");
    if (!logoFile && !logoPreview) {
      setError("No logo selected.");
      return;
    }
    setSaving(true);
    try {
      // convert to persistent data URL if not already one
      let dataUrl = logoPreview;
      if (logoFile) dataUrl = await readFileAsDataURL(logoFile);
      // store prototype in localStorage
      localStorage.setItem("adminLogo", dataUrl);
      setLogoPreview(dataUrl);
      setLogoFile(null);
      setSuccess("Logo saved (prototype)");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to save logo (prototype):", err);
      setError("Failed to save logo (see console)");
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
    localStorage.removeItem("adminLogo");
  };
  // --- end logo prototype ---

  useEffect(() => {
    // fetch current VAT once on mount
    const fetchVat = async () => {
      setLoading(true);
      setError("");
      try {
        const token = getToken
          ? getToken()
          : sessionStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`${API_BASE}/vat`, { headers });
        const body = resp?.data;
        if (body && typeof body.value === "number") {
          setVat(body.value);
        } else if (body && body.value != null) {
          setVat(Number(body.value));
        } else {
          // default fallback per docs
          setVat(7.5);
        }
      } catch (err) {
        console.error("Failed to fetch VAT:", err);
        // keep local initial value, show non-blocking error
        setError("Could not load VAT value (see console).");
      } finally {
        setLoading(false);
      }
    };
    fetchVat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    const val = Number(vat);
    if (Number.isNaN(val) || val < 0 || val > 100) {
      setError("VAT must be a number between 0 and 100.");
      return;
    }
    setSaving(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      if (!token) throw new Error("Authentication required");
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await axios.patch(
        `${API_BASE}/vat`,
        { value: val },
        { headers }
      );
      const body = resp?.data || {};
      const newVal = typeof body.value === "number" ? body.value : val;
      setVat(newVal);
      setVatRate(newVal); // inform parent (if used)
      setSuccess("VAT value updated successfully");
      // clear success after a short timeout
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to update VAT:", err);
      const msg =
        err?.response?.data?.message || err.message || "Failed to update VAT";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage application settings and configurations.
        </p>
      </div>

      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">VAT Management</h3>

        {loading ? (
          <div className="text-sm text-slate-500">Loading current VAT…</div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                className="px-4 py-2 rounded-xl border w-32"
                min={0}
                max={100}
                step="0.1"
                disabled={saving}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-4 py-2 rounded-xl ${
                  saving
                    ? "bg-slate-400 text-white cursor-not-allowed"
                    : "bg-[#036173] text-white"
                }`}
              >
                {saving ? "Saving…" : "Save VAT"}
              </button>
            </div>

            {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
            {success && (
              <div className="mt-3 text-sm text-emerald-700">{success}</div>
            )}

            <p className="text-xs text-slate-500 mt-3">
              VAT is applied on procurement spend reports and invoice handling.
            </p>
          </>
        )}
      </div>

      {/* Branding / Logo (prototype) */}
      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Company Logo</h3>
        <p className="text-sm text-slate-500 mb-4">
          Upload a system logo (prototype — no backend yet). Supported: PNG,
          JPG, SVG.
        </p>

        <div
          onDrop={handleLogoDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragLogo(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragLogo(false);
          }}
          className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors ${
            dragLogo
              ? "border-emerald-400 bg-emerald-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleLogoSelect(e.target.files)}
          />

          {/* preview box */}
          <div className="flex items-center gap-4 w-full">
            <div className="w-28 h-28 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="logo preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-slate-400 text-center px-2">
                  No logo selected
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogoClickPick}
                  className="px-4 py-2 rounded-md bg-[#036173] text-white"
                >
                  Choose File
                </button>
                <button
                  onClick={saveLogoPrototype}
                  disabled={saving}
                  className={`px-4 py-2 rounded-md text-white ${
                    saving
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-emerald-600"
                  }`}
                >
                  {saving ? "Saving…" : "Save Logo (prototype)"}
                </button>
                <button
                  onClick={removeLogo}
                  className="px-3 py-2 rounded-md bg-red-50 text-red-600"
                >
                  Remove
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Drag & drop an image, or click Choose File. The preview will be
                saved locally in your browser.
              </div>
              {error && (
                <div className="mt-2 text-sm text-rose-600">{error}</div>
              )}
              {success && (
                <div className="mt-2 text-sm text-emerald-700">{success}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Other Admin Settings</h3>
        <p className="text-slate-600">
          Feature toggles, branding, notification settings, backup & retention
          policies, and integration keys (mock).
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
