import React, { useMemo, useState } from "react";
import { MdAdd, MdEdit, MdArchive, MdBuild, MdSearch } from "react-icons/md";

/*
  VesselManagement - modern vessel admin UI
  - Tabs: Active / Maintenance / Archived
  - Table with S/N, Vessel, IMO, MMSI, Fleet Manager, Vessel Manager, Status, Actions
  - Add / Edit modal (fleet manager & vessel manager required)
  - Move to Maintenance / Archive with confirm
  - Uses `users` prop to populate manager dropdowns
*/

const sampleVessels = [
  {
    id: "V-001",
    name: "MV Ocean Star",
    imo: "IMO1234567",
    mmsi: "123456789",
    fleetManagerId: null,
    vesselManagerId: null,
    status: "Active", // Active | Maintenance | Archived
    notes: "Primary research vessel.",
  },
  {
    id: "V-002",
    name: "MV Sea Breeze",
    imo: "IMO2345678",
    mmsi: "234567890",
    fleetManagerId: null,
    vesselManagerId: null,
    status: "Maintenance",
    notes: "Under scheduled overhaul.",
  },
];

const StatusBadge = ({ status }) => {
  const map = {
    Active: "bg-emerald-100 text-emerald-700",
    Maintenance: "bg-amber-100 text-amber-700",
    Archived: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
};

const VesselManagement = ({ users = [] }) => {
  const [vessels, setVessels] = useState(sampleVessels);
  const [tab, setTab] = useState("Active"); // Active | Maintenance | Archived | All
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // form state
  const blank = {
    id: "",
    name: "",
    imo: "",
    mmsi: "",
    fleetManagerId: "",
    vesselManagerId: "",
    status: "Active",
    notes: "",
  };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  // candidate lists for dropdowns (prefer users with matching role keywords)
  const fleetCandidates = useMemo(
    () =>
      users
        .filter(
          (u) =>
            (u.role || "").toString().toLowerCase().includes("fleet") ||
            (u.role || "").toString().toLowerCase().includes("manager")
        )
        .map((u) => ({ value: u.id, label: u.name || u.email })),
    [users]
  );

  const vesselCandidates = useMemo(
    () =>
      users
        .filter(
          (u) =>
            (u.role || "").toString().toLowerCase().includes("vessel") ||
            (u.role || "").toString().toLowerCase().includes("manager")
        )
        .map((u) => ({ value: u.id, label: u.name || u.email })),
    [users]
  );

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return vessels.filter((v) => {
      if (tab !== "All" && v.status !== tab) return false;
      if (!q) return true;
      return (
        (v.name || "").toLowerCase().includes(q) ||
        (v.id || "").toLowerCase().includes(q) ||
        (v.imo || "").toLowerCase().includes(q) ||
        (v.mmsi || "").toLowerCase().includes(q)
      );
    });
  }, [vessels, tab, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...blank, id: `V-${Math.floor(100 + Math.random() * 900)}` });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({ ...v });
    setError("");
    setModalOpen(true);
  };

  const save = () => {
    // validation: name + fleetManager + vesselManager required
    if (!form.name || !form.fleetManagerId || !form.vesselManagerId) {
      setError("Vessel name, Fleet Manager and Vessel Manager are required.");
      return;
    }
    setError("");
    if (editing) {
      setVessels((prev) =>
        prev.map((p) => (p.id === editing.id ? { ...p, ...form } : p))
      );
    } else {
      setVessels((prev) => [{ ...form }, ...prev]);
    }
    setModalOpen(false);
  };

  const changeStatus = (id, newStatus) => {
    if (!window.confirm(`Move vessel ${id} to ${newStatus}?`)) return;
    setVessels((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
  };

  const remove = (id) => {
    if (!window.confirm("Permanently remove vessel? This cannot be undone."))
      return;
    setVessels((prev) => prev.filter((v) => v.id !== id));
  };

  const getUserLabel = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u ? u.name : "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Vessel Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage fleet, assign managers and control vessel lifecycle.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative bg-white/90 border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-2">
            <MdSearch className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vessel"
              className="outline-none text-sm bg-transparent"
            />
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-gradient-to-r from-[#036173] to-emerald-600 text-white rounded-xl inline-flex items-center gap-2"
          >
            <MdAdd /> Add Vessel
          </button>
        </div>
      </div>

      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {["Active", "Maintenance", "Archived", "All"].map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                tab === s
                  ? "bg-[#036173] text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 font-semibold border-b">
                <th className="px-4 py-3 text-left w-12">S/N</th>
                <th className="px-4 py-3 text-left">Vessel</th>

                <th className="px-4 py-3 text-left">Fleet Manager</th>
                <th className="px-4 py-3 text-left">Vessel Manager</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No vessels found
                  </td>
                </tr>
              )}
              {filtered.map((v, idx) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">
                      {v.name}
                    </div>
                    <div className="text-xs text-slate-400">{v.notes}</div>
                  </td>

                  <td className="px-4 py-3 text-sm">
                    {getUserLabel(v.fleetManagerId)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {getUserLabel(v.vesselManagerId)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(v)}
                        className="px-3 py-2 bg-white border rounded-lg text-sm"
                      >
                        <MdEdit />
                      </button>

                      {v.status !== "Maintenance" &&
                        v.status !== "Archived" && (
                          <button
                            onClick={() => changeStatus(v.id, "Maintenance")}
                            className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm"
                          >
                            <MdBuild /> Maintenance
                          </button>
                        )}

                      {v.status !== "Archived" && (
                        <button
                          onClick={() => changeStatus(v.id, "Archived")}
                          className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm"
                        >
                          <MdArchive />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-20 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#036173] to-emerald-600 text-white">
                <div className="text-lg font-semibold">
                  {editing ? "Edit Vessel" : "Add Vessel"}
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white/90"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">
                      Vessel Name
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">
                      Fleet Manager
                    </label>
                    <select
                      value={form.fleetManagerId || ""}
                      onChange={(e) =>
                        setForm({ ...form, fleetManagerId: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Fleet Manager</option>
                      {fleetCandidates.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4"></div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500">
                      Vessel Manager
                    </label>
                    <select
                      value={form.vesselManagerId || ""}
                      onChange={(e) =>
                        setForm({ ...form, vesselManagerId: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Vessel Manager</option>
                      {vesselCandidates.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({ ...form, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option>Active</option>
                      <option>Maintenance</option>
                      <option>Archived</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 bg-white border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    className="px-4 py-2 bg-[#036173] text-white rounded-lg"
                  >
                    {editing ? "Save" : "Add Vessel"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VesselManagement;
