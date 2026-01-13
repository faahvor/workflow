import React, { useState, useEffect } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdAdd,
  MdHistory,
  MdExpandLess,
  MdExpandMore,
  MdDirectionsBoat,
  MdDescription,
  MdOutlineLocalShipping,
  MdDoneAll,
  MdNotificationsActive,
  MdCancel,
  MdChat,
  MdOutlineSupportAgent,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { IoAttach } from "react-icons/io5";
import { FaFileSignature } from "react-icons/fa";
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

const RequesterSidebar = ({
  activeView,
  setActiveView,
  pendingCount = 0,
  rejectedCount = 0,
  notificationCount = 0,
  isRequester = true,
  selectedRequestOrigin = null,
  chatUnreadCount = 0,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [requestsExpanded, setRequestsExpanded] = useState(true); // default open // default collapsed
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleRequests = () => {
    setRequestsExpanded((prev) => !prev);
  };

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
      <style>{hamburgerStyle}</style>
      <button
        onClick={() => setIsSidebarOpen((v) => !v)}
        className="fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors shadow-lg lg:hidden md:block"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <span className={`copilot-hamburger${isSidebarOpen ? " open" : ""}`}>
          <span className="copilot-hamburger-bar"></span>
          <span className="copilot-hamburger-bar"></span>
          <span className="copilot-hamburger-bar"></span>
        </span>
      </button>
      {/* Sidebar starts here */}
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

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            <button
              onClick={() => setActiveView("overview")}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "overview"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
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

            {/* Requests parent */}
            <div>
              <button
                onClick={toggleRequests}
                aria-expanded={requestsExpanded}
                className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  requestsExpanded
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
                title="Requests"
              >
                <MdPendingActions className="md:text-xl text-[12px] shrink-0" />
                {!collapsed && (

                <span className="font-medium md:text-sm text-[10px]">
                  Requests
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
                  <button
                    onClick={() => setActiveView("createNew")}
                    className={`group w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
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
                    onClick={() => setActiveView("pending")}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "pending" ||
                      (activeView === "detail" &&
                        selectedRequestOrigin === "pending")
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Pending Requests"
                  >
                    <div className="flex items-center space-x-3">
                      <MdPendingActions className="md:text-lg text-[12px]" />
                      <span className="font-medium md:text-sm text-[9px]">
                        Pending Requests
                      </span>
                    </div>
                    {pendingCount > 0 && (
                      <span className="bg-orange-500/20 text-orange-400 md:text-xs text-[9px] font-bold md:px-2 px-1.5 md:py-0.5 py-0.2 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveView("myRequests")}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "myRequests" ||
                      (activeView === "detail" &&
                        selectedRequestOrigin === "myRequests")
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="My Requests"
                  >
                   <div className="flex items-center space-x-3">
  <MdDescription className="md:text-lg text-[12px]" />
  <span className="font-medium md:text-sm text-[9px]">
    My Requests
  </span>
</div>
                  </button>
                  <button
                    onClick={() => setActiveView("rejected")}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "rejected"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Rejected Requests"
                  >
                    <div className="flex items-center space-x-3">
                      <MdCancel className="md:text-lg text-[12px]" />
                      <span className="font-medium md:text-sm text-[9px]">
                        Rejected Requests
                      </span>
                    </div>
                    {rejectedCount > 0 && (
                      <span className="bg-orange-500/20 text-orange-400 md:text-xs text-[9px] font-bold md:px-2 px-1.5 md:py-0.5 py-0.2 rounded-full ">
                        {rejectedCount}
                      </span>
                    )}
                  </button>
                  {(user?.department || "")
                    .toString()
                    .toLowerCase()
                    .includes("freight") && (
                    <button
                      onClick={() => setActiveView("merged")}
                      className={`group w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                        activeView === "merged" ||
                        (activeView === "detail" &&
                          selectedRequestOrigin === "merged")
                          ? "bg-gray-800/80 text-white"
                          : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                      }`}
                      title="Merged Requests"
                    >
                      <div className="flex items-center space-x-3">
                        <IoAttach className="md:text-lg text-[12px]" />
                        <span className="font-medium md:text-sm text-[9px]">
                          Merged Requests
                        </span>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveView("completed")}
                    className={`group w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "completed" ||
                      (activeView === "detail" &&
                        selectedRequestOrigin === "completed")
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                    title="Completed"
                  >
                    <MdDoneAll className="md:text-lg text-[12px]" />
                    <span className="font-medium md:text-sm text-[9px]">
                      Completed
                    </span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveView("notifications")}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "notifications"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
              title="Notifications"
            >
              <div className="relative">
                <MdNotificationsActive className="md:text-xl text-[12px] shrink-0" />
                {collapsed && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[8px] font-bold px-0.5 py-0.4 rounded-full shadow">
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
              title="Support "
            >
              <MdOutlineSupportAgent className="md:text-xl text-[12px] shrink-0" />
              {!collapsed && (

              <span className="font-medium md:text-sm text-[10px]">
                Support
              </span>
              )}
            </button>
            <button
              onClick={() => setActiveView("signature")}
              className={`group w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                activeView === "signature"
                  ? "bg-gray-800/80 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800/50"
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
                <MdCancel className="text-xl" />
              ) : (
                <>
                  <MdCancel className="md:text-xl text-[10px] mr-2" />
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
    </>
  );
};

export default RequesterSidebar;
