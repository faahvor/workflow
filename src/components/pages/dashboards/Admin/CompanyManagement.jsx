import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdInsertDriveFile,
} from "react-icons/md";
import { useAuth } from "../../../context/AuthContext";
import { useGlobalAlert } from "../../../shared/GlobalAlert";
import { useGlobalPrompt } from "../../../shared/GlobalPrompt";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const CompanyManagement = () => {
  const { getToken } = useAuth();

  // table state
  const [companies, setCompanies] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const { showPrompt } = useGlobalPrompt(); // Add this line

  // modal / form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const { showAlert } = useGlobalAlert();

  const blank = {
    companyId: "",
    name: "",
    address: { street: "", city: "", state: "" },
    logoUrl: "",
  };
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");

  const getAuthHeaders = () => {
    const token = getToken ? getToken() : sessionStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCompanies = async (p = page, q = search, lim = limit) => {
    setLoading(true);
    try {
      const params = [`page=${p}`, `limit=${lim}`];
      if (q) params.push(`search=${encodeURIComponent(q)}`);
      const url = `${API_BASE}/companies?${params.join("&")}`;
      const resp = await axios.get(url, { headers: getAuthHeaders() });
      const body = resp.data || {};
      const data = Array.isArray(body.data) ? body.data : [];
      setCompanies(data);
      setPage(body.page ?? p);
      setPages(
        body.pages ?? Math.max(1, Math.ceil((body.total ?? data.length) / lim))
      );
      setTotal(body.total ?? data.length);
    } catch (err) {
      console.error("Fetch companies error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1, search, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchCompanies(1, search, limit), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openCreate = () => {
    setEditing(null);
    setForm(blank);
    setLogoFile(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      companyId: c.companyId || c.id,
      name: c.name || "",
      address: c.address || { street: "", city: "", state: "" },
      logoUrl: c.logoUrl || "",
    });
    setLogoFile(null);
    setError("");
    setModalOpen(true);
  };

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    setLogoFile(f);
    // immediate preview will be handled by server response or local preview if needed
  };

  const triggerPicker = () =>
    fileInputRef.current && fileInputRef.current.click();

  const saveCompany = async () => {
    setError("");
    if (
      !form.name ||
      !form.address?.street ||
      !form.address?.city ||
      !form.address?.state
    ) {
      setError("Name and full address (street, city, state) are required.");
      return;
    }
    setSaving(true);
    try {
      const headers = getAuthHeaders();
      if (logoFile) {
        const fd = new FormData();
        fd.append("name", form.name);
        fd.append("street", form.address.street);
        fd.append("city", form.address.city);
        fd.append("state", form.address.state);
        fd.append("logo", logoFile);
        if (editing && editing.companyId) {
          // PATCH with multipart
          const resp = await axios.patch(
            `${API_BASE}/companies/${encodeURIComponent(editing.companyId)}`,
            fd,
            { headers }
          );
          // update local list
          await fetchCompanies(page, search, limit);
        } else {
          // create
          const resp = await axios.post(`${API_BASE}/companies`, fd, {
            headers,
          });
          await fetchCompanies(1, search, limit);
        }
      } else {
        const payload = {
          name: form.name,
          street: form.address.street,
          city: form.address.city,
          state: form.address.state,
        };
        if (editing && editing.companyId) {
          await axios.patch(
            `${API_BASE}/companies/${encodeURIComponent(editing.companyId)}`,
            payload,
            { headers }
          );
          await fetchCompanies(page, search, limit);
        } else {
          await axios.post(`${API_BASE}/companies`, payload, { headers });
          await fetchCompanies(1, search, limit);
        }
      }
      setModalOpen(false);
      setEditing(null);
      setForm(blank);
      setLogoFile(null);
      showAlert("Company saved.");
    } catch (err) {
      console.error("Save company error:", err);
      setError(err?.response?.data?.message || "Failed to save company");
    } finally {
      setSaving(false);
    }
  };

  const deleteCompany = async (c) => {
    const id = c.companyId || c.id;
    if (!id) return;
   const ok = await showPrompt(
      `Permanently delete company "${c.name}"? This cannot be undone.`
    );
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/companies/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(),
      });
      await fetchCompanies(page, search, limit);
      showAlert("Company deleted.");
    } catch (err) {
      console.error("Delete company error:", err);
      showAlert(err?.response?.data?.message || "Failed to delete company");
    } finally {
      setLoading(false);
    }
  };

  const getAddressString = (addr) => {
    if (!addr) return "—";
    if (typeof addr === "string") return addr;
    return (
      [addr.street, addr.city, addr.state].filter(Boolean).join(", ") || "—"
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Companies</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage companies and their profiles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative bg-white/90 border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-2">
            <MdSearch className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies"
              className="outline-none text-sm bg-transparent"
            />
          </div>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-gradient-to-r from-[#036173] to-emerald-600 text-white rounded-xl inline-flex items-center gap-2"
          >
            <MdAdd /> Add Company
          </button>
        </div>
      </div>

      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 font-semibold border-b">
                <th className="px-4 py-3 text-left w-12">S/N</th>
                <th className="px-4 py-3 text-left">Company</th>
                <th className="px-4 py-3 text-left">Address</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-center">Logo</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Loading companies...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No companies found
                  </td>
                </tr>
              ) : (
                companies.map((c, idx) => (
                  <tr
                    key={c.companyId || c.id || idx}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-slate-900">
                        {c.name}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getAddressString(c.address)}</td>
                    <td className="px-4 py-3">
                      {new Date(
                        c.createdAt || c.created || Date.now()
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.logoUrl ? (
                        <img
                          src={c.logoUrl}
                          alt="logo"
                          className="w-12 h-8 object-contain mx-auto"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-2 bg-white border rounded-lg text-sm"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => deleteCompany(c)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Page {page} of {pages} — Total: {total}
          </div>
          <div className="flex items-center gap-2">
           
            <button
              onClick={() => {
                if (page > 1) {
                  setPage((p) => p - 1);
                  fetchCompanies(page - 1, search, limit);
                }
              }}
              disabled={page <= 1}
              className="px-3 py-1 rounded bg-white border"
            >
              Prev
            </button>
            <button
              onClick={() => {
                if (page < pages) {
                  setPage((p) => p + 1);
                  fetchCompanies(page + 1, search, limit);
                }
              }}
              disabled={page >= pages}
              className="px-3 py-1 rounded bg-white border"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => {
              setModalOpen(false);
              setEditing(null);
              setForm(blank);
              setLogoFile(null);
            }}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-20 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-[#036173] to-emerald-600 text-white">
                <div className="text-lg font-semibold">
                  {editing ? "Edit Company" : "Add Company"}
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
                      Company Name
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
                    <label className="text-xs text-slate-500">Street</label>
                    <input
                      value={form.address.street || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: { ...form.address, street: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">City</label>
                    <input
                      value={form.address.city || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: { ...form.address, city: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">State</label>
                    <input
                      value={form.address.state || ""}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: { ...form.address, state: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Logo (optional)
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                    <button
                      onClick={triggerPicker}
                      className="px-4 py-2 bg-white border rounded-md"
                    >
                      Choose file
                    </button>
                    <button
                      onClick={() => {
                        setLogoFile(null);
                        setForm({ ...form, logoUrl: "" });
                      }}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-md"
                    >
                      Remove
                    </button>
                    {logoFile && (
                      <div className="text-sm text-slate-600">
                        {logoFile.name}
                      </div>
                    )}
                    {!logoFile && form.logoUrl && (
                      <img
                        src={form.logoUrl}
                        alt="logo-preview"
                        className="w-20 h-10 object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setModalOpen(false);
                      setEditing(null);
                      setForm(blank);
                      setLogoFile(null);
                    }}
                    className="px-4 py-2 bg-white border rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveCompany}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-white ${
                      saving ? "bg-slate-400" : "bg-[#036173]"
                    }`}
                  >
                    {saving ? "Saving..." : editing ? "Save" : "Add Company"}
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

export default CompanyManagement;
