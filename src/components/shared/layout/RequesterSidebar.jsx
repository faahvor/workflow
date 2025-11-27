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
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { IoAttach } from "react-icons/io5";

const RequesterSidebar = ({
  activeView,
  setActiveView,
  pendingCount = 0,
  isRequester = true,
    selectedRequestOrigin = null,

}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [requestsExpanded, setRequestsExpanded] = useState(false); // default collapsed
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const requestsViews = ["createNew", "pending", "myrequests"];
    // include merged only for users in the Operations department (case-insensitive)
    const dept = (user?.department || "").toString().toLowerCase();
    if (dept.includes("operation")) {
      requestsViews.push("merged");
    }

    if (requestsViews.includes(activeView)) {
      setRequestsExpanded(true);
    } else {
      setRequestsExpanded(false);
    }
  }, [activeView, user]);

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

  return (
    <div
      className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#0a0a0a] border-r border-gray-800/50 flex flex-col`}
    >
      <div className="p-6 border-b border-gray-800/50 flex items-center space-x-3">
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

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          <button
            onClick={() => setActiveView("overview")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeView === "overview"
                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <MdDashboard className="text-xl" />
            <span className="font-medium text-sm">Overview</span>
          </button>

          {/* Requests parent */}
          <div>
            <button
              onClick={toggleRequests}
              aria-expanded={requestsExpanded}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                requestsExpanded
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdPendingActions className="text-xl" />
              <span className="font-medium text-sm">Requests</span>
              <span className="ml-auto">
                {requestsExpanded ? <MdExpandLess /> : <MdExpandMore />}
              </span>
            </button>

            {/* Sub-list */}
            {requestsExpanded && (
              <div className="mt-2 pl-4 space-y-1">
                <button
                  onClick={() => setActiveView("createNew")}
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
                  onClick={() => setActiveView("pending")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    activeView === "pending" || (activeView === "detail" && selectedRequestOrigin === "pending")
                      ? "bg-gray-800/80 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <MdPendingActions className="text-lg" />
                    <span className="text-sm">Pending</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-lg font-semibold">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveView("myrequests")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    activeView === "myrequests" || (activeView === "detail" && selectedRequestOrigin === "myrequests")
                      ? "bg-gray-800/80 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <MdPendingActions className="text-lg" />
                    <span className="text-sm">My Requests</span>
                  </div>
                 
                </button>
             {(user?.department || "").toString().toLowerCase().includes("operation") && (
                  <button
                    onClick={() => setActiveView("merged")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      activeView === "merged"
                        ? "bg-gray-800/80 text-white"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <IoAttach className="text-lg" />
                      <span className="text-sm">Merged</span>
                    </div>
                  </button>
                )}

              

                <button
                  onClick={() => setActiveView("completed")}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                    activeView === "completed"
                      ? "bg-gray-800/80 text-white"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <MdHistory className="text-lg" />
                  <span className="text-sm">Completed</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveView("signature")}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
              activeView === "signature"
                ? "bg-gray-800/80 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <MdDescription className="text-lg" />
            <span className="text-sm">Signature Manager</span>
          </button>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800/50">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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

        <button
          onClick={handleLogout}
          className="w-full px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-xl font-medium text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default RequesterSidebar;
