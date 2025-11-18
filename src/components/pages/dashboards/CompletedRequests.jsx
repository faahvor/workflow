// src/components/pages/CompletedRequests.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { MdShoppingCart, MdAttachMoney, MdDescription } from "react-icons/md";
import RequestDetailView from "./RequestDetailView";

const CompletedRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const { user, getToken } = useAuth();

  // Roles that can view all departments
  const canViewAllDepartments = [
    "head of procurement",
    "account manager",
    "managing director",
    "cfo",
    "procurement officer",
    "accounting officer",
    "deliverybase",
    "delivery base",
    "deliveryvessel",
    "delivery vessel",
    "deliveryjetty",
    "delivery jetty",
  ].includes(user?.role?.toLowerCase());

  // All departments for the dropdown
  const departments = [
    { value: "all", label: "All Departments" },
    { value: "Marine", label: "Marine" },
    { value: "Purchase", label: "Purchase" },
    { value: "Accounting", label: "Accounting" },
    { value: "Management", label: "Management" },
    { value: "IT", label: "IT" },
    { value: "Operations", label: "Operations" },
  ];

  useEffect(() => {
    fetchCompletedRequests();
  }, [selectedDepartment]);

  const fetchCompletedRequests = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      let url = "https://hdp-backend-1vcl.onrender.com/api/requests/completed";
      
      // Add department filter if user can view all departments and has selected one
      if (canViewAllDepartments && selectedDepartment !== "all") {
        url += `?department=${selectedDepartment}`;
      } else if (!canViewAllDepartments) {
        // Regular users only see their department
        url += `?department=${user?.department}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequests(response.data.data || []);
    } catch (error) {
      console.error("Error fetching completed requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
  };

  const handleBack = () => {
    setSelectedRequest(null);
    fetchCompletedRequests(); // Refresh the list
  };

 // Show detail view if a request is selected
if (selectedRequest) {
  return (
    <RequestDetailView
      request={selectedRequest}
      onBack={handleBack}
      onApprove={() => {}} // No action for completed
      onReject={() => {}} // No action for completed
      onQuery={() => {}} // No action for completed
      actionLoading={false}
      isReadOnly={true} // ✅ Force read-only mode
    />
  );
}


};

export default CompletedRequests;