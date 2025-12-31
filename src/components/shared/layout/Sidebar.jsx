// src/components/layout/Sidebar.jsx

import React, { useState, useEffect } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
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

const Sidebar = ({
  activeView,
  setActiveView,
  pendingCount = 0,
  queriedCount = 0,
  rejectedCount = 0,
  notificationCount = 0,
  isRequester = false,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requestsExpanded, setRequestsExpanded] = useState(true); // expanded by default
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <>
      {/* Mobile sidebar toggle button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors shadow-lg"
      >
        {isSidebarOpen ? (
          <IoMdClose className="text-2xl" />
        ) : (
          <IoMdMenu className="text-2xl" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#0a0a0a] border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Gemz Software</h1>
              <p className="text-gray-400 text-xs capitalize">
                {user?.role || "User"}
              </p>
            </div>
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "overview"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdDashboard className="text-xl shrink-0" />
              <span className="font-medium text-sm">
                {isRequester ? "Dashboard" : "Overview"}
              </span>
            </button>

            {/* Create New (Requester only) */}
            {isRequester && (
              <button
                onClick={() => {
                  setActiveView("createNew");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "createNew"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdAdd className="text-xl shrink-0" />
                <span className="font-medium text-sm">Create Request</span>
              </button>
            )}

            {/* ✅ Requests submenu for Procurement roles */}

            <div>
              <button
                onClick={toggleRequests}
                aria-expanded={requestsExpanded}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
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
                <MdPendingActions className="text-xl shrink-0" />
                <span className="font-medium text-sm">Requests</span>
                {pendingCount + queriedCount > 0 && (
                  <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {pendingCount + queriedCount}
                  </span>
                )}
                <span className="ml-auto">
                  {requestsExpanded ? <MdExpandLess /> : <MdExpandMore />}
                </span>
              </button>

              {/* Sub-list */}
              {requestsExpanded && (
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
                      >
                        <MdAdd className="text-lg" />
                        <span className="text-sm">Create Request</span>
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
                      >
                        <MdDescription className="text-lg" />
                        <span className="text-sm">My Requests</span>
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
                  >
                    <MdPendingActions className="text-lg " />
                    <span className=" text-sm">
                      {isRequester
                        ? "My Requests"
                        : isDeliveryRole
                        ? "Pending  Approval"
                        : "Pending Requests"}
                    </span>
                    {pendingCount > 0 && (
                      <span className="ml-auto bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-semibold">
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
                  >
                    <MdVerified className="text-lg shrink-0" />
                    <span className="text-sm">
                      {isDeliveryRole ? "Delivered Requests" : "Approved Requests"}
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
                    >
                      <div className="flex items-center space-x-3">
                        <IoAttach className="text-lg shrink-0" />
                        <span className="text-sm">Merged Requests</span>
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
                  >
                    <MdInventory className="text-lg" />
                    <span className="text-sm">Incomplete Delivery</span>
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
>
  <MdCancel className="text-lg" />
  <span className="text-sm">Rejected Requests</span>
  {rejectedCount > 0 && (
    <span className="ml-auto bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs font-semibold">
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
                  >
                    <div className="flex items-center space-x-3">
                      <MdHelp className="text-lg" />
                      <span className="text-sm">Queried Requests</span>
                    </div>
                    {queriedCount > 0 && (
                      <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-lg font-semibold">
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
                  >
                    <MdDoneAll className="text-lg" />
                    <span className="text-sm">Completed</span>
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "notifications"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdNotificationsActive className="text-xl shrink-0" />
              <span className="font-medium text-sm">Notifications</span>
              {notificationCount > 0 && (
                <span className="ml-auto bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                  {notificationCount}
                </span>
              )}
            </button>

              <button
              onClick={() => {
                setActiveView("chatRoom");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "chatRoom"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdChat className="text-xl shrink-0" />
              <span className="font-medium text-sm">Chat Room</span>
            </button>
              <button
              onClick={() => {
                setActiveView("support");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "support"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdOutlineSupportAgent className="text-xl shrink-0" />
              <span className="font-medium text-sm">Support</span>
            </button>
            <button
              onClick={() => {
                setActiveView("signature");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "signature"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <FaFileSignature className="text-xl shrink-0" />
              <span className="font-medium text-sm">Signature Manager</span>
            </button>

            {isProcurementManager && (
              <button
                onClick={() => {
                  setActiveView("vendorManagement");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "vendorManagement"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdDescription className="text-xl shrink-0" />
                <span className="font-medium text-sm">Vendor Management</span>
              </button>
            )}

            {isProcurementManager && (
              <button
                onClick={() => {
                  setActiveView("inventoryManagement");
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeView === "inventoryManagement"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <MdInventory className="text-xl shrink-0" />
                <span className="font-medium text-sm">
                  Inventory Management
                </span>
              </button>
            )}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
              {getUserInitials(user?.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user?.displayName || "User"}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {user?.department || "Department"}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-medium text-sm transition-all duration-200 border border-red-500/20"
          >
            Logout
          </button>
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
