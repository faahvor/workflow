// src/components/layout/Sidebar.jsx

import React, { useState, useEffect } from "react";
import { IoMdMenu, IoMdClose, IoIosLogOut } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdAdd,
  MdDescription,
  MdInventory,
  MdHelp,
  MdVerified,
  MdDoneAll,
  MdExpandLess,
  MdExpandMore,
  MdNotificationsActive,
  MdCancel,
  MdChat,
  MdOutlineSupportAgent,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaFileSignature } from "react-icons/fa";
import { IoAttach } from "react-icons/io5";
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

const Sidebar = ({
  activeView,
  setActiveView,
  pendingCount = 0,
  queriedCount = 0,
  rejectedCount = 0,
  notificationCount = 0,
  chatUnreadCount = 0,
  isRequester = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requestsExpanded, setRequestsExpanded] = useState(true); // expanded by default
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState("");

  const [collapsed, setCollapsed] = useState(() => {
    // Use localStorage to persist collapse state
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebarCollapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const resp = await fetch(
          "https://hdp-backend-1vcl.onrender.com/api/settings/logo"
        );
        const data = await resp.json();
        if (data && data.url) setLogoUrl(data.url);
      } catch (err) {
        setLogoUrl(""); // fallback to default if needed
      }
    };
    fetchLogo();
  }, []);

  const roleLower = String(user?.role || "").toLowerCase();
  const isProcurement =
    roleLower === "procurement manager" || roleLower === "procurement officer";
  const isProcurementManager =
    String(user?.role || "") === "Procurement Manager";
  const isAccountingLead = [
    "accountingofficer",
    "accounting officer",
    "account officer",
  ].includes(roleLower);

  const isDeliveryRole =
    roleLower === "deliverybase" ||
    roleLower === "delivery base" ||
    roleLower === "deliveryjetty" ||
    roleLower === "delivery jetty" ||
    roleLower === "deliveryvessel" ||
    roleLower === "delivery vessel";

  // Auto-expand requests submenu when sub-views are active (for procurement roles)
  useEffect(() => {
    if (isProcurement) {
      const requestsViews = ["createNew", "pending", "myRequests"];
      if (requestsViews.includes(activeView)) {
        setRequestsExpanded(true);
      }
    }
  }, [activeView, isProcurement]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleRequests = () => {
    setRequestsExpanded((prev) => !prev);
  };

  // Get user initials for avatar
  const getUserInitials = (displayName) => {
    if (!displayName) return "U";
    const names = displayName.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };
  useEffect(() => {
    if (collapsed) setRequestsExpanded(false);
  }, [collapsed]);
  return (
    <>
      {/* Mobile sidebar toggle button */}
      <style>{hamburgerStyle}</style>
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors shadow-lg lg:hidden md:block"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <span className={`copilot-hamburger${isSidebarOpen ? " open" : ""}`}>
          <span className="copilot-hamburger-bar"></span>
          <span className="copilot-hamburger-bar"></span>
          <span className="copilot-hamburger-bar"></span>
        </span>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40
        ${collapsed ? "w-20" : "w-64"} 
        bg-[#0a0a0a] border-r border-gray-800/50 
        transform transition-all duration-300 ease-in-out
        ${
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 md:translate-x-0"
        }
        flex flex-col shadow-2xl
      `}
      >
        {/* Logo */}
        <div className="p-6 md:p-3 border-b  flex items-center justify-center">
          <div className="w-12 h-12 md:w-28  rounded-xl flex items-center justify-center shadow-lg  overflow-hidden  ">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company Logo"
                className="w-full h-full object-contain"
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            ) : (
              <span className="text-slate-400 font-bold text-xl text-center">
                G
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {/* Overview/Dashboard */}
            <button
              onClick={() => {
                setActiveView("overview");
                setIsSidebarOpen(false);
              }}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
          ${
            activeView === "overview"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
              : "text-gray-400 hover:text-white hover:bg-gray-800/50"
          }`}
              title="Overview"
            >
              <MdDashboard className="md:text-xl text-[12px] shrink-0" />
              {!collapsed && (
                <span className="font-medium md:text-sm text-[10px]">
                  {isRequester ? "Dashboard" : "Overview"}
                </span>
              )}
            </button>

            {/* Create New (Requester only) */}
            {isRequester && (
              <button
                onClick={() => {
                  setActiveView("createNew");
                  setIsSidebarOpen(false);
                }}
                className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "createNew"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
                title="Create Request"
              >
                <MdAdd className="md:text-xl text-[12px] shrink-0" />

                <span className="font-medium md:text-sm text-[10px]">
                  Create Request
                </span>
              </button>
            )}

            {/* ✅ Requests submenu for Procurement roles */}

            <div>
              <button
                onClick={toggleRequests}
                aria-expanded={requestsExpanded}
                className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  requestsExpanded ||
                  [
                    "pending",
                    "approved",
                    "merged",
                    "incompleteDelivery",
                    "rejected",
                    "queried",
                    "completed",
                    "myRequests",
                    "createNew",
                  ].includes(activeView)
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <div className="relative">
                  <MdPendingActions className="md:text-xl text-[12px] shrink-0" />
                  {collapsed && pendingCount + queriedCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[8px] font-bold px-1 py-0.4 rounded-full shadow">
                      {pendingCount + queriedCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="font-medium md:text-sm text-[10px]">
                    Requests
                  </span>
                )}
                {!collapsed && pendingCount + queriedCount > 0 && (
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {pendingCount + queriedCount}
                  </span>
                )}
                {!collapsed && (
                  <span className="ml-auto">
                    {requestsExpanded ? <MdExpandLess /> : <MdExpandMore />}
                  </span>
                )}
              </button>

              {/* Sub-list */}
              {requestsExpanded && !collapsed && (
                <div className="mt-2 pl-4 space-y-1">
                  {/* For Procurement roles only: Create New & My Requests */}
                  {isProcurement && (
                    <>
                      <button
                        onClick={() => {
                          setActiveView("createNew");
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                          activeView === "createNew"
                            ? "bg-gray-800/80 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                        }`}
                        title="Create Request"
                      >
                        <MdAdd className="md:text-lg text-[12px]" />
                        <span className="font-medium md:text-sm text-[9px]">
                          Create Request
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveView("myRequests");
                          setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                          activeView === "myRequests"
                            ? "bg-gray-800/80 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                        }`}
                        title="My Requests"
                      >
                        <MdDescription className="md:text-lg text-[12px]" />
                        <span className="font-medium md:text-sm text-[9px]">
                          My Requests
                        </span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      setActiveView("pending");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "pending"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Pending Requests"
                  >
                    <MdPendingActions className="md:text-lg text-[12px] shrink-0 " />
                    <span className="font-medium md:text-sm text-[9px]">
                      {isRequester
                        ? "My Requests"
                        : isDeliveryRole
                        ? "Pending Approval"
                        : "Pending Requests"}
                    </span>
                    {pendingCount > 0 && (
                      <span className="ml-auto bg-orange-500/20 text-orange-400 md:text-xs text-[9px] font-bold md:px-1.5 px-1.5 md:py-0.5 py-0.2 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  {/* Approved */}
                  <button
                    onClick={() => {
                      setActiveView("approved");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "approved"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Approved Requests"
                  >
                    <MdVerified className="md:text-lg text-[12px] shrink-0" />
                    <span className="font-medium md:text-sm text-[9px]">
                      {isDeliveryRole
                        ? "Delivered Requests"
                        : "Approved Requests"}
                    </span>
                  </button>

                  {isAccountingLead && (
                    <button
                      onClick={() => {
                        setActiveView("merged");
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        activeView === "merged"
                          ? "bg-gray-800/80 text-white"
                          : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                      }`}
                      title="Merged Requests"
                    >
                      <div className="flex items-center space-x-3">
                        <IoAttach className="md:text-lg text-[12px] shrink-0" />
                        <span className="font-medium md:text-sm text-[9px]">
                          Merged Requests
                        </span>
                      </div>
                    </button>
                  )}

                  {/* Incomplete Delivery */}
                  <button
                    onClick={() => {
                      setActiveView("incompleteDelivery");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "incompleteDelivery"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Incomplete Delivery"
                  >
                    <MdInventory className="md:text-lg text-[12px]" />
                    <span className="font-medium md:text-sm text-[9px]">
                      Incomplete Delivery
                    </span>
                  </button>

                  {/* Rejected Requests */}
                  <button
                    onClick={() => {
                      setActiveView("rejected");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "rejected"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Rejected Requests"
                  >
                    <MdCancel className="md:text-lg text-[12px]" />
                    <span className="font-medium md:text-sm text-[9px]">
                      Rejected Requests
                    </span>
                    {rejectedCount > 0 && (
                      <span className="ml-auto bg-orange-500/20 text-orange-400 md:text-xs text-[9px] font-bold md:px-2 px-1.5 md:py-0.5 py-0.2 rounded-full">
                        {rejectedCount}
                      </span>
                    )}
                  </button>

                  {/* Queried Requests */}
                  <button
                    onClick={() => {
                      setActiveView("queried");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "queried"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Queried Requests"
                  >
                    <div className="flex items-center space-x-3">
                      <MdHelp className="md:text-lg text-[12px]" />
                      <span className="font-medium md:text-sm text-[9px]">
                        Queried Requests
                      </span>
                    </div>
                    {queriedCount > 0 && (
                      <span className="bg-orange-500/20 text-orange-400 md:text-xs text-[9px] font-bold md:px-2 px-1.5 md:py-0.5 py-0.2 rounded-full">
                        {queriedCount}
                      </span>
                    )}
                  </button>

                  {/* Completed */}
                  <button
                    onClick={() => {
                      setActiveView("completed");
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "completed"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Completed Requests"
                  >
                    <MdDoneAll className="md:text-lg text-[12px]" />
                    <span className="font-medium md:text-sm text-[9px]">
                      Completed Requests
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications (newly added) */}
            <button
              onClick={() => {
                setActiveView("notifications");
                setIsSidebarOpen(false);
              }}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "notifications"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              title="Notifications"
            >
              <div className="relative">
                <MdNotificationsActive className="md:text-xl text-[12px] shrink-0" />
                {collapsed && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-white text-[8px] font-bold px-0.5 py-0.4 rounded-full shadow">
                    {notificationCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="font-medium md:text-sm text-[10px]">
                  Notifications
                </span>
              )}
              {!collapsed && notificationCount > 0 && (
                <span className="ml-auto bg-emerald-500 text-white  md:text-xs text-[9px] font-bold md:px-2 px-1.5 md:py-0.5 py-0.2 rounded-full">
                  {notificationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveView("chatRoom");
                setIsSidebarOpen(false);
              }}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "chatRoom"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              title="Chat Room"
            >
              <div className="relative">
                <MdChat className="md:text-xl text-[12px] shrink-0" />
                {collapsed && chatUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow">
                    {chatUnreadCount}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="font-medium md:text-sm text-[10px]">
                  Chat Room
                </span>
              )}
              {!collapsed && chatUnreadCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white md:text-xs text-[9px] font-bold md:px-2 px-1.5 md:py-0.5 py-0.2 rounded-full shadow">
                  {chatUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveView("support");
                setIsSidebarOpen(false);
              }}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "support"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              title="Support"
            >
              <MdOutlineSupportAgent className="md:text-xl text-[12px] shrink-0" />
              {!collapsed && (
                <span className="font-medium md:text-sm text-[10px]">
                  Support
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveView("signature");
                setIsSidebarOpen(false);
              }}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "signature"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              title="Signature Manager"
            >
              <FaFileSignature className="md:text-xl text-[12px] shrink-0" />
              {!collapsed && (
                <span className="font-medium md:text-sm text-[10px]">
                  Signature Manager
                </span>
              )}
            </button>

            {isProcurementManager && (
              <button
                onClick={() => {
                  setActiveView("vendorManagement");
                  setIsSidebarOpen(false);
                }}
                className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "vendorManagement"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
                title="Vendor Management"
              >
                <MdDescription className="md:text-xl text-[12px] shrink-0" />
                {!collapsed && (
                  <span className="font-medium md:text-sm text-[10px]">
                    Vendor Management
                  </span>
                )}
              </button>
            )}

            {isProcurementManager && (
              <button
                onClick={() => {
                  setActiveView("inventoryManagement");
                  setIsSidebarOpen(false);
                }}
                className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "inventoryManagement"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
                title="Inventory Management"
              >
                <MdInventory className="md:text-xl text-[12px] shrink-0" />
                {!collapsed && (
                  <span className="font-medium md:text-sm text-[10px]">
                    Inventory Management
                  </span>
                )}
              </button>
            )}
          </div>
        </nav>

        {/* User Profile & Footer */}
        <div className="p-4 md:p-2 border-t border-gray-800/50 flex flex-col gap-2">
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "space-x-3"
            } p-2 rounded-xl bg-gray-800/30 mb-3`}
          >
            <div className="md:w-10 md:h-10 w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {collapsed
                ? getUserInitials(user?.displayName)
                : getUserInitials(user?.displayName)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 md:hidden lg:block">
                <p className="text-white md:text-sm text-[10px] font-medium truncate">
                  {user?.displayName || "User"}
                </p>
                <p className="text-gray-400 md:text-xs text-[8px] truncate">
                  {user?.department || "Department"}
                </p>
              </div>
            )}
          </div>
          <div
            className={`flex ${
              collapsed
                ? "flex-col items-center gap-2"
                : "flex-row items-center gap-2"
            }`}
          >
            <button
              onClick={handleLogout}
              className={`flex items-center justify-center ${
                collapsed ? "w-10 h-10" : "flex-1 px-4 py-2.5"
              } bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-medium md:text-sm text-[10px]`}
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
              className={`flex items-center justify-center ${
                collapsed ? "w-10 h-10" : "flex-1 px-4 py-2.5"
              } bg-gray-700/30 hover:bg-gray-700/50 text-gray-300 hover:text-white rounded-xl font-medium md:text-sm text-[10px]`}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <LuListCollapse className="text-xl" />
              {!collapsed && <span className="ml-2">Collapse</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
