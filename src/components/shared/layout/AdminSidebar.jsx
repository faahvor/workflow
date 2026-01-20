import React, { useEffect, useState } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPeople,
  MdDirectionsBoat,
  MdStorefront,
  MdOutlineInventory,
  MdAssessment,
  MdSettings,
  MdHistory,
  MdPersonAdd,
  MdOutlineMonetizationOn,
  MdChat,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { IoIosLogOut } from "react-icons/io";
import { LuListCollapse } from "react-icons/lu";



const hamburgerStyle = `
.copilot-hamburger {
  width: 28px;
  height: 28px;
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
}
.copilot-hamburger-bar {
  display: block;
  position: absolute;
  height: 3px;
  width: 100%;
  background: #fff;
  border-radius: 2px;
  opacity: 1;
  left: 0;
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
}
.copilot-hamburger-bar:nth-child(1) {
  top: 6px;
}
.copilot-hamburger-bar:nth-child(2) {
  top: 13px;
}
.copilot-hamburger-bar:nth-child(3) {
  top: 20px;
}
.copilot-hamburger.open .copilot-hamburger-bar:nth-child(1) {
  transform: rotate(45deg);
  top: 13px;
}
.copilot-hamburger.open .copilot-hamburger-bar:nth-child(2) {
  opacity: 0;
}
.copilot-hamburger.open .copilot-hamburger-bar:nth-child(3) {
  transform: rotate(-45deg);
  top: 13px;
}
`;



const AdminSidebar = ({
  activeSection = "overview",
  setActiveSection = () => {},
  chatUnreadCount = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState("");
useEffect(() => {
  const fetchLogo = async () => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/settings/logo`);
      const data = await resp.json();
      if (data && data.url) setLogoUrl(data.url);
    } catch (err) {
      setLogoUrl(""); // fallback to default if needed
    }
  };
  fetchLogo();
}, []);
const [collapsed, setCollapsed] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("adminSidebarCollapsed") === "true";
  }
  return false;
});


useEffect(() => {
  localStorage.setItem("adminSidebarCollapsed", collapsed);
}, [collapsed]);

  const navItems = [
    { id: "overview", label: "Overview", icon: <MdDashboard /> },
    { id: "users", label: "User Management", icon: <MdPeople /> },
    { id: "vessels", label: "Vessel Management", icon: <MdDirectionsBoat /> },
    { id: "vendors", label: "Vendors", icon: <MdStorefront /> },
    { id: "companies", label: "Companies", icon: <MdOutlineMonetizationOn /> },
    { id: "inventory", label: "Inventory", icon: <MdOutlineInventory /> },
    { id: "requests", label: "Request Control", icon: <MdAssessment /> },
     { id: "chatRoom", label: "Chat Room", icon: <MdChat /> },
    { id: "settings", label: "Settings", icon: <MdSettings /> },
    { id: "logs", label: "Logs", icon: <MdHistory /> },
  ];

  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    if (typeof logout === "function") logout();
    navigate("/login");
  };

  return (
    <>
     <style>{hamburgerStyle}</style>
  <button
    onClick={() => setIsOpen((s) => !s)}
    className="fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors shadow-lg lg:hidden md:block"
    aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
  >
    <span className={`copilot-hamburger${isOpen ? " open" : ""}`}>
      <span className="copilot-hamburger-bar"></span>
      <span className="copilot-hamburger-bar"></span>
      <span className="copilot-hamburger-bar"></span>
    </span>
  </button>

   <div
  className={`fixed lg:static inset-y-0 left-0 z-40
    ${collapsed ? "w-20" : "w-64"}
    bg-[#0a0a0a] border-r border-gray-800/50 flex flex-col
    transform transition-all duration-300 ease-in-out
    ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 md:translate-x-0"}
  `}
>
  {/* Brand */}
  <div className="p-6 md:p-3 border-b flex items-center justify-center">
    <div className="w-12 h-12 md:w-28  rounded-xl flex items-center justify-center shadow-lg  overflow-hidden  ">
  {logoUrl ? (
    <img
      src={logoUrl}
      alt="Company Logo"
      className="w-full h-full object-contain"
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    />
  ) : (
    <span className="text-slate-400 font-bold text-xl text-center">G</span>
  )}
</div>
   
  </div>

        {/* Nav */}
        <nav className="flex-1 p-4 overflow-y-auto">
         <div className="space-y-2">
    {navItems.map((it) => (
  <button
    key={it.id}
    onClick={() => {
      setActiveSection(it.id);
      setIsOpen(false);
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      activeSection === it.id
        ? "bg-gray-800/80 text-white"
        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
    }`}
    title={it.label}
  >
   <div className="relative">
  <span className="md:text-xl text-[12px] shrink-0">{it.icon}</span>
  {collapsed && it.id === "chatRoom" && chatUnreadCount > 0 && (
    <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow">
      {chatUnreadCount}
    </span>
  )}
</div>
{!collapsed && (
  <span className="font-medium md:text-sm text-[10px]">{it.label}</span>
)}
{!collapsed && it.id === "chatRoom" && chatUnreadCount > 0 && (
  <span className="ml-auto bg-amber-500 text-white md:text-xs text-[9px] font-bold md:px-2 px-1.5 md:py-0.5 py-0.2 rounded-full shadow">
    {chatUnreadCount}
  </span>
)}
  </button>
))}
    </div>
        </nav>

        {/* Profile & Logout */}
   <div className="p-4 md:p-2 border-t border-gray-800/50 flex flex-col gap-2">
  <div className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"} p-2 rounded-xl bg-gray-800/30 mb-3`}>
    <div className="md:w-10 md:h-10 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
      {getInitials(user?.displayName || user?.username || "AD")}
    </div>
    {!collapsed && (
      <div className="flex-1 min-w-0 md:hidden lg:block">
        <p className="text-white md:text-sm text-[10px] font-medium truncate">
          {user?.displayName || "Admin User"}
        </p>
        <p className="text-gray-400 md:text-xs text-[8px] truncate">
          {user?.email || user?.username || ""}
        </p>
      </div>
    )}
  </div>
  <div className={`flex ${collapsed ? "flex-col items-center gap-2" : "flex-row items-center gap-2"}`}>
    <button
      onClick={handleLogout}
      className={`flex items-center justify-center ${collapsed ? "w-10 h-10" : "flex-1 px-4 py-2.5"} bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-medium md:text-sm text-[10px]`}
      title="Logout"
    >
      {collapsed ? (
        <IoIosLogOut className="text-xl" />
      ) : (
        <>
          <IoIosLogOut className="md:text-xl text-[10px] mr-2" />
          Logout
        </>
      )}
    </button>
    <button
      onClick={() => setCollapsed((prev) => !prev)}
      className={`flex items-center justify-center ${collapsed ? "w-10 h-10" : "flex-1 px-4 py-2.5"} bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-xl font-medium md:text-sm text-[10px]`}
      title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <LuListCollapse className="text-xl" />
      {!collapsed && <span className="ml-2">Collapse</span>}
    </button>
  </div>
</div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default AdminSidebar;
