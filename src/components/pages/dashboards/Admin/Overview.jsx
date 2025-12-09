import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import {
  MdPeople,
  MdPersonAdd,
  MdShoppingCart,
  MdCheckCircle,
} from "react-icons/md";

const Sparkline = ({ data = [2, 6, 4, 8, 6, 10], color = "#10b981" }) => (
  <svg viewBox="0 0 100 24" className="w-full h-6">
    <polyline
      fill="none"
      stroke={color}
      strokeWidth="2"
      points={data
        .map(
          (v, i) =>
            `${(i / (data.length - 1)) * 100},${
              24 - (v / Math.max(...data)) * 20
            }`
        )
        .join(" ")}
    />
  </svg>
);

const MiniStatCard = ({
  title,
  subtitle,
  value,
  icon,
  gradient = "from-[#036173] to-emerald-600",
  onClick,
}) => (
  <button onClick={onClick} className="w-full text-left group">
    <div
      className={`bg-gradient-to-r ${gradient} text-white rounded-2xl p-5 shadow-xl transform hover:-translate-y-1 transition-all duration-200`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase opacity-90">
            {title}
          </div>
          <div className="mt-2 text-2xl font-extrabold">{value}</div>
          {subtitle && (
            <div className="mt-1 text-sm opacity-90">{subtitle}</div>
          )}
        </div>
        <div className="text-3xl opacity-90">{icon}</div>
      </div>
      <div className="mt-3 opacity-80">
        <Sparkline />
      </div>
    </div>
  </button>
);

const Overview = ({
  vendorCount = 0,
  inventoryCount = 0,
  reportsCount = 0,
  logsCount = 0,
  totalUsers = 0,
  adminsCount = 0,
  onOpenSection = () => {},
}) => {
  const { getToken } = useAuth();
  const API_BASE = "https://hdp-backend-1vcl.onrender.com/api";

  const [countsLoading, setCountsLoading] = useState(false);
  const [totalUsersFetched, setTotalUsersFetched] = useState(null);
  const [adminsFetched, setAdminsFetched] = useState(null);
  const [suspendedFetched, setSuspendedFetched] = useState(null);
  const [vendorsFetched, setVendorsFetched] = useState(null);
  const [inventoryFetched, setInventoryFetched] = useState(null);

  const getAuthHeaders = () => {
    const token = getToken ? getToken() : sessionStorage.getItem("userToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const fetchCounts = async () => {
      setCountsLoading(true);
      try {
        const headers = getAuthHeaders();
        const usersUrl = `${API_BASE}/admin/users?page=1&limit=1`;
        const suspendedUrl = `${API_BASE}/admin/users?page=1&limit=1&status=suspended`;
        const adminsUrl = `${API_BASE}/admin/admins?page=1&limit=1`;
        const vendorsUrl = `${API_BASE}/vendors?page=1&limit=1`;
        const inventoryUrl = `${API_BASE}/inventory?page=1&limit=1`;
        const [uResp, sResp, aResp, vResp, iResp] = await Promise.all([
          axios.get(usersUrl, { headers }),
          axios.get(suspendedUrl, { headers }),
          axios.get(adminsUrl, { headers }),
          axios.get(vendorsUrl, { headers }),
          axios.get(inventoryUrl, { headers }),
        ]);
        const uBody = uResp?.data || {};
        const sBody = sResp?.data || {};
        const aBody = aResp?.data || {};
        const vBody = vResp?.data || {};
        const iBody = iResp?.data || {};
        setTotalUsersFetched(
          typeof uBody.total === "number"
            ? uBody.total
            : uBody?.data?.length ?? null
        );
        setSuspendedFetched(
          typeof sBody.total === "number"
            ? sBody.total
            : sBody?.data?.length ?? 0
        );
        setAdminsFetched(
          typeof aBody.total === "number"
            ? aBody.total
            : aBody?.data?.length ?? null
        );
        setVendorsFetched(
          typeof vBody.total === "number"
            ? vBody.total
            : vBody?.data?.length ?? null
        );
        setInventoryFetched(
          typeof iBody.total === "number"
            ? iBody.total
            : iBody?.data?.length ?? null
        );
      } catch (err) {
        console.error(
          "Overview: failed to fetch counts:",
          err?.response?.data || err.message || err
        );
        // leave fetched values null to fallback to props
      } finally {
        setCountsLoading(false);
      }
    };
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalUsersDisplay = totalUsersFetched ?? totalUsers;
  const adminsDisplay = adminsFetched ?? adminsCount;
  const vendorCountDisplay = vendorsFetched ?? vendorCount;
  const inventoryCountDisplay = inventoryFetched ?? inventoryCount;
  const suspendedDisplay = suspendedFetched ?? null;
  const activeDisplay =
    suspendedDisplay != null && totalUsersFetched != null
      ? Math.max(0, totalUsersFetched - suspendedDisplay)
      : null;

  return (
    // Full-background wrapper: animated orbs, grid pattern, radial fade
    <div className="space-y-6">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />
      {/* Foreground content (original Overview) */}
      <div className="relative z-10 p-0">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
            <MiniStatCard
              title="Users"
              value={totalUsersDisplay}
              subtitle={
                suspendedDisplay != null
                  ? `Active ${suspendedDisplay} `
                  : "Active • Suspended"
              }
              icon={<MdPeople />}
              gradient="from-[#0ea5a3] to-emerald-500"
              onClick={() => onOpenSection("users")}
            />
            <MiniStatCard
              title="Admins"
              value={adminsDisplay}
              subtitle="Management accounts"
              icon={<MdPersonAdd />}
              gradient="from-[#7c3aed] to-purple-600"
              onClick={() => onOpenSection("users")}
            />
            <div className="group">
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      System Health
                    </div>
                    <div className="mt-2 text-2xl font-extrabold text-slate-900">
                      Good
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Uptime 99.98% • CPU 12%
                    </div>
                  </div>
                  <div className="text-3xl text-slate-400">⚙️</div>
                </div>
                <div className="mt-3">
                  <Sparkline data={[4, 6, 5, 9, 8, 10, 9]} color="#0ea5a3" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onOpenSection("logs")}
                    className="px-3 py-2 text-sm bg-slate-50 rounded-lg"
                  >
                    View Logs
                  </button>
                  <button
                    onClick={() => onOpenSection("settings")}
                    className="px-3 py-2 text-sm bg-[#036173] text-white rounded-lg"
                  >
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => onOpenSection("vendors")}
              className="cursor-pointer bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Vendors
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {vendorCountDisplay}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Onboarded vendors
                  </div>
                </div>
                <div className="text-2xl text-emerald-500">🏷️</div>
              </div>
            </div>

            <div
              onClick={() => onOpenSection("inventory")}
              className="cursor-pointer bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Inventory
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {Number.isFinite(inventoryCountDisplay)
                      ? inventoryCountDisplay.toLocaleString()
                      : inventoryCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">Total SKUs</div>
                </div>
                <div className="text-2xl text-blue-500">📦</div>
              </div>
            </div>

            <div
              onClick={() => onOpenSection("requests")}
              className="cursor-pointer bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Requests
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {reportsCount}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Saved reports
                  </div>
                </div>
                <div className="text-2xl text-indigo-500">📊</div>
              </div>
            </div>

            <div
              onClick={() => onOpenSection("logs")}
              className="cursor-pointer bg-white rounded-2xl p-4 shadow-md border border-slate-100 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Logs
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {logsCount}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    Recent events
                  </div>
                </div>
                <div className="text-2xl text-amber-500">📝</div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">
              Recent Activity (Prototype)
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    User created: Sarah Johnson
                  </div>
                  <div className="text-xs text-slate-500">2 hours ago</div>
                </div>
                <div className="text-xs text-slate-400">User Mgmt</div>
              </li>
              <li className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">VAT rate updated</div>
                  <div className="text-xs text-slate-500">Yesterday</div>
                </div>
                <div className="text-xs text-slate-400">Settings</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
