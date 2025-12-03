import React, { useState } from "react";
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
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/*
  AdminSidebar
  Props:
    - activeSection: string
    - setActiveSection: fn
  Notes:
    - Matches Sidebar layout / styling used elsewhere
    - No counts/badges as requested
*/

const AdminSidebar = ({
  activeSection = "overview",
  setActiveSection = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { id: "overview", label: "Overview", icon: <MdDashboard /> },
    { id: "users", label: "User Management", icon: <MdPeople /> },
    { id: "vessels", label: "Vessel Management", icon: <MdDirectionsBoat /> },
    { id: "vendors", label: "Vendors", icon: <MdStorefront /> },
    { id: "companies", label: "Companies", icon: <MdOutlineMonetizationOn /> },
    { id: "inventory", label: "Inventory", icon: <MdOutlineInventory /> },
    { id: "requests", label: "Request Management", icon: <MdAssessment /> },
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
      {/* mobile toggle */}
      <button
        onClick={() => setIsOpen((s) => !s)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors shadow-lg"
      >
        {isOpen ? (
          <IoMdClose className="text-2xl" />
        ) : (
          <IoMdMenu className="text-2xl" />
        )}
      </button>

      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#0a0a0a] border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">Gemz Admin</h1>
              <p className="text-gray-400 text-xs">Admin Console</p>
            </div>
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
              >
                <div className="text-lg">{it.icon}</div>
                <span className="font-medium">{it.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Profile & Logout */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/50 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
              {getInitials(user?.displayName || user?.username || "AD")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.displayName || "Admin User"}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {user?.email || user?.username || ""}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium text-sm transition-all duration-200 border border-red-500/20"
          >
            Logout
          </button>
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
