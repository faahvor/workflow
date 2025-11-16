// src/pages/dashboards/ManagerDashboard.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { hasDoubleApproval } from "../../utils/roles";
import Sidebar from "../../shared/layout/Sidebar";

const ManagerDashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  
  const [activeView, setActiveView] = useState("overview");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  // Fetch pending requests for the current user
  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        console.error("No token found");
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Pending Requests:", response.data);
      setPendingRequests(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching pending requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  // Fetch request flow/details
  const fetchRequestFlow = async (requestId) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_BASE_URL}/requests/${requestId}/flow`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Request Flow:", response.data);
      return response.data;
    } catch (err) {
      console.error("❌ Error fetching request flow:", err);
      return null;
    }
  };

  // Handle Approve
  const handleApprove = async (requestId) => {
    if (!window.confirm("Are you sure you want to approve this request?")) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Request Approved:", response.data);
      alert("Request approved successfully!");
      
      fetchPendingRequests();
      setShowModal(false);
    } catch (err) {
      console.error("❌ Error approving request:", err);
      alert(err.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this request?")) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Request Rejected:", response.data);
      alert("Request rejected successfully!");
      
      fetchPendingRequests();
      setShowModal(false);
    } catch (err) {
      console.error("❌ Error rejecting request:", err);
      alert(err.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Query
  const handleQuery = async (requestId) => {
    if (!window.confirm("Are you sure you want to query this request? It will be sent back to the requester.")) {
      return;
    }

    try {
      setActionLoading(true);
      const token = getToken();

      const response = await axios.post(
        `${API_BASE_URL}/requests/${requestId}/query`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ Request Queried:", response.data);
      alert("Request queried and sent back to requester!");
      
      fetchPendingRequests();
      setShowModal(false);
    } catch (err) {
      console.error("❌ Error querying request:", err);
      alert(err.response?.data?.message || "Failed to query request");
    } finally {
      setActionLoading(false);
    }
  };

  // View request details
  const handleViewDetails = async (request) => {
    const flow = await fetchRequestFlow(request.requestId);
    setSelectedRequest({ ...request, flow });
    setShowModal(true);
  };

  // Load pending requests on mount
  useEffect(() => {
    if (user) {
      fetchPendingRequests();
    }
  }, [user]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: "1s"}} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse" style={{animationDelay: "0.5s"}} />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <Sidebar 
          activeView={activeView}
          setActiveView={setActiveView}
          pendingCount={pendingRequests.length}
          isRequester={false}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2">
                {user?.role} Dashboard
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {user?.displayName} | {user?.department} Department
              </p>
            </div>

            {/* Special Note for Vessel Manager & Fleet Manager */}
            {hasDoubleApproval(user?.role) && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-blue-800 font-semibold text-sm md:text-base">
                  ℹ️ As a {user?.role}, you have two approval stages: First Approval and Second Approval
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm md:text-base">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading requests...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Pending Requests Table */}
                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                  <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                      Pending Requests ({pendingRequests.length})
                    </h2>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-gray-500">No pending requests at the moment</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Request ID
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                              Requester
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              Department
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                              Date
                            </th>
                            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingRequests.map((request) => (
                            <tr key={request.requestId} className="hover:bg-gray-50">
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                                {request.requestId}
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden md:table-cell">
                                {request.requester?.displayName || "N/A"}
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden lg:table-cell">
                                {request.department}
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden sm:table-cell">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm">
                                <button
                                  onClick={() => handleViewDetails(request)}
                                  className="text-blue-600 hover:text-blue-900 font-medium"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal - Keeping your existing modal code */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal content - keeping your existing implementation */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Request Details: {selectedRequest.requestId}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Rest of modal content */}
            <div className="px-6 py-4">
              <p className="text-gray-700">Request details will be displayed here...</p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={actionLoading}
              >
                Close
              </button>
              <button
                onClick={() => handleQuery(selectedRequest.requestId)}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Query"}
              </button>
              <button
                onClick={() => handleReject(selectedRequest.requestId)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={() => handleApprove(selectedRequest.requestId)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;