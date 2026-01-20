import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useGlobalAlert } from "../../shared/GlobalAlert";
import { useGlobalPrompt } from "../../shared/GlobalPrompt";

const formatAmount = (v, currency = "NGN") =>
  `${currency} ${Number(Number(v || 0).toFixed(2)).toLocaleString()}`;

const AttachItems = ({
  targetRequestId,
      apiBase = import.meta.env.VITE_API_BASE_URL,
  getToken,
  onAttached = () => {},
}) => {
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);
  const [sourceItems, setSourceItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const inputRef = useRef(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);
  const { showAlert } = useGlobalAlert();
  const { showPrompt } = useGlobalPrompt();

  
  useEffect(() => {
    const onPointer = (e) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const loadOptions = async (term = "") => {
    setLoadingOptions(true);
    try {
      const token = getToken ? getToken() : null;
      const resp = await axios.get(`${apiBase}/requests/pending`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const all = resp.data?.data || resp.data || [];
      // exclude any request with tag === "shipping"
      const filtered = (all || []).filter((r) => {
        if (!r) return false;
        if (Array.isArray(r.tags) && r.tags.length) {
          return !r.tags.map((t) => String(t).toLowerCase()).includes("shipping");
        }
        const tag = (r.tag || "").toString().toLowerCase();
        return !tag.includes("shipping");
      });
      // exclude current target request
      const list = filtered.filter((r) => {
        const id = r.requestId || r.id;
        return id !== targetRequestId;
      });
      // compute itemCount and totalPrice for each
      const mapped = (list || []).map((r) => {
        const items = Array.isArray(r.items) ? r.items : [];
        const itemCount = items.length || r.itemCount || 0;
        const total = items.reduce((s, it) => {
          const qty = Number(it.quantity || it.qty || 0);
          const unit = Number(it.total != null ? it.total : it.unitPrice || 0);
          const line = it.total != null ? Number(it.total) : Number(it.unitPrice || 0) * qty;
          return s + (isNaN(line) ? 0 : line);
        }, 0);
        return {
          label: r.purchaseOrderNumber || r.requestId || r.reference || r.summary || `Request ${r.requestId || r.id}`,
          vendor: r.vendor || r.requester?.displayName || "",
          requestId: r.requestId || r.id,
          itemCount,
          total,
          currency: r.currency || "NGN",
        };
      });
      // optional local search filter
      const q = (term || "").toString().trim().toLowerCase();
      const final = q
        ? mapped.filter((m) => {
            return (
              (m.vendor || "").toString().toLowerCase().includes(q) ||
              (m.label || "").toString().toLowerCase().includes(q)
            );
          })
        : mapped;
      // newest first by default (keep server order if none)
      setOptions(final.slice(0, 50));
    } catch (err) {
      console.error("AttachItems: failed to load options", err);
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSource = async (sourceRequestId) => {
    if (!sourceRequestId) return null;
    setIsLoadingItems(true);
    try {
      const token = getToken ? getToken() : null;
      const resp = await axios.get(`${apiBase}/requests/${encodeURIComponent(sourceRequestId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const src = resp.data?.data || resp.data || {};
      const items = Array.isArray(src.items) ? src.items : [];
      setSourceItems(items);
      const ids = items.map((it) => it.itemId || it._id || it.id).filter(Boolean);
      setSelectedItemIds(ids);
      const meta = {
        requestId: src.requestId || sourceRequestId,
        vendor: src.vendor || src.requester?.displayName || "",
      };
      setSelectedSource(meta);
      return { src, items, meta };
    } catch (err) {
      console.error("AttachItems: failed to load source request", err);
      setSourceItems([]);
      setSelectedItemIds([]);
      setSelectedSource(null);
      showAlert(err?.response?.data?.message || "Failed to load source request items");
      return null;
    } finally {
      setIsLoadingItems(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const selectAll = () => {
    setSelectedItemIds(sourceItems.map((it) => it.itemId || it._id || it.id).filter(Boolean));
  };

  const clear = () => {
    setSourceItems([]);
    setSelectedItemIds([]);
    setSelectedSource(null);
  };

// ...existing code...
  const attach = async (purpose = "", skipConfirm = false, forceSourceRequestId = null) => {
    const sourceIdToUse = forceSourceRequestId || (selectedSource && selectedSource.requestId);
    if (!sourceIdToUse || !targetRequestId) return;
    if (!selectedItemIds || selectedItemIds.length === 0) {
      showAlert("No items selected to attach");
      return;
    }
    if (!skipConfirm) {
  const ok = await showPrompt(
    "Attach selected items to this request?"
  );
  if (!ok) return;    }
    setAttaching(true);
    try {
      const token = getToken ? getToken() : null;
      const payload = {
        sourceRequestId: sourceIdToUse,
        itemIds: selectedItemIds,
        purpose: purpose || "",
      };
      const resp = await axios.post(`${apiBase}/requests/${encodeURIComponent(targetRequestId)}/attach`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      console.debug("AttachItems: attach response:", resp?.data);
      showAlert(resp.data?.message || "Items attached");
      clear();
      // pass server response to parent in case callers want details
      onAttached(resp.data || null);
      return resp.data;
    } catch (err) {
      console.error("AttachItems: attach failed", err);
      showAlert(err?.response?.data?.message || "Failed to attach items");
      return null;
    } finally {
      setAttaching(false);
    }
  };
// ...existing code...
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Attach Items from Another Request (Accounting)</h3>

      <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
        <div className="flex gap-3 items-start relative" ref={wrapperRef}>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => {
              const v = e.target.value;
              setSearch(v);
              loadOptions(v); // live-filter as user types
            }}
            onFocus={() => {
              setDropdownOpen(true);
              loadOptions("");
            }}
            onClick={() => setDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                loadOptions(search);
                setDropdownOpen(true);
              }
            }}
            placeholder="Search vendor or PON (excludes shipping requests)"
            className="flex-1 px-4 py-3 border rounded-xl"
          />
        </div>

        <div className="mt-3">
          {dropdownOpen ? (
            options.length === 0 ? (
              <div className="text-sm text-slate-500">No pending requests available</div>
            ) : (
              <div className="grid gap-2">
                {options.map((opt) => (
                  <button
                  key={opt.requestId}
                  onClick={async () => {
                    setDropdownOpen(false);
                    // load source items first (returns src+items+meta)
                    const loaded = await loadSource(opt.requestId);
                    if (!loaded) return;
                    // ensure all items are selected (loadSource already set selectedItemIds)
                    // automatically attach all items without prompting and use returned meta.requestId to avoid state race
                    await attach("", true, loaded.meta && loaded.meta.requestId ? loaded.meta.requestId : opt.requestId);
                  }}
                  className="p-3 rounded-lg border hover:bg-slate-50 text-left flex items-center justify-between"
                >
                    <div>
                      <div className="text-sm font-semibold">{opt.label}</div>
                      <div className="text-xs text-slate-500">{opt.vendor}</div>
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      <div>{opt.itemCount} item{opt.itemCount === 1 ? "" : "s"}</div>
                      <div className="mt-1">{formatAmount(opt.total, opt.currency)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : null}
        </div>

        {isLoadingItems && <div className="text-sm text-slate-500 mt-3">Loading items…</div>}

        {sourceItems.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
             <div>
  <div className="text-sm font-semibold">
    Source: {selectedSource?.requestId}
  </div>
  <div className="text-xs text-slate-500">{selectedSource?.vendor}</div>
  {selectedSource?.total !== undefined && (
    <div className="text-xs text-slate-700 font-semibold mt-1">
      Total: {formatAmount(selectedSource.total, selectedSource.currency)}
    </div>
  )}
</div>

              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md">Select All</button>
                <button onClick={clear} className="px-3 py-1 bg-red-50 text-red-600 rounded-md">Clear</button>
              </div>
            </div>

            <div className="grid gap-2">
              {sourceItems.map((it) => {
                const iid = it.itemId || it._id || it.id;
                return (
                  <label key={iid} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                    <div>
                      <div className="text-sm font-semibold">{it.name || it.description || iid}</div>
                      <div className="text-xs text-slate-500">Qty: {it.quantity || it.qty || "N/A"}</div>
                    </div>
                    <div>
                      <input type="checkbox" checked={selectedItemIds.includes(iid)} onChange={() => toggleSelect(iid)} />
                    </div>
                  </label>
                );
              })}
            </div>

            {/* <div className="mt-4 flex items-center gap-2">
              <input placeholder="Purpose (optional)" id="attach-purpose-accounting" className="flex-1 px-3 py-2 border rounded-lg" />
              <button
                onClick={() => {
                  const el = document.getElementById("attach-purpose-accounting");
                  const purpose = el ? el.value.trim() : "";
                  attach(purpose);
                }}
                disabled={attaching || selectedItemIds.length === 0}
                className="px-4 py-2 bg-[#036173] text-white rounded-lg"
              >
                {attaching ? "Attaching…" : "Attach Selected"}
              </button>
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
// ...existing code...
};

export default AttachItems;