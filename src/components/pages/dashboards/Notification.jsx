import React, { useState, useMemo, useEffect } from "react";
import {
  MdSearch,
  MdCheckCircle,
  MdPendingActions,
  MdHistory,
  MdNotificationsActive,
  MdPerson,
  MdDelete,
  MdDoneAll,
} from "react-icons/md";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const PAGE_SIZE = 20;
const API_BASE = "https://hdp-backend-1vcl.onrender.com/api";

const getTypeColor = (type) => {
  switch (type) {
    case "success":
    case "approved":
      return "bg-emerald-100 text-emerald-700";
    case "info":
    case "comment":
      return "bg-blue-100 text-blue-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "error":
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getIcon = (type) => {
  switch (type) {
    case "success":
    case "approved":
      return <MdCheckCircle />;
    case "info":
    case "comment":
      return <MdPendingActions />;
    case "warning":
      return <MdHistory />;
    case "error":
    case "rejected":
      return <MdPerson />;
    default:
      return <MdNotificationsActive />;
  }
};

const Notification = ({ onUnreadCountChange }) => {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);

  // Fetch notifications
  const fetchNotifications = async (opts = {}) => {
    setLoading(true);
    try {
      const token = getToken?.();
      const params = {
        page: opts.page || page,
        limit: PAGE_SIZE,
      };
      const q = (opts.search ?? search).trim();
      if (q) params.search = q;
      const resp = await axios.get(`${API_BASE}/notifications`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = resp.data || {};
      setNotifications(Array.isArray(body.data) ? body.data : []);
      setPage(body.page || 1);
      setPages(body.pages || 1);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = getToken?.();
      const resp = await axios.get(`${API_BASE}/notifications/unread-count`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setUnreadCount(resp.data?.unreadCount || 0);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications({ page: 1 });
    fetchUnreadCount();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchNotifications({ page: 1, search });
    setPage(1);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    fetchNotifications({ page });
    // eslint-disable-next-line
  }, [page]);

  // Mark as read
const handleMarkAsRead = async (notificationId) => {
  if (!window.confirm("Mark this notification as read?")) return;
  setMarking(true);
  try {
    const token = getToken?.();
    await axios.patch(
      `${API_BASE}/notifications/${encodeURIComponent(notificationId)}/read`,
      {},
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    fetchNotifications({ page });
    fetchUnreadCount();
    if (onUnreadCountChange) onUnreadCountChange(); // <-- add this line
  } catch {}
  setMarking(false);
};

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!window.confirm("Mark all notifications as read?")) return;
    setMarking(true);
    try {
      const token = getToken?.();
      await axios.patch(
        `${API_BASE}/notifications/mark-all-read`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      fetchNotifications({ page: 1 });
      fetchUnreadCount();
      if (onUnreadCountChange) onUnreadCountChange();
      setPage(1);
    } catch {}
    setMarking(false);
  };

  // Delete notification
  const handleDelete = async (notificationId) => {
    if (!window.confirm("Delete this notification?")) return;
    setMarking(true);
    try {
      const token = getToken?.();
      await axios.delete(
        `${API_BASE}/notifications/${encodeURIComponent(notificationId)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      fetchNotifications({ page });
      fetchUnreadCount();
      if (onUnreadCountChange) onUnreadCountChange();
    } catch {}
    setMarking(false);
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    setMarking(true);
    try {
      const token = getToken?.();
      await axios.delete(`${API_BASE}/notifications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchNotifications({ page: 1 });
      fetchUnreadCount();
      if (onUnreadCountChange) onUnreadCountChange();
      setPage(1);
    } catch {}
    setMarking(false);
  };

  // Search and sort: unread first, then read (greyed out)
  const sortedNotifications = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = notifications;
    if (q) {
      list = list.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.message || "").toLowerCase().includes(q)
      );
    }
    // unread first, then read
    return [...list].sort((a, b) => {
      if (a.isRead === b.isRead) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return a.isRead ? 1 : -1;
    });
  }, [notifications, search]);

  // Pagination for filtered/sorted list
  const totalPages = Math.max(
    1,
    Math.ceil(sortedNotifications.length / PAGE_SIZE)
  );
  const paginatedNotifications = sortedNotifications.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div className="overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Glassmorphism animated orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          opacity: 0.015,
        }}
      />

      {/* Radial gradient fade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full">
    

        {/* Main Content - Notifications */}
        <div className="flex-1 overflow-y-auto px-0 py-0 flex flex-col items-stretch justify-start">
          <div className="w-full px-10 py-10">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
                  Notifications
                </h2>
                <p className="text-gray-500 text-base">
                  Stay up to date with your latest activity and system updates.
                </p>
              </div>
              {/* Search bar */}
              <div className="flex items-center bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-xl px-4 py-2 shadow gap-2 w-full sm:w-80">
                <MdSearch className="text-xl text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search notifications..."
                  className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={marking || unreadCount === 0}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow flex items-center gap-2 ${
                    unreadCount === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  <MdDoneAll className="text-base" />
                  Mark All as Read
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={marking || notifications.length === 0}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow flex items-center gap-2 ${
                    notifications.length === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  <MdDelete className="text-base" />
                  Clear All
                </button>
              </div>
              <div className="text-xs text-gray-400">
                {loading
                  ? "Loading..."
                  : `${notifications.length} notifications`}
              </div>
            </div>
            <div className="space-y-6 w-full">
              {paginatedNotifications.length === 0 && (
                <div className="text-center text-gray-400 py-12 text-lg">
                  No notifications found.
                </div>
              )}
              {paginatedNotifications.map((n) => (
                <div
                  key={n.notificationId}
                  className={`relative bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg p-6 flex items-center gap-5 transition-all hover:scale-[1.015] hover:shadow-emerald-100/40 w-full`}
                  style={{
                    boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.08)",
                    borderLeft: n.isRead
                      ? "6px solid #e5e7eb"
                      : "6px solid #10b981",
                    opacity: n.isRead ? 0.6 : 1,
                  }}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow ${getTypeColor(
                      n.type
                    )}`}
                  >
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {n.title}
                      </h3>
                      {n.type === "success" && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          Success
                        </span>
                      )}
                      {n.type === "info" && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                          Info
                        </span>
                      )}
                      {n.type === "warning" && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                          Warning
                        </span>
                      )}
                      {n.type === "error" && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          Error
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1 text-base">{n.message}</p>
                  </div>
                  <div className="flex flex-col items-end min-w-[110px]">
                    <div className="mt-2 text-xs text-gray-400 font-medium">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleString()
                        : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(n.notificationId)}
                          disabled={marking}
                          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow bg-emerald-500 text-white hover:bg-emerald-600"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.notificationId)}
                        disabled={marking}
                        className="px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 shadow bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                      page === i + 1
                        ? "bg-[#036173] text-white"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
