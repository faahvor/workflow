// src/components/layout/Sidebar.jsx

import React, { useState } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdAdd,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ activeView, setActiveView, pendingCount = 0, isRequester = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
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

            {/* Pending Requests */}
            <button
              onClick={() => {
                setActiveView("pending");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "pending"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdPendingActions className="text-xl shrink-0" />
              <span className="font-medium text-sm">
                {isRequester ? "My Requests" : "Pending Requests"}
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
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "approved"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdCheckCircle className="text-xl shrink-0" />
              <span className="font-medium text-sm">Approved</span>
            </button>
            {/* Completed Requests */}
<button
  onClick={() => {
    setActiveView("completed");
    setIsSidebarOpen(false);
  }}
  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
    activeView === "completed"
      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
  }`}
>
  <MdCheckCircle className="text-xl shrink-0" />
  <span className="font-medium text-sm">Completed</span>
</button>

            {/* History */}
            <button
              onClick={() => {
                setActiveView("history");
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeView === "history"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              <MdHistory className="text-xl shrink-0" />
              <span className="font-medium text-sm">History</span>
            </button>
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