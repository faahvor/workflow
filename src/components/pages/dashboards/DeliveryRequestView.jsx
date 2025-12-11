// src/components/pages/dashboards/DeliveryRequestView.jsx

import React, { useEffect, useState, useCallback } from "react";
import { MdArrowBack, MdCheckCircle, MdShoppingCart } from "react-icons/md";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import RequestWorkflow from "../../shared/RequestWorkflow";
import AttachedDocuments from "../../shared/AttachedDocuments";
import WaybillUpload from "./WaybillUpload";

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

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const COMMENTS_PER_PAGE = 3;
  const [commentsPage, setCommentsPage] = useState(1);

   function getShipToBlock(req) {
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

  // Normalize comment from server
  const normalizeServerComment = (item) => {
    return {
      id:
        item._id ||
        item.id ||
        item.timestamp ||
        `${Math.random()}-${Date.now()}`,
      author:
        (item.userId && (item.userId.displayName || item.userId.name)) ||
        item.author ||
        "Unknown",
      role:
        (item.userId && (item.userId.role || "").toString().toLowerCase()) ||
        (item.role || "").toString().toLowerCase(),
      text: item.content || item.comment || item.body || item.text || "",
      createdAt: item.timestamp || item.createdAt || new Date().toISOString(),
      raw: item,
    };
  };

  const getCommentAuthorId = (c) => {
    const raw = c && c.raw ? c.raw : c || {};
    const candidate = raw.userId ?? raw.user_id ?? raw.authorId ?? raw.author;
    if (!candidate) return null;
    if (typeof candidate === "object") {
      return candidate._id || candidate.id || candidate.userId || null;
    }
    return candidate;
  };

  const hasCommentByUser = (userIdToCheck) => {
    if (!userIdToCheck) return false;
    const uidStr = String(userIdToCheck).trim();
    return (comments || []).some((c) => {
      const aid = getCommentAuthorId(c);
      return aid && String(aid).trim() === uidStr;
    });
  };

  // Fetch comments
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const reqId = request?.requestId || request?.id;
      if (!reqId) {
        setComments([]);
        return;
      }
      const resp = await axios.get(
        `${API_BASE_URL}/requests/${encodeURIComponent(reqId)}/comments`,
        { headers }
      );
      const data = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
        ? resp.data
        : [];
      const list = (data || []).map(normalizeServerComment);
      setComments(list);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Post comment
  const postComment = async () => {
    const content = (newComment || "").trim();
    if (!content) return;
    setPostingComment(true);

    const temp = {
      id: `temp-${Date.now()}`,
      author: user?.displayName || user?.name || "You",
      role: (user?.role || "").toString().toLowerCase(),
      text: content,
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setComments((c) => [temp, ...c]);
    setNewComment("");

    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const reqId = request?.requestId || request?.id;
      const resp = await axios.post(
        `${API_BASE_URL}/requests/${encodeURIComponent(reqId)}/comments`,
        { content },
        { headers }
      );
      const createdRaw = resp?.data?.data ?? resp?.data ?? null;
      const created = createdRaw ? normalizeServerComment(createdRaw) : null;
      if (created) {
        setComments((prev) => [created, ...prev.filter((p) => !p._temp)]);
      } else {
        setComments((prev) =>
          prev.map((c) => (c.id === temp.id ? { ...c, _temp: false } : c))
        );
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert(err?.response?.data?.message || "Failed to submit comment");
    } finally {
      setPostingComment(false);
    }
  };

  // Handle delivery quantity change
  const handleDeliveryQuantityChange = async (itemId, value) => {
    const numeric = Number(value) || 0;

    // Update local state
    const newItems = editedItems.map((item) =>
      (item.itemId || item._id) === itemId
        ? { ...item, deliveredQuantity: numeric }
        : item
    );
    setEditedItems(newItems);

    // Save to server
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const updatedItem = newItems.find(
        (it) => (it.itemId || it._id) === itemId
      );

      // Use shippingQuantity for shipping/clearing tags, otherwise use quantity
      const qtyVal = showFeeColumns
        ? Number(updatedItem?.shippingQuantity || 0)
        : Number(updatedItem?.quantity || 0);
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
    } catch (err) {
      console.error("Error saving delivered quantity:", err);
      alert(
        err?.response?.data?.message || "Failed to save delivered quantity"
      );
    }
  };

  // Handle approve click with validation
  const handleApproveClick = () => {
    const items = editedItems || [];

    // Check for incomplete delivery
    const incompleteDelivery = items.some((it) => {
      const delivered = Number(it.deliveredQuantity || 0);
      // Use shippingQuantity for shipping/clearing tags, otherwise use quantity
      const qty = showFeeColumns
        ? Number(it.shippingQuantity || 0)
        : Number(it.quantity || 0);
      return qty > 0 && delivered !== qty;
    });

    if (incompleteDelivery) {
      const currentUserId = user?.userId || user?.id || user?._id || null;
      if (!hasCommentByUser(currentUserId)) {
        alert("Please state a reason for approving delivery not completed");
        return;
      }
    }

    onApprove(request.requestId);
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
      fetchComments();
      fetchVendors();
      fetchVessels();
    }
  }, [request?.requestId]);

  // Pagination for comments
  const totalCommentPages = Math.max(
    1,
    Math.ceil((comments?.length || 0) / COMMENTS_PER_PAGE)
  );
  const paginatedComments = (comments || []).slice(
    (commentsPage - 1) * COMMENTS_PER_PAGE,
    commentsPage * COMMENTS_PER_PAGE
  );

  useEffect(() => {
    setCommentsPage(1);
  }, [comments]);

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
      {currentRequest.company?.name || "Hydrodive Nigeria Limited"}
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

        {["delivery base", "delivery jetty", "delivery vessel"].includes(userRole) && !isReadOnly && (
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
                    const delivered = Number(it.deliveredQuantity || 0);
                    // Use shippingQuantity for shipping/clearing, otherwise quantity
                    const totalQty = showFeeColumns
                      ? Number(it.shippingQuantity || 0)
                      : Number(it.quantity || 0);
                    const outstanding = Math.max(0, totalQty - delivered);
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
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          💬 Comments
        </h3>
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg space-y-4">
          {/* Add Comment */}
          {!isReadOnly && (
            <div className="space-y-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... (required if delivery is incomplete)"
                rows={4}
                maxLength={1000}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  {newComment.length}/1000
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNewComment("")}
                    className="px-4 py-2 bg-gray-100 text-slate-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={postComment}
                    disabled={postingComment || !newComment.trim()}
                    className={`px-4 py-2 rounded-md text-sm font-semibold ${
                      postingComment
                        ? "bg-gray-300 text-slate-600 cursor-not-allowed"
                        : "bg-[#036173] text-white hover:bg-[#024f57]"
                    }`}
                  >
                    {postingComment ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="pt-2 border-t border-slate-100">
            {commentsLoading ? (
              <div className="py-6 text-center text-slate-500">
                Loading comments...
              </div>
            ) : comments && comments.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {paginatedComments.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start gap-3 bg-white rounded-lg p-3 border border-slate-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {(c.author || "U")
                          .toString()
                          .split(" ")
                          .map((s) => s[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {c.author || "Unknown"}{" "}
                              {c.role && (
                                <span className="text-xs text-slate-400 ml-2">
                                  • {c.role}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(
                                c.createdAt || Date.now()
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">
                          {c.text}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Pagination controls */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                    disabled={commentsPage === 1}
                    className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalCommentPages }).map((_, i) => {
                    const pageIndex = i + 1;
                    return (
                      <button
                        key={pageIndex}
                        onClick={() => setCommentsPage(pageIndex)}
                        className={`px-3 py-1 rounded-md text-sm ${
                          commentsPage === pageIndex
                            ? "bg-[#036173] text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {pageIndex}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCommentsPage((p) => Math.min(totalCommentPages, p + 1))
                    }
                    disabled={commentsPage === totalCommentPages}
                    className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-slate-500">
                No comments yet. Be the first to comment.
              </div>
            )}
          </div>
        </div>
      </div>

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
                onClick={handleApproveClick}
                disabled={actionLoading}
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
