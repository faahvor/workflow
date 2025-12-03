import React from "react";

/*
  SettingsPanel - extracted from NewDashboard settings section
  Props:
    - vatRate, setVatRate
*/

const SettingsPanel = ({ vatRate = 0, setVatRate = () => {} }) => {
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
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={vatRate}
            onChange={(e) => setVatRate(Number(e.target.value))}
            className="px-4 py-2 rounded-xl border w-32"
          />
          <button
            onClick={() => alert("VAT updated (prototype)")}
            className="px-4 py-2 bg-[#036173] text-white rounded-xl"
          >
            Save VAT
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          VAT is applied on procurement spend reports and invoice handling.
        </p>
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

export default SettingsPanel;
