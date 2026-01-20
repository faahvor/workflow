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

  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(""); // backend logo URL
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = React.useRef(null);
  const [dragLogo, setDragLogo] = useState(false);
  const [sla, setSla] = useState("");
  const [originalSla, setOriginalSla] = useState(""); // Track original fetched value
  const [slaLoading, setSlaLoading] = useState(false);
  const [slaSaving, setSlaSaving] = useState(false);
  const [slaError, setSlaError] = useState("");
  const [slaSuccess, setSlaSuccess] = useState("");
  const [showSlaInfo, setShowSlaInfo] = useState(false);

  const handleLogoUpload = async () => {
    setError("");
    setSuccess("");
    if (!logoFile) {
      setError("No logo selected.");
      return;
    }
    if (
      !["image/png", "image/jpeg", "image/jpg", "image/gif"].includes(
        logoFile.type
      )
    ) {
      setError("Invalid file type. Only PNG, JPG, JPEG, GIF allowed.");
      return;
    }
    if (logoFile.size > 25 * 1024 * 1024) {
      setError("File too large. Max size is 25MB.");
      return;
    }
    setLogoUploading(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      if (!token) throw new Error("Authentication required");
      const formData = new FormData();
      formData.append("logo", logoFile);
      const resp = await axios.post(`${API_BASE}/settings/logo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (resp.data && resp.data.logo && resp.data.logo.url) {
        setLogoUrl(resp.data.logo.url);
        setSuccess("Logo uploaded successfully!");
        setLogoFile(null);
        // Optionally: clear file input value
        if (logoInputRef.current) logoInputRef.current.value = "";
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Upload failed. Try again.");
      }
    } catch (err) {
      console.error("Logo upload failed:", err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Logo upload failed. Try again."
      );
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoSelect = (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setLogoFile(f);
  };

  const handleLogoDrop = async (e) => {
    e.preventDefault();
    setDragLogo(false);
    if (e.dataTransfer?.files) handleLogoSelect(e.dataTransfer.files);
  };

  const handleLogoClickPick = () => {
    if (logoInputRef.current) logoInputRef.current.click();
  };

  useEffect(() => {
    // fetch current SLA on mount
    const fetchSla = async () => {
      setSlaLoading(true);
      setSlaError("");
      try {
        const token = getToken ? getToken() : sessionStorage.getItem("userToken");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await axios.get(`${API_BASE}/settings/sla`, { headers });
        if (resp.data && typeof resp.data.approvalSlaHours === "number") {
          setSla(resp.data.approvalSlaHours);
          setOriginalSla(resp.data.approvalSlaHours); // Store original value
        } else {
          setSla(0);
          setOriginalSla(0);
        }
      } catch (err) {
        setSla(0);
        setOriginalSla(0);
        setSlaError("Could not load SLA value.");
      } finally {
        setSlaLoading(false);
      }
    };
    fetchSla();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSlaSave = async () => {
    setSlaError("");
    setSlaSuccess("");
    const val = Number(sla);
    if (!Number.isInteger(val) || val < 0) {
      setSlaError("SLA must be a whole number (0 or greater).");
      return;
    }
    setSlaSaving(true);
    try {
      const token = getToken ? getToken() : sessionStorage.getItem("userToken");
      if (!token) throw new Error("Authentication required");
      const headers = { Authorization: `Bearer ${token}` };
      const resp = await axios.post(
        `${API_BASE}/settings/sla`,
        { hours: val },
        { headers }
      );
      if (resp.data && typeof resp.data.approvalSlaHours === "number") {
        setSla(resp.data.approvalSlaHours);
        setOriginalSla(resp.data.approvalSlaHours); // Update original value after save
        setSlaSuccess("Approval SLA updated successfully");
        setTimeout(() => setSlaSuccess(""), 3000);
      } else {
        setSlaError("Failed to update SLA.");
      }
    } catch (err) {
      setSlaError(
        err?.response?.data?.message || err.message || "Failed to update SLA"
      );
    } finally {
      setSlaSaving(false);
    }
  };

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

  useEffect(() => {
    // fetch current logo on mount
    const fetchLogo = async () => {
      try {
        const resp = await axios.get(`${API_BASE}/settings/logo`);
        if (resp.data && resp.data.url) {
          setLogoUrl(resp.data.url);
        } else {
          setLogoUrl("");
        }
      } catch (err) {
        setLogoUrl("");
        // Optionally: setError("Could not load logo.");
      }
    };
    fetchLogo();
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

  // Check if SLA value has changed
  const slaHasChanges = Number(sla) !== Number(originalSla);

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
        <p className="text-sm text-slate-500 mb-4">Upload Company Logo</p>

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
              {logoFile ? (
                <img
                  src={URL.createObjectURL(logoFile)}
                  alt="logo preview"
                  className="w-full h-full object-contain"
                />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt="current logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-slate-400 text-center px-2">
                  No logo uploaded
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogoClickPick}
                  className="px-4 py-2 rounded-md bg-[#036173] text-white"
                  disabled={logoUploading}
                >
                  Choose File
                </button>
                <button
                  onClick={handleLogoUpload}
                  disabled={!logoFile || logoUploading}
                  className={`px-4 py-2 rounded-md text-white ${
                    !logoFile || logoUploading
                      ? "bg-slate-400 cursor-not-allowed"
                      : "bg-emerald-600"
                  }`}
                >
                  {logoUploading ? "Uploading…" : "Upload Logo"}
                </button>
              </div>

              {success && (
                <div className="mt-2 text-sm text-emerald-700">{success}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approval SLA Monitoring */}
      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold">Request Monitoring Time</h3>
          <button
            type="button"
            className="ml-1 text-slate-400 hover:text-slate-700"
            onClick={() => setShowSlaInfo((v) => !v)}
            aria-label="Show SLA info"
            tabIndex={0}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">i</text>
            </svg>
          </button>
        </div>
        {showSlaInfo && (
          <div className="mb-3 text-xs text-slate-600 bg-slate-50 rounded p-3 border">
            <b>What is this?</b> <br />
            This setting controls how many hours a request can remain in a pending approval state before the system sends an amber alert to stakeholders. <br />
            <b>Set to 0</b> to disable monitoring. Alerts are sent only once per stage. <br />
            Example: If set to 24, requests pending for more than 24 hours will trigger an alert.
          </div>
        )}
        {slaLoading ? (
          <div className="text-sm text-slate-500">Loading SLA…</div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={0}
                step={1}
                value={sla}
                onChange={(e) => setSla(e.target.value.replace(/\D/, ""))}
                className="px-4 py-2 rounded-xl border w-32"
                disabled={slaSaving}
              />
              <button
                onClick={handleSlaSave}
                disabled={slaSaving || !slaHasChanges}
                className={`px-4 py-2 rounded-xl ${
                  slaSaving || !slaHasChanges
                    ? "bg-slate-400 text-white cursor-not-allowed"
                    : "bg-[#036173] text-white"
                }`}
              >
                {slaSaving ? "Saving…" : "Save Changes"}
              </button>
              <span className={`ml-2 text-xs font-semibold ${sla === 0 || sla === "0" ? "text-rose-600" : "text-emerald-700"}`}>
                {sla === 0 || sla === "0" ? "Monitoring is OFF" : `Monitoring: ${sla} hour${sla === 1 || sla === "1" ? "" : "s"}`}
              </span>
            </div>
            {slaSuccess && (
              <div className="mt-3 text-sm text-emerald-700">{slaSuccess}</div>
            )}
            {slaError && (
              <div className="mt-3 text-sm text-rose-600">{slaError}</div>
            )}
          </>
        )}
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