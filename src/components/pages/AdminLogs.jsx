import React, { useMemo, useState, useEffect } from "react";
import {
  MdErrorOutline,
  MdInfo,
  MdWarningAmber,
  MdBugReport,
  MdDownload,
  MdSearch,
  MdFilterList,
} from "react-icons/md";

/*
  AdminLogs - polished prototype logs view for Admin Dashboard
  - mock data
  - search + severity filter + realtime toggle (mock)
  - grouped by date with elegant timeline items
  - export JSON button
*/

const mockLogs = [
  {
    id: "L-1001",
    level: "critical",
    timestamp: Date.now() - 1000 * 60 * 10,
    actor: "System",
    service: "Payments",
    message: "Payment gateway outage detected - failover initiated",
    details:
      "Auto-failover triggered to backup provider. Rolling retries in progress.",
  },
  {
    id: "L-0999",
    level: "error",
    timestamp: Date.now() - 1000 * 60 * 60 * 3,
    actor: "ProcurementService",
    service: "Procurement API",
    message: "Failed to create purchase order",
    details: "Validation error: vendorId missing for item 3.",
  },
  {
    id: "L-0997",
    level: "warning",
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    actor: "Scheduler",
    service: "SyncJob",
    message: "Delayed sync: >24h since last run",
    details:
      "Queue depth increased; investigating network latency to remote site.",
  },
  {
    id: "L-0988",
    level: "info",
    timestamp: Date.now() - 1000 * 60 * 60 * 50,
    actor: "Auth",
    service: "Login",
    message: "New admin login",
    details: "Admin 'emma.d@gemz.com' logged in from 197.54.23.10",
  },
  {
    id: "L-1003",
    level: "info",
    timestamp: Date.now() - 1000 * 60 * 5,
    actor: "Uploader",
    service: "Quotations",
    message: "Quotation uploaded",
    details: "User uploaded 'quotation_452.pdf' for REQ-2024-004",
  },
  // more generated entries
];

const levelStyles = {
  critical: { bg: "bg-red-50", text: "text-red-700", icon: MdBugReport },
  error: { bg: "bg-rose-50", text: "text-rose-700", icon: MdErrorOutline },
  warning: { bg: "bg-amber-50", text: "text-amber-700", icon: MdWarningAmber },
  info: { bg: "bg-sky-50", text: "text-sky-700", icon: MdInfo },
};

const formatDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleString();
};

const groupByDay = (items) => {
  return items.reduce((acc, it) => {
    const day = new Date(it.timestamp).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(it);
    return acc;
  }, {});
};

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [realtime, setRealtime] = useState(true);

  useEffect(() => {
    // initial load (mock)
    setLogs(mockLogs);
    // if realtime mock enabled, append a new info log every 12s (demo)
    if (!realtime) return;
    const t = setInterval(() => {
      const id = `L-${Math.floor(1000 + Math.random() * 9000)}`;
      const levels = ["info", "warning"];
      const lvl = levels[Math.floor(Math.random() * levels.length)];
      setLogs((prev) => [
        {
          id,
          level: lvl,
          timestamp: Date.now(),
          actor: "Heartbeat",
          service: "Monitor",
          message:
            lvl === "info" ? "Heartbeat OK" : "Transient latency detected",
          details: "Synthetic demo log entry",
        },
        ...prev,
      ]);
    }, 12000);
    return () => clearInterval(t);
  }, [realtime]);

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    return logs.filter((l) => {
      if (levelFilter !== "all" && l.level !== levelFilter) return false;
      if (!q) return true;
      return (
        (l.message || "").toLowerCase().includes(q) ||
        (l.actor || "").toLowerCase().includes(q) ||
        (l.service || "").toLowerCase().includes(q) ||
        (l.details || "").toLowerCase().includes(q) ||
        (l.id || "").toLowerCase().includes(q)
      );
    });
  }, [logs, query, levelFilter]);

  const grouped = useMemo(() => {
    const g = groupByDay(filtered);
    // keep newest days first
    return Object.entries(g)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .map(([day, items]) => ({
        day,
        items: items.sort((x, y) => y.timestamp - x.timestamp),
      }));
  }, [filtered]);

  const stats = useMemo(() => {
    const total = logs.length;
    const critical = logs.filter((l) => l.level === "critical").length;
    const errors = logs.filter((l) => l.level === "error").length;
    const warnings = logs.filter((l) => l.level === "warning").length;
    const info = logs.filter((l) => l.level === "info").length;
    return { total, critical, errors, warnings, info };
  }, [logs]);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header / Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">System Logs</h3>
          <p className="text-sm text-slate-500 mt-1">
            Audit timeline for platform activity — prototype data only
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/90 border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className="text-slate-600 text-sm flex items-center gap-2">
              <MdSearch />{" "}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search logs..."
                className="outline-none text-sm bg-transparent"
              />
            </div>
            <div className="h-6 w-px bg-slate-100 mx-2" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="text-sm bg-transparent outline-none"
            >
              <option value="all">All levels</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <button
            onClick={() => setRealtime((r) => !r)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              realtime
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {realtime ? "Live" : "Paused"}
          </button>

        
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500">Total Events</div>
          <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 shadow-sm">
          <div className="text-xs text-red-600">Critical</div>
          <div className="text-2xl font-bold text-red-700">
            {stats.critical}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm">
          <div className="text-xs text-rose-600">Errors</div>
          <div className="text-2xl font-bold text-rose-700">{stats.errors}</div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
          <div className="text-xs text-amber-700">Warnings</div>
          <div className="text-2xl font-bold text-amber-700">
            {stats.warnings}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {grouped.length === 0 && (
          <div className="bg-white/90 border rounded-2xl p-8 text-center text-slate-500">
            No logs to display
          </div>
        )}

        {grouped.map(({ day, items }) => (
          <div
            key={day}
            className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-700">{day}</h4>
                <div className="text-xs text-slate-400 mt-1">
                  {items.length} event{items.length > 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-xs text-slate-400">
                Latest: {formatDate(items[0].timestamp)}
              </div>
            </div>

            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-5 top-6 bottom-6 w-px bg-slate-100" />

              <ul className="space-y-6 pl-10">
                {items.map((it) => {
                  const lvl = levelStyles[it.level] || levelStyles.info;
                  const Icon = lvl.icon;
                  return (
                    <li key={it.id} className="flex items-start gap-4">
                      <div
                        className={`flex-none w-10 h-10 rounded-full flex items-center justify-center ${lvl.bg} ${lvl.text} border ${lvl.text} border-opacity-10 text-xl font-semibold`}
                      >
                        <Icon />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">
                                {it.message}
                              </div>
                              <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                {it.service}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {it.actor} • {formatDate(it.timestamp)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                it.level === "critical"
                                  ? "bg-red-100 text-red-700"
                                  : it.level === "error"
                                  ? "bg-rose-100 text-rose-700"
                                  : it.level === "warning"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-sky-50 text-sky-700"
                              }`}
                            >
                              {it.level.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          {it.details}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLogs;
