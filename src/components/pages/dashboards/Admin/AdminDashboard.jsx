import React, { useState, useMemo, useEffect } from "react";
import AdminSidebar from "../../../shared/layout/AdminSidebar";
import UserManagement from "./UserManagement";
import VesselManagement from "./VesselManagement";
import {
  MdPeople,
  MdDirectionsBoat,
  MdStorefront,
  MdOutlineInventory,
  MdAssessment,
  MdSettings,
  MdHistory,
  MdDashboard,
} from "react-icons/md";
import Overview from "./Overview";
import VendorManagement from "../VendorManagement";
import RequestManagement from "./RequestManagment";
import AdminSettings from "./AdminSettings";
import AdminLogs from "./AdminLogs";
import CompanyManagement from "./CompanyManagement"; // new companies page
import ChatRoom from "../ChatRoom";
import { useAuth } from "../../../context/AuthContext";
import InventoryManagement from "../InventoryManagement";



const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [users, setUsers] = useState([]);
  const [vatRate, setVatRate] = useState(7.5);
  const { user, getToken } = useAuth();
const [chatUnreadCount, setChatUnreadCount] = useState(0);
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminSidebarCollapsed") === "true";
  }
  return false;
});

const fetchChatUnreadCount = async () => {
  try {
    const token = getToken();
    if (!token) return;
    const resp = await axios.get(
      "https://hdp-backend-1vcl.onrender.com/api/chat/unread-count",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setChatUnreadCount(resp.data?.unreadCount || 0);
  } catch (err) {
    setChatUnreadCount(0);
  }
};

useEffect(() => {
  if (user) {
    fetchChatUnreadCount();
    const interval = setInterval(fetchChatUnreadCount, 3000); // every 3 seconds
    return () => clearInterval(interval);
  }
}, [user]);
  // quick derived stats (used by Overview)
  const vendorCount = 24;
  const inventoryCount = 1240;
  const reportsCount = 18;
  const logsCount = 432;
  const adminsCount = users.filter((u) => u.role === "Admin").length;
  const totalUsers = users.length;
  

  // nav items (kept for reference / potential right-side header)
  const navItems = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: <MdDashboard /> },
      { id: "users", label: "User Management", icon: <MdPeople /> },
      { id: "vessels", label: "Vessel Management", icon: <MdDirectionsBoat /> },
      { id: "vendors", label: "Vendors", icon: <MdStorefront /> },
      { id: "inventory", label: "Inventory", icon: <MdOutlineInventory /> },
      { id: "requests", label: "Request Management", icon: <MdAssessment /> },
      { id: "settings", label: "Settings", icon: <MdSettings /> },
      { id: "logs", label: "Logs", icon: <MdHistory /> },
    ],
    []
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs (full background styling) */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Grid pattern background (80px grid, matches login/manager backgrounds) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          opacity: 0.015,
        }}
      />

      {/* Radial gradient fade for subtle lightening */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full">
        {/* AdminSidebar (fixed / responsive) */}
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
           chatUnreadCount={chatUnreadCount} 
             collapsed={sidebarCollapsed}
  setCollapsed={setSidebarCollapsed}
        />
            {activeSection === "chatRoom" && <ChatRoom />}

        {/* Main content area (full width) */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 w-full">
            {/* Header */}

            {/* Section content */}
            {activeSection === "overview" && (
              <Overview
                vendorCount={vendorCount}
                inventoryCount={inventoryCount}
                reportsCount={reportsCount}
                logsCount={logsCount}
                totalUsers={totalUsers}
                adminsCount={adminsCount}
                onOpenSection={(id) => setActiveSection(id)}
              />
            )}

            {activeSection === "users" && (
              <UserManagement
                users={users}
                setUsers={setUsers}
                openUserModalFor={null}
                setOpenUserModalFor={() => {}}
              />
            )}

            {activeSection === "vessels" && <VesselManagement users={users} />}

            {activeSection === "vendors" && <VendorManagement />}

            {activeSection === "companies" && <CompanyManagement />}

            {activeSection === "inventory" && <InventoryManagement />}

            {activeSection === "requests" && <RequestManagement />}

            {activeSection === "settings" && (
              <AdminSettings vatRate={vatRate} setVatRate={setVatRate} />
            )}

            {activeSection === "logs" && <AdminLogs />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
