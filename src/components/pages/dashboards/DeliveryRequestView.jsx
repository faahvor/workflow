// src/components/pages/dashboards/DeliveryRequestView.jsx

import React, { useEffect, useState, useCallback } from "react";
import {
  MdArrowBack,
  MdCheckCircle,
  MdDirectionsBoat,
  MdShoppingCart,
} from "react-icons/md";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import RequestWorkflow from "../../shared/RequestWorkflow";
import AttachedDocuments from "../../shared/AttachedDocuments";
import WaybillUpload from "./WaybillUpload";
import Select from "react-select";
import CommentThread from "../../shared/CommentThread";
const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

const formatCurrency = (v, currency = "NGN") => {
  const n = Number(v || 0).toFixed(2);
  return `${currency} ${Number(n).toLocaleString()}`;
};

const DeliveryRequestView = ({
  request,
  onBack,
  onApprove,
  actionLoading,
  isReadOnly = false,
}) => {
  const { user, getToken } = useAuth();
  const userRole = (user?.role || "").toString().toLowerCase();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editedItems, setEditedItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [filesRefreshCounter, setFilesRefreshCounter] = useState(0);

  const [nextDeliveryStations, setNextDeliveryStations] = useState([]);
  const [isSavingNextStations, setIsSavingNextStations] = useState(false);
  const [comments, setComments] = useState([]);
  useEffect(() => {
    console.log("Comments updated:", comments);
  }, [comments]);

  const allDeliveryStations = [
    { value: "Delivery Base", label: "Delivery Base" },
    { value: "Delivery Jetty", label: "Delivery Jetty" },
    { value: "Delivery Vessel", label: "Delivery Vessel" },
  ];

  const deliveryStationOptions = allDeliveryStations.filter(
    (opt) => opt.value.toLowerCase() !== userRole
  );

  const hasCommentByUser = (userIdToCheck) => {
    if (!userIdToCheck) return false;
    const uidStr = String(userIdToCheck).trim();

    // Use comments from selectedRequest or request
    const comments =
      (selectedRequest &&
        Array.isArray(selectedRequest.comments) &&
        selectedRequest.comments) ||
      (request && Array.isArray(request.comments) && request.comments) ||
      [];

    return comments.some((c) => {
      // c.userId can be an object or a string
      if (typeof c.userId === "object" && c.userId !== null) {
        // Try both userId and id fields
        return (
          String(c.userId.userId).trim() === uidStr ||
          String(c.userId.id).trim() === uidStr
        );
      }
      // If it's a string, compare directly
      return String(c.userId).trim() === uidStr;
    });
  };

  const handleNextStationsChange = (options) => {
    setNextDeliveryStations(options || []);
  };

  function getShipToBlock(req) {
    // 1. Check pendingDeliveryStations first
    const pendingStations = Array.isArray(req.pendingDeliveryStations)
      ? req.pendingDeliveryStations.filter(Boolean)
      : [];

    // If there are pending stations, try to match the current user's role
    if (pendingStations.length > 0) {
      // Try to match the current role (case-insensitive)
      const match = pendingStations.find(
        (station) => station.toLowerCase() === userRole
      );
      const stationToShow = match || pendingStations[0];
      if (stationToShow) {
        const location = stationToShow.toLowerCase();
        if (location === "delivery jetty") {
          return (
            <>
              <div className="text-base font-semibold text-slate-800">
                Delivery Jetty
              </div>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
                Inside NPA, Kiri Kiri Lighter Terminal
                <br />
                Phase 1, By Sunrise Bustop
                <br />
                Oshodi Apapa Expressway Apapa
                <br />
                Lagos
              </div>
            </>
          );
        }
        if (location === "delivery base") {
          return (
            <>
              <div className="text-base font-semibold text-slate-800">
                Delivery Base
              </div>
              <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
                17, Wharf Road,
                <br />
                Apapa, Lagos
                <br />
                Nigeria.
              </div>
            </>
          );
        }
        if (location === "delivery vessel") {
          return (
            <div className="text-base font-semibold text-slate-800">
              Delivery Vessel
            </div>
          );
        }
        // fallback for unknown station
        return (
          <div className="text-base font-semibold text-slate-800">
            {stationToShow}
          </div>
        );
      }
    }

    // 2. Fallback to original logic if no pending stations
    if (String(req.logisticsType).toLowerCase() !== "local") return null;
    const location = String(req.deliveryLocation || "").toLowerCase();

    if (location === "delivery jetty") {
      return (
        <>
          <div className="text-base font-semibold text-slate-800">
            Delivery Jetty
          </div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
            Inside NPA, Kiri Kiri Lighter Terminal
            <br />
            Phase 1, By Sunrise Bustop
            <br />
            Oshodi Apapa Expressway Apapa
            <br />
            Lagos
          </div>
        </>
      );
    }
    if (location === "delivery base") {
      return (
        <>
          <div className="text-base font-semibold text-slate-800">
            Delivery Base
          </div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
            17, Wharf Road,
            <br />
            Apapa, Lagos
            <br />
            Nigeria.
          </div>
        </>
      );
    }
    if (location === "delivery vessel") {
      return (
        <div className="text-base font-semibold text-slate-800">
          Delivery Vessel
        </div>
      );
    }
    return null;
  }

  const currentRequest = selectedRequest || request;

  // Determine tag type
  const tagLower = String(currentRequest?.tag || "").toLowerCase();
  const isShippingTag = tagLower === "shipping";
  const isClearingTag = tagLower === "clearing";
  const showFeeColumns = isShippingTag || isClearingTag;

  // Fetch request details
  const fetchRequestDetails = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return null;

      const response = await axios.get(
        `${API_BASE_URL}/requests/${request.requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data?.data ?? response.data;
      setSelectedRequest(data);

      // Initialize edited items with current delivered quantities
      if (Array.isArray(data?.items)) {
        setEditedItems(
          data.items.map((item) => ({
            ...item,
            deliveredQuantity: item.deliveredQuantity || 0,
            shippingDeliveredQuantity: item.shippingDeliveredQuantity || 0,
          }))
        );
      }

      return data;
    } catch (error) {
      console.error("Error fetching request:", error);
      throw error;
    }
  }, [request?.requestId, getToken]);

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const response = await axios.get(`${API_BASE_URL}/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendors(response.data.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  // Fetch vessels
  const fetchVessels = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVessels(response.data.data || []);
    } catch (err) {
      console.error("Error fetching vessels:", err);
    }
  };

  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId;
  };

  // Handle delivery quantity change
  const handleDeliveryQuantityChange = async (itemId, value) => {
    const numeric = Number(value) || 0;

    // Update local state
    const newItems = editedItems.map((item) => {
      if ((item.itemId || item._id) === itemId) {
        if (showFeeColumns) {
          return { ...item, shippingDeliveredQuantity: numeric };
        } else {
          return { ...item, deliveredQuantity: numeric };
        }
      }
      return item;
    });
    setEditedItems(newItems);

    // Save to server
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const updatedItem = newItems.find(
        (it) => (it.itemId || it._id) === itemId
      );

      if (showFeeColumns) {
        const qtyVal = Number(updatedItem?.shippingQuantity || 0);
        const outstandingVal = Math.max(0, qtyVal - numeric);

        const payload = {
          shippingDeliveredQuantity: numeric,
          shippingOutstandingQuantity: outstandingVal,
        };

        await axios.patch(
          `${API_BASE_URL}/requests/${encodeURIComponent(
            request.requestId
          )}/items/${encodeURIComponent(itemId)}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        const qtyVal = Number(updatedItem?.quantity || 0);
        const outstandingVal = Math.max(0, qtyVal - numeric);

        const payload = {
          deliveredQuantity: numeric,
          outstandingQuantity: outstandingVal,
        };

        await axios.patch(
          `${API_BASE_URL}/requests/${encodeURIComponent(
            request.requestId
          )}/items/${encodeURIComponent(itemId)}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error("Error saving delivered quantity:", err);
      alert(
        err?.response?.data?.message || "Failed to save delivered quantity"
      );
    }
  };

  // Handle approve click with validation
  const handleApproveClick = async () => {
    const items = editedItems || [];

    // Check for incomplete delivery
    const incompleteDelivery = items.some((it) => {
      const delivered = showFeeColumns
        ? Number(it.shippingDeliveredQuantity || 0)
        : Number(it.deliveredQuantity || 0);
      const qty = showFeeColumns
        ? Number(it.shippingQuantity || 0)
        : Number(it.quantity || 0);
      return qty > 0 && delivered !== qty;
    });

    if (incompleteDelivery) {
      const currentUserId = user?.userId || user?.id || user?._id || null;
      console.log("comments:", comments);
      console.log("currentUserId:", currentUserId);
      if (!hasCommentByUser(currentUserId)) {
        alert("Please state a reason for approving delivery not completed");
        return;
      }
    }

    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const reqId = request.requestId;
      const body =
        nextDeliveryStations && nextDeliveryStations.length > 0
          ? { nextDeliveryStations: nextDeliveryStations.map((o) => o.value) }
          : {};

      await axios.post(`${API_BASE_URL}/requests/${reqId}/approve`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (typeof onApprove === "function") onApprove(reqId);
    } catch (err) {
      alert(
        err?.response?.data?.message || "Failed to approve delivery request"
      );
    }
  };

  // Files changed handler
  const handleFilesChanged = useCallback(async () => {
    try {
      await fetchRequestDetails();
      setFilesRefreshCounter((c) => c + 1);
    } catch (err) {
      console.error("Failed to refresh files after upload:", err);
    }
  }, [fetchRequestDetails]);

  // Initial data load
  useEffect(() => {
    if (request?.requestId) {
      fetchRequestDetails();
      fetchVendors();
      fetchVessels();
    }
  }, [request?.requestId]);

  if (!request) return null;

  // Get vendor display name
  const getVendorDisplayName = (vendorOrName) => {
    if (!vendorOrName) return "";
    if (typeof vendorOrName === "string") return vendorOrName;
    if (typeof vendorOrName === "object") {
      return vendorOrName.name || vendorOrName.vendorName || "";
    }
    return String(vendorOrName);
  };

  const usedItems =
    editedItems.length > 0 ? editedItems : currentRequest?.items || [];
  const firstItem = usedItems[0] || {};
  const vendorNameLine = getVendorDisplayName(
    firstItem.vendor || firstItem.vendorName
  );

  // Calculate grand total
  const grandTotal = usedItems.reduce((s, it) => {
    const qty = Number(it.quantity || 0);
    const total =
      it.total != null ? Number(it.total) : Number(it.unitPrice || 0) * qty;
    return s + (isNaN(total) ? 0 : total);
  }, 0);

  const reqIdStr =
    currentRequest?.purchaseOrderNumber ||
    currentRequest?.requestId ||
    request?.requestId ||
    "N/A";
  const createdAt = currentRequest?.createdAt
    ? new Date(currentRequest.createdAt)
    : new Date();
  const dateStr = createdAt.toLocaleDateString();
  const reference = currentRequest?.reference || "N/A";
  const paymentType = currentRequest?.paymentType || "N/A";

  const hasWaybill =
    Array.isArray(currentRequest?.jobCompletionCertificateFiles) &&
    currentRequest.jobCompletionCertificateFiles.length > 0;

  const allNextStations = [
    ...(nextDeliveryStations || []).map((s) =>
      typeof s === "string" ? s.toLowerCase() : (s.value || "").toLowerCase()
    ),
    ...(currentRequest?.pendingDeliveryStations || []).map((s) =>
      (s || "").toLowerCase()
    ),
  ];

  const shouldShowWaybillUpload =
    ["delivery base", "delivery jetty", "delivery vessel"].includes(userRole) &&
    !isReadOnly &&
    !allNextStations.includes(userRole);
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        <MdArrowBack className="text-xl" />
        Back to Requests
      </button>

      {/* Workflow Progress */}
      {request.flow?.path && (
        <div className="mb-8">
          <RequestWorkflow workflowPath={request.flow.path} />
        </div>
      )}

      {/* Purchase Order Style Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden mb-8">
        <div className="px-4 py-4 border-b bg-gradient-to-r from-white to-slate-50">
          <h2 className="text-2xl font-extrabold">Delivery Confirmation</h2>
        </div>

        <div className="px-6 py-5 border-b">
          <div className="grid gap-2 md:grid-cols-[1fr_250px] grid-cols-1 md:gap-4">
            <div className="flex flex-col items-start gap-4 min-w-0">
              <div className="w-32 h-16 flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Hydrodive Nigeria Ltd logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold leading-tight">
                  Hydrodive Nigeria Ltd
                </div>
                <div className="text-sm text-slate-500 mt-1 leading-relaxed">
                  17, Wharf Road, <br />
                  Apapa, Lagos <br />
                  Nigeria.
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col justify-start items-start">
              <div className="flex justify-center items-center gap-2">
                <div className="font-semibold">PON:</div>
                <div className="text-sm text-slate-500">{reqIdStr}</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Date:</div>
                <div className="text-sm text-slate-500">{dateStr}</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Reference:</div>
                <div className="text-sm text-slate-500">{reference}</div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-1">
                <div className="font-semibold">Timeline:</div>
                <div className="text-sm text-slate-500">{paymentType}</div>
              </div>
              {currentRequest?.vesselId && (
                <div className="flex justify-center items-center gap-2 mt-1">
                  <div className="font-semibold">Vessel:</div>
                  <div className="text-sm text-slate-500">
                    {getVesselName(currentRequest.vesselId)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Issued To / Ship To */}
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2">
              Issued To:
            </div>
            <div className="text-base font-semibold text-slate-800">
              {vendorNameLine || "N/A"}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
            <div className="text-sm font-semibold text-slate-800 mb-2">
              Ship To:
            </div>
            <div>
              {getShipToBlock(currentRequest) ? (
                getShipToBlock(currentRequest)
              ) : (
                <>
                  <div className="text-base font-semibold text-slate-800">
                    {currentRequest.company?.name ||
                      "Hydrodive Nigeria Limited"}
                  </div>
                  {currentRequest.company && currentRequest.company.address ? (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
                      {[
                        currentRequest.company.address.street || "",
                        currentRequest.company.address.city || "",
                        currentRequest.company.address.state || "",
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mt-1">
                      {"17, Wharf Road\nApapa\nLagos\nNigeria"}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {shouldShowWaybillUpload && (
          <WaybillUpload
            requestId={request.requestId}
            apiBase={API_BASE_URL}
            getToken={getToken}
            onFilesChanged={handleFilesChanged}
            isReadOnly={isReadOnly}
            waybillFiles={currentRequest?.jobCompletionCertificateFiles || []}
            items={currentRequest?.items || []}
          />
        )}

        {/* Items Table */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <MdShoppingCart className="text-lg" />
              Delivery Items
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b">
                    <th className="pb-2 px-2">#</th>
                    <th className="pb-2 px-2">Description</th>
                    <th className="pb-2 px-2 text-center">Qty</th>

                    {/* Shipping Qty - only for shipping/clearing */}
                    {showFeeColumns && (
                      <th className="pb-2 px-2 text-center">Shipping Qty</th>
                    )}

                    {/* Delivered Quantity */}
                    <th className="pb-2 px-2 text-center bg-emerald-50">
                      Delivered Qty
                    </th>

                    {/* Outstanding Quantity */}
                    <th className="pb-2 px-2 text-center bg-orange-50">
                      Outstanding Qty
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usedItems.map((it, i) => {
                    const itemId = it.itemId || it._id || `item-${i}`;
                    const delivered = showFeeColumns
                      ? Number(it.shippingDeliveredQuantity || 0)
                      : Number(it.deliveredQuantity || 0);

                    const totalQty = showFeeColumns
                      ? Number(it.shippingQuantity || 0)
                      : Number(it.quantity || 0);

                    const outstanding = showFeeColumns
                      ? Number(
                          it.shippingOutstandingQuantity ??
                            Math.max(0, totalQty - delivered)
                        )
                      : Math.max(0, totalQty - delivered);

                    const isFullyDelivered =
                      delivered === totalQty && totalQty > 0;

                    return (
                      <tr key={itemId} className="py-2">
                        <td className="py-3 px-2 text-slate-700">{i + 1}</td>
                        <td className="py-3 px-2 text-slate-900 max-w-[200px] md:max-w-[300px] break-words whitespace-normal">
                          {it.name || it.description || "N/A"}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-700">
                          {it.quantity || 0}
                        </td>

                        {/* Shipping Qty */}
                        {showFeeColumns && (
                          <td className="py-3 px-2 text-center text-slate-700">
                            {it.shippingQuantity ?? 0}
                          </td>
                        )}

                        {/* Delivered Quantity - Editable */}
                        <td className="py-3 px-2 text-center bg-emerald-50">
                          {!isReadOnly ? (
                            <input
                              type="number"
                              min="0"
                              max={totalQty}
                              value={delivered || ""}
                              onChange={(e) =>
                                handleDeliveryQuantityChange(
                                  itemId,
                                  e.target.value
                                )
                              }
                              className="w-20 px-2 py-1 border-2 border-emerald-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          ) : (
                            <span className="font-semibold text-slate-900">
                              {delivered}
                            </span>
                          )}
                        </td>

                        {/* Outstanding Quantity */}
                        <td className="py-3 px-2 text-center bg-orange-50">
                          <span
                            className={`font-semibold ${
                              outstanding > 0
                                ? "text-orange-600"
                                : "text-emerald-600"
                            }`}
                          >
                            {outstanding}
                          </span>
                          {isFullyDelivered && (
                            <MdCheckCircle className="inline-block ml-1 text-emerald-500" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <CommentThread
        requestId={request.requestId}
        user={user}
        getToken={getToken}
      />

      {!isReadOnly && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdDirectionsBoat className="text-xl" />
            Next Delivery Station(s)
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 max-w-md">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">
                  Next Delivery Station(s)
                </label>
                <Select
                  isMulti
                  options={deliveryStationOptions}
                  value={nextDeliveryStations}
                  onChange={handleNextStationsChange}
                  isClearable
                  placeholder="Select next delivery station(s)..."
                  isDisabled={isSavingNextStations}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "48px",
                      borderRadius: 12,
                      boxShadow: "none",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                  menuPortalTarget={
                    typeof document !== "undefined" ? document.body : null
                  }
                />
                {isSavingNextStations && (
                  <div className="text-xs text-slate-500 mt-2">Saving...</div>
                )}
                {Array.isArray(currentRequest?.pendingDeliveryStations) &&
                  currentRequest.pendingDeliveryStations.length > 0 && (
                    <div className="mt-2 text-xs text-slate-600">
                      <strong>Pending Delivery Stations:</strong>{" "}
                      {currentRequest.pendingDeliveryStations.join(", ")}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attached Documents */}
      <AttachedDocuments
        requestId={request.requestId}
        files={[
          ...(currentRequest?.quotationFiles || []),
          ...(currentRequest?.paymentAdviceFiles || []),
          ...(currentRequest?.requisitionFiles || []),
          ...(currentRequest?.requestFiles || []),
          ...(currentRequest?.purchaseOrderFiles || []),
        ]}
        requestData={currentRequest}
        filesRefreshCounter={filesRefreshCounter}
      />

      {/* Action Footer */}
      {!isReadOnly && (
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-6 md:px-8 py-6 shadow-lg sticky bottom-4 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">
              Confirm delivery quantities and approve
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (!hasWaybill) {
                    alert(
                      "You must upload a waybill before confirming delivery."
                    );
                    return;
                  }
                  handleApproveClick();
                }}
                disabled={actionLoading || !hasWaybill}
                className="w-full sm:w-auto px-6 h-12 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-[#036173] to-emerald-600 text-white hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50"
              >
                <MdCheckCircle className="text-lg" />
                {actionLoading ? "Processing..." : "Confirm Delivery"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryRequestView;
