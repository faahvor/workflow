// src/pages/dashboards/RequesterDashboard.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../shared/layout/Sidebar";

const RequesterDashboard = () => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState("overview");
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

      // Switch to "My Requests" view
      setActiveView("pending");
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

  // Load requests when switching to pending view
  useEffect(() => {
    if (user && activeView === "pending") {
      fetchMyRequests();
    }
  }, [user, activeView]);

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
          pendingCount={myRequests.length}
          isRequester={true}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2">
                {activeView === "overview" 
                  ? "Dashboard" 
                  : activeView === "createNew" 
                  ? "Create New Request"
                  : activeView === "pending"
                  ? "My Requests"
                  : activeView === "approved"
                  ? "Approved Requests"
                  : "Request History"}
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {user?.displayName} | {user?.department} Department
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-800 text-sm md:text-base">{error}</p>
              </div>
            )}

            {/* Overview - Welcome Message */}
            {activeView === "overview" && (
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 md:p-8 shadow-lg">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  Welcome, {user?.displayName}! 👋
                </h2>
                <p className="text-gray-600 mb-6">
                  You can create new requests, track your submissions, and view your request history from here.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveView("createNew")}
                    className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 text-left"
                  >
                    <h3 className="text-xl font-bold mb-2">Create New Request</h3>
                    <p className="text-emerald-100 text-sm">Start a new procurement request</p>
                  </button>
                  
                  <button
                    onClick={() => setActiveView("pending")}
                    className="p-6 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-lg transition-all duration-200 text-left"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-2">My Requests</h3>
                    <p className="text-gray-600 text-sm">View all your submitted requests</p>
                  </button>
                </div>
              </div>
            )}

            {/* Create New Request Form */}
            {activeView === "createNew" && (
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 md:p-6 lg:p-8 shadow-lg">
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
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
                        <div key={index} className="flex gap-2 md:gap-3 items-start">
                          <input
                            type="text"
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                            className="flex-1 px-3 md:px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base"
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
                            className="w-20 md:w-24 px-2 md:px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-sm md:text-base"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="px-2 md:px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm md:text-base"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                    >
                      + Add Item
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveView("overview")}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-md hover:shadow-lg disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* My Requests List */}
            {activeView === "pending" && (
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-4 md:px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    My Requests ({myRequests.length})
                  </h2>
                </div>

                {loading ? (
                  <div className="px-6 py-12 text-center">
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading requests...</p>
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-500 mb-4">No requests found</p>
                    <button
                      onClick={() => setActiveView("createNew")}
                      className="text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                      Create your first request →
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Request ID
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                            Type
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                            Destination
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                            Created
                          </th>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {myRequests.map((request) => (
                          <tr key={request.requestId} className="hover:bg-gray-50">
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm font-medium text-gray-900">
                              {request.requestId}
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden md:table-cell">
                              {request.requestType}
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden lg:table-cell">
                              {request.destination}
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {request.status}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden sm:table-cell">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm">
                              <button
                                onClick={() => handleViewDetails(request)}
                                className="text-emerald-600 hover:text-emerald-900 font-medium"
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
            )}

            {/* Approved & History Views - Placeholder */}
            {(activeView === "approved" || activeView === "history") && (
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-12 text-center shadow-lg">
                <p className="text-gray-500 text-lg">
                  {activeView === "approved" ? "Approved requests" : "Request history"} will be displayed here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Details Modal - Same as ManagerDashboard */}
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

            <div className="px-6 py-4">
              <p className="text-gray-700">Request details will be displayed here...</p>
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