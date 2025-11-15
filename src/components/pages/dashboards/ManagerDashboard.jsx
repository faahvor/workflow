// src/pages/dashboards/ManagerDashboard.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { hasDoubleApproval } from "../../utils/roles";

const ManagerDashboard = () => {
  const { user, getToken, logout } = useAuth();
  const navigate = useNavigate();
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const API_BASE_URL = "https://hwfp-backend-s3.onrender.com/api";

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
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/login");
      }
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
      
      // Refresh the pending requests list
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
      
      // Refresh the pending requests list
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
      
      // Refresh the pending requests list
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role} Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              {user?.displayName} | {user?.department}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Special Note for Vessel Manager & Fleet Manager (Double Approval) */}
        {hasDoubleApproval(user?.role) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 font-semibold">
              ℹ️ As a {user?.role}, you have two approval stages: First Approval and Second Approval
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Pending Requests Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Request ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingRequests.map((request) => (
                    <tr key={request.requestId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.requestId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.requester?.displayName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.requestType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
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

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Requester</p>
                  <p className="font-medium">{selectedRequest.requester?.displayName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{selectedRequest.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Request Type</p>
                  <p className="font-medium">{selectedRequest.requestType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium">{selectedRequest.status}</p>
                </div>
                {selectedRequest.vesselId && (
                  <div>
                    <p className="text-sm text-gray-600">Vessel ID</p>
                    <p className="font-medium">{selectedRequest.vesselId}</p>
                  </div>
                )}
                {selectedRequest.purpose && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Purpose</p>
                    <p className="font-medium">{selectedRequest.purpose}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Items</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedRequest.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">{item.name}</td>
                          <td className="px-4 py-2 text-sm">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Workflow Flow */}
              {selectedRequest.flow && (
                <div>
                  <h4 className="font-semibold mb-3">Request Flow</h4>
                  <div className="space-y-3">
                    {selectedRequest.flow.path?.map((step, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded border ${
                          step.status === "completed"
                            ? "bg-green-50 border-green-200"
                            : step.status === "current"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{step.state}</p>
                            {step.user && (
                              <p className="text-xs text-gray-600">
                                {step.action} by {step.user.displayName} ({step.role})
                              </p>
                            )}
                            {step.info && (
                              <p className="text-xs text-gray-500">{step.info}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {step.status === "completed" && (
                              <span className="text-xs font-semibold text-green-600">✓ Completed</span>
                            )}
                            {step.status === "current" && (
                              <span className="text-xs font-semibold text-yellow-600">● Current</span>
                            )}
                            {step.status === "future" && (
                              <span className="text-xs font-semibold text-gray-400">○ Pending</span>
                            )}
                            {step.timestamp && (
                              <p className="text-xs text-gray-500">
                                {new Date(step.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer - Action Buttons */}
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