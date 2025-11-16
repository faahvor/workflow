// src/pages/dashboards/RequesterDashboard.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const RequesterDashboard = () => {
  const { user, getToken, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("myRequests"); // "myRequests" or "createNew"
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Form state for creating new request
  const [formData, setFormData] = useState({
    department: user?.department || "",
    destination: "",
    requestType: "purchaseOrder",
    purpose: "",
    vesselId: "",
    items: [{ name: "", quantity: 1 }],
  });
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

  // Fetch all requests created by this user
  const fetchMyRequests = async () => {
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

      console.log("✅ My Requests:", response.data);
      setMyRequests(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests");

      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch request flow
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Add new item
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1 }],
    }));
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length === 1) {
      alert("At least one item is required");
      return;
    }
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Submit new request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.destination || !formData.purpose) {
      alert("Please fill in all required fields");
      return;
    }

    if (formData.items.some((item) => !item.name || item.quantity < 1)) {
      alert("Please ensure all items have a name and valid quantity");
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();

      const payload = {
        department: formData.department,
        destination: formData.destination,
        requestType: formData.requestType,
        purpose: formData.purpose,
        ...(formData.vesselId && { vesselId: formData.vesselId }),
        items: formData.items,
      };

      console.log("📤 Submitting Request:", payload);

      const response = await axios.post(`${API_BASE_URL}/requests`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ Request Created:", response.data);
      alert("Request created successfully!");

      // Reset form
      setFormData({
        department: user?.department || "",
        destination: "",
        requestType: "purchaseOrder",
        purpose: "",
        vesselId: "",
        items: [{ name: "", quantity: 1 }],
      });

      // Switch to "My Requests" tab
      setActiveTab("myRequests");
      fetchMyRequests();
    } catch (err) {
      console.error("❌ Error creating request:", err);
      alert(err.response?.data?.message || "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  // View request details
  const handleViewDetails = async (request) => {
    const flow = await fetchRequestFlow(request.requestId);
    setSelectedRequest({ ...request, flow });
    setShowModal(true);
  };

  // Load requests on mount
  useEffect(() => {
    if (user && activeTab === "myRequests") {
      fetchMyRequests();
    }
  }, [user, activeTab]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Requester Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              {user?.displayName} | {user?.department} Department
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

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("myRequests")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "myRequests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab("createNew")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "createNew"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Create New Request
            </button>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "myRequests" && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                My Requests ({myRequests.length})
              </h2>
            </div>

            {loading ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-gray-500">No requests found</p>
                <button
                  onClick={() => setActiveTab("createNew")}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Create your first request →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Request ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myRequests.map((request) => (
                      <tr key={request.requestId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.requestId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.requestType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.destination}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
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
        )}

        {activeTab === "createNew" && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Create New Request
            </h2>

            <form onSubmit={handleSubmitRequest} className="space-y-6">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your department is automatically set
                </p>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  placeholder="e.g., Marine, IT, Operations"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Request Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type *
                </label>
                <select
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="purchaseOrder">Purchase Order</option>
                  <option value="quotation">Quotation</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Vessel ID (Optional - for Marine department) */}
              {user?.department === "Marine" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vessel ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="vesselId"
                    value={formData.vesselId}
                    onChange={handleInputChange}
                    placeholder="e.g., V-47"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose *
                </label>
                <textarea
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose of this request"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items *
                </label>
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-3 items-start">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) =>
                          handleItemChange(index, "name", e.target.value)
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", parseInt(e.target.value) || 1)
                        }
                        min="1"
                        className="w-24 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  + Add Item
                </button>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("myRequests")}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

            <div className="px-6 py-4 space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{selectedRequest.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Destination</p>
                  <p className="font-medium">{selectedRequest.destination}</p>
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
                  <h4 className="font-semibold mb-3">Request Progress</h4>
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
                              <span className="text-xs font-semibold text-yellow-600">● In Progress</span>
                            )}
                            {step.status === "future" && (
                              <span className="text-xs font-semibold text-gray-400">○ Upcoming</span>
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

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequesterDashboard;