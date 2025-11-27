// src/components/pages/RequestDetailView.jsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  MdShoppingCart,
  MdAttachMoney,
  MdDescription,
  MdCancel,
  MdHelp,
  MdCheckCircle,
  MdArrowBack,
  MdAttachFile,
  MdDirectionsBoat, // added icon
} from "react-icons/md";
import RequestWorkflow from "../../shared/RequestWorkflow";
import FleetManagerTable from "../../shared/tables/FleetManagerTable";
import { useAuth } from "../../context/AuthContext";
import VesselManagerTable from "../../shared/tables/VesselManagerTable";
import axios from "axios";
import ProcurementTable from "../../shared/tables/ProcurementTable";
import AccountTable from "../../shared/tables/AccountTable";
import ProcurementMTable from "../../shared/tables/ProcurementMTable";
import MDTable from "../../shared/tables/MDTable";
import DeliveryTable from "../../shared/tables/DeliveryTable";
import CompletedTable from "../../shared/tables/CompletedTable";
import RequesterTable from "../../shared/tables/RequesterTable";
import StoreDeliveryTable from "../../shared/tables/StoreDeliverytable";
import Select from "react-select";
import AttachedDocuments from "../../shared/AttachedDocuments";
import OperationsManagerTable from "../../shared/tables/OperationsManagerTable";
import DirectOfOpTable from "../../shared/tables/DirectOfOpTable";
import ShippingTable from "../../shared/tables/ShippingTable";
import { createPortal } from "react-dom";
import PaymentAdviceUpload from "./PaymentAdviceUpload";
import InvoiceUpload from "./InvoiceUpload";
import AttachItems from "./AttachItems";
import AccountLeadTable from "../../shared/tables/AccountLeadtable";
import CFOTable from "../../shared/tables/CFOTable";

const RequestDetailView = ({
  request,
  onBack,
  onApprove,
  onReject,
  onQuery,
  actionLoading,
  isReadOnly = false,
  vendors: vendorsProp = [],
}) => {
  const { user } = useAuth();

  const [vessels, setVessels] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [vendors, setVendors] = useState([]);
  const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";
  const { getToken } = useAuth();
  const [canApproveDelivery, setCanApproveDelivery] = useState(true);
  const [filesRefreshCounter, setFilesRefreshCounter] = useState(0);

  // Attach-from-other-request state + helpers (shipping-only UI will use these)
  const [attachSearchTerm, setAttachSearchTerm] = useState("");
  const [attachSearching, setAttachSearching] = useState(false);
  const [attachSearchResults, setAttachSearchResults] = useState([]);
  const [attachSourceItems, setAttachSourceItems] = useState([]);
  const [attachSelectedItemIds, setAttachSelectedItemIds] = useState([]);
  const [attachSourceMeta, setAttachSourceMeta] = useState(null);
  const [attachDropdownOpen, setAttachDropdownOpen] = useState(false);
  const [attachDropdownResults, setAttachDropdownResults] = useState([]);
  const [attachDropdownLoading, setAttachDropdownLoading] = useState(false);
  const [attachFocusedIndex, setAttachFocusedIndex] = useState(-1);
  const attachInputRef = useRef(null);

  const [accAttachSearchTerm, setAccAttachSearchTerm] = useState("");
  const [accAttachDropdownResults, setAccAttachDropdownResults] = useState([]);
  const [accAttachDropdownLoading, setAccAttachDropdownLoading] =
    useState(false);
  const [accAttachDropdownOpen, setAccAttachDropdownOpen] = useState(false);
  const [accAttachFocusedIndex, setAccAttachFocusedIndex] = useState(-1);
  const [accAttachSourceItems, setAccAttachSourceItems] = useState([]);
  const [accAttachSelectedItemIds, setAccAttachSelectedItemIds] = useState([]);
  const [accAttachSourceMeta, setAccAttachSourceMeta] = useState(null);
  const accAttachInputRef = useRef(null);

  // --- Quotation upload state & refs (REPLACED to support multiple files)
  const fileInputRef = useRef(null);
  const [quotationFiles, setQuotationFiles] = useState([]); // [{ id, file, previewUrl, progress, uploaded }]
  const [isUploading, setIsUploading] = useState(false);
  const userRole = user?.role?.toLowerCase() || "";
  const deliveryOptions = [
    { value: "Delivery Base", label: "Delivery Base" },
    { value: "Delivery Jetty", label: "Delivery Jetty" },
    { value: "Delivery Vessel", label: "Delivery Vessel" },
  ];
  const [deliveryTarget, setDeliveryTarget] = useState(null);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [nextDeliveryTarget, setNextDeliveryTarget] = useState(null);
  const [isSavingNextDelivery, setIsSavingNextDelivery] = useState(false);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryComment, setQueryComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const COMMENTS_PER_PAGE = 3;
  const [commentsPage, setCommentsPage] = useState(1);
  const formatAmount = (v, currency = "NGN") =>
    `${currency} ${Number(Number(v || 0).toFixed(2)).toLocaleString()}`;

  useEffect(() => {
    setCommentsPage(1);
  }, [comments]);

  // derived pagination values (use these when rendering)
  const totalCommentPages = Math.max(
    1,
    Math.ceil((comments?.length || 0) / COMMENTS_PER_PAGE)
  );
  const paginatedComments = (comments || []).slice(
    (commentsPage - 1) * COMMENTS_PER_PAGE,
    commentsPage * COMMENTS_PER_PAGE
  );

  // Add below fetchRequestDetails or inside same helpers section

  const normalizeServerComment = (item) => {
    // server returns { userId: { displayName, role, ...}, content, timestamp }
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
      createdAt:
        item.timestamp ||
        item.createdAt ||
        item.created_at ||
        new Date().toISOString(),
      raw: item,
    };
  };

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
        {
          headers,
        }
      );
      const data = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
        ? resp.data
        : [];
      // normalize each comment
      let list = (data || []).map(normalizeServerComment);
      // If current user is Managing Director, filter out comments authored by Requester role
      const userRoleLower = (user?.role || "").toString().toLowerCase();
      if (
        userRoleLower === "managing director" ||
        userRoleLower === "managingdirector"
      ) {
        list = list.filter((c) => (c.role || "").toLowerCase() !== "requester");
      }
      setComments(list);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      // fallback to empty list (or keep previous comments)
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const postComment = async () => {
    const content = (newComment || "").trim();
    if (!content) return;
    setPostingComment(true);
    // optimistic
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
        // replace temp flag
        setComments((prev) =>
          prev.map((c) => (c.id === temp.id ? { ...c, _temp: false } : c))
        );
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      alert(err?.response?.data?.message || "Failed to submit comment");
      // keep optimistic entry but mark as failed (we keep it)
    } finally {
      setPostingComment(false);
    }
  };

  useEffect(() => {
    if (request?.requestId) {
      fetchComments().catch((err) => {
        console.error("Failed to load comments:", err);
      });
    } else {
      setComments([]); // clear when no request
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.requestId]);

  const openDeleteModal = (item) => {
    setDeleteTargetItem(item || null);
    setDeleteReason("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTargetItem(null);
    setDeleteReason("");
    setIsDeleteModalOpen(false);
  };
  const submitDelete = async () => {
    const reason = (deleteReason || "").trim();
    if (!reason || reason.length < 3) {
      alert(
        "Please provide a brief reason for deleting the item (at least 3 characters)."
      );
      return;
    }
    if (!deleteTargetItem) {
      alert("No item selected for deletion.");
      return;
    }

    try {
      setIsDeleting(true);
      await handleDeleteItem(
        request.requestId,
        deleteTargetItem.itemId,
        reason
      );
      // refresh details and UI
      await fetchRequestDetails();
      alert("Item deleted successfully");
      closeDeleteModal();
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.response?.data?.message || "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  // allowed roles for rejection (includes operations & equipment managers)
  const allowedRejectRoles = [
    "vessel manager",
    "managing director",
    "operations manager",
    "equipment manager",
  ];

  const openRejectModal = () => {
    setRejectComment("");
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRejectComment("");
    setIsRejectModalOpen(false);
  };

  const openQueryModal = () => {
    setQueryComment("");
    setIsQueryModalOpen(true);
  };

  const closeQueryModal = () => {
    setQueryComment("");
    setIsQueryModalOpen(false);
  };

  const submitReject = async () => {
    const trimmed = (rejectComment || "").trim();
    if (!trimmed || trimmed.length < 3) {
      alert(
        "Please provide a brief reason for rejection (at least 3 characters)."
      );
      return;
    }

    try {
      setIsRejecting(true);
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const resp = await axios.post(
        `${API_BASE_URL}/requests/${request.requestId}/reject`,
        { comment: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = resp.data?.request ?? resp.data?.data ?? resp.data;
      if (updated) {
        setSelectedRequest(updated);
      } else {
        // refresh if endpoint returns no request object
        await fetchRequestDetails();
      }

      alert(resp.data?.message || "Request rejected for correction");
      closeRejectModal();
    } catch (err) {
      console.error("Reject error:", err);
      alert(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setIsRejecting(false);
    }
  };

  const submitQuery = async () => {
    const trimmed = (queryComment || "").trim();
    if (!trimmed || trimmed.length < 3) {
      alert(
        "Please provide a brief reason for the query (at least 3 characters)."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to query this request?"
    );
    if (!confirmed) return;

    try {
      setIsQuerying(true);
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const resp = await axios.post(
        `${API_BASE_URL}/requests/${encodeURIComponent(
          request.requestId
        )}/query`,
        { comment: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated =
        resp.data?.request ?? resp.data?.data ?? resp.data ?? null;
      if (updated) {
        setSelectedRequest(updated);
      } else {
        await fetchRequestDetails();
      }

      // Do not call onQuery here — calling the parent handler was causing the extra confirm/alert.
      closeQueryModal();
    } catch (err) {
      console.error("Query error:", err);
      alert(err?.response?.data?.message || "Failed to query request");
    } finally {
      setIsQuerying(false);
    }
  };
  // Sync nextDeliveryTarget from request when details load
  useEffect(() => {
    const saved =
      (selectedRequest && selectedRequest.nextDeliveryTarget) ||
      (request && request.nextDeliveryTarget) ||
      null;

    if (saved) {
      setNextDeliveryTarget({ value: saved, label: saved });
      return;
    }

    const stations =
      (selectedRequest && selectedRequest.nextDeliveryStations) ||
      (request && request.nextDeliveryStations) ||
      [];
    const initial =
      Array.isArray(stations) && stations.length
        ? { value: stations[0], label: stations[0] }
        : null;
    setNextDeliveryTarget(initial);
  }, [selectedRequest, request]);

  useEffect(() => {
    // sync deliveryTarget from request data when details load
    const loc =
      (selectedRequest && selectedRequest.deliveryLocation) ||
      (request && request.deliveryLocation) ||
      null;
    const found = deliveryOptions.find((o) => o.value === loc) || null;
    setDeliveryTarget(found);
  }, [selectedRequest, request]);

  const handleDeliveryChange = async (option) => {
    // update UI immediately
    setDeliveryTarget(option);

    const prev =
      (selectedRequest && selectedRequest.deliveryLocation) ||
      (request && request.deliveryLocation) ||
      null;

    // determine payload value (null if cleared)
    const payloadValue = option ? option.value : null;

    try {
      setIsSavingDelivery(true);
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      await axios.patch(
        `${API_BASE_URL}/requests/${request.requestId}`,
        { deliveryLocation: payloadValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // update local request copy
      setSelectedRequest((prevReq) => ({
        ...(prevReq || {}),
        deliveryLocation: payloadValue,
      }));
    } catch (err) {
      console.error("Error saving delivery location:", err);
      alert(err?.response?.data?.message || "Failed to save delivery location");
      // revert selection on error
      const prevOption = deliveryOptions.find((o) => o.value === prev) || null;
      setDeliveryTarget(prevOption);
    } finally {
      setIsSavingDelivery(false);
    }
  };

  // helper to extract next-delivery stations from various response shapes
  const extractNextStations = (r) => {
    if (!r) return [];
    if (Array.isArray(r.nextDeliveryStations) && r.nextDeliveryStations.length)
      return r.nextDeliveryStations;
    if (
      Array.isArray(r.nextDeliveryStations) &&
      r.nextDeliveryStations.length === 0
    )
      return [];
    // some backends may put it under flow or pending fields
    if (
      r.flow &&
      Array.isArray(r.flow.nextDeliveryStations) &&
      r.flow.nextDeliveryStations.length
    )
      return r.flow.nextDeliveryStations;
    if (
      Array.isArray(r.pendingDeliveryStations) &&
      r.pendingDeliveryStations.length
    )
      return r.pendingDeliveryStations;
    if (Array.isArray(r.next_stations) && r.next_stations.length)
      return r.next_stations;
    return [];
  };

  // Sync nextDeliveryTarget from request when details load
  useEffect(() => {
    // Prefer an explicit saved selection (nextDeliveryTarget) if present,
    // otherwise fall back to the first entry from nextDeliveryStations (if any).
    const saved =
      (selectedRequest &&
        (selectedRequest.nextDeliveryTarget ||
          selectedRequest.next_delivery_target)) ||
      (request &&
        (request.nextDeliveryTarget || request.next_delivery_target)) ||
      null;

    if (saved) {
      setNextDeliveryTarget({ value: saved, label: saved });
      return;
    }

    const stations =
      extractNextStations(selectedRequest) ||
      extractNextStations(request) ||
      [];
    const initial =
      Array.isArray(stations) && stations.length
        ? { value: stations[0], label: stations[0] }
        : null;
    setNextDeliveryTarget(initial);
  }, [selectedRequest, request]);

  const handleNextDeliveryChange = async (option) => {
    // update UI immediately
    setNextDeliveryTarget(option);

    const payloadStations = option && option.value ? [option.value] : [];

    try {
      setIsSavingNextDelivery(true);
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      // Use the approve endpoint per API docs to forward to next station(s)
      await axios.post(
        `${API_BASE_URL}/requests/${request.requestId}/approve`,
        { nextDeliveryStations: payloadStations },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh request details so UI shows saved selection and any workflow changes
      const updated = await fetchRequestDetails();

      // debug: log returned payload so we can inspect server shape if needed
      console.debug(
        "handleNextDeliveryChange: updated request after approve:",
        {
          nextDeliveryTarget: updated?.nextDeliveryTarget,
          nextDeliveryStations: updated?.nextDeliveryStations,
          flowNext: updated?.flow?.nextDeliveryStations,
          pendingDeliveryStations: updated?.pendingDeliveryStations,
        }
      );

      // determine saved value from multiple possible places
      const stationsFromServer = extractNextStations(updated);
      const savedValue =
        updated?.nextDeliveryTarget ||
        (Array.isArray(stationsFromServer) && stationsFromServer[0]) ||
        payloadStations[0] ||
        null;

      setNextDeliveryTarget(
        savedValue ? { value: savedValue, label: savedValue } : null
      );
      setSelectedRequest(updated);
    } catch (err) {
      console.error("Error saving next delivery target via approve:", err);
      alert(
        err?.response?.data?.message ||
          "Failed to forward to next delivery station"
      );
      // revert to previous saved value if available
      const prevOption =
        (selectedRequest &&
          (selectedRequest.nextDeliveryTarget ||
            selectedRequest.next_delivery_target) && {
            value:
              selectedRequest.nextDeliveryTarget ||
              selectedRequest.next_delivery_target,
            label:
              selectedRequest.nextDeliveryTarget ||
              selectedRequest.next_delivery_target,
          }) ||
        (request &&
          (request.nextDeliveryTarget || request.next_delivery_target) && {
            value: request.nextDeliveryTarget || request.next_delivery_target,
            label: request.nextDeliveryTarget || request.next_delivery_target,
          }) ||
        null;
      setNextDeliveryTarget(prevOption);
    } finally {
      setIsSavingNextDelivery(false);
    }
  };

  const canUploadQuotation =
    userRole === "procurement" || userRole === "procurement officer";

  if (!request) return null;

  const handleDeliveryStatusChange = (allFullyDelivered) => {
    setCanApproveDelivery(allFullyDelivered);
  };

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const token = getToken(); // ✅ USE THIS INSTEAD
        if (!token) {
          console.error("❌ No token available");
          return;
        }
        const response = await axios.get(
          "https://hdp-backend-1vcl.onrender.com/api/vendors",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setVendors(response.data.data || []);
      } catch (error) {
        console.error("❌ Error fetching vendors:", error);
      }
    };
    fetchVendors();
  }, []); // ✅ Add getToken to dependencies if needed

  const fetchRequestDetails = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.error("❌ No token available");
        return null;
      }
      const response = await axios.get(
        `${API_BASE_URL}/requests/${request.requestId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // API may return the object at response.data.data or response.data
      const data = response.data?.data ?? response.data;

      if (Array.isArray(data?.items)) {
        let vendorList = vendors || [];

        // If vendors not loaded yet, fetch them so we can restore vendor objects
        if (!vendorList || vendorList.length === 0) {
          try {
            const tkn = getToken();
            if (tkn) {
              const vResp = await axios.get(`${API_BASE_URL}/vendors`, {
                headers: { Authorization: `Bearer ${tkn}` },
              });
              vendorList = vResp.data?.data ?? vResp.data ?? [];
              // cache locally for later use
              setVendors(vendorList);
            }
          } catch (vErr) {
            console.warn("Failed to fetch vendors for normalization:", vErr);
          }
        }

        if ((vendorList || []).length > 0) {
          const byId = new Map();
          (vendorList || []).forEach((v) => {
            const id = v.vendorId ?? v._id ?? v.id;
            if (id) byId.set(String(id), v);
          });

          data.items = data.items.map((it) => {
            // if vendor object missing but vendorId present, populate vendor from vendors list
            if ((!it.vendor || it.vendor === null) && it.vendorId) {
              const found = byId.get(String(it.vendorId));
              if (found) {
                return { ...it, vendor: found };
              }
            }
            return it;
          });
        }
      }

      // If server returned items but vendor objects are missing, restore from vendors list using vendorId
      if (Array.isArray(data?.items) && (vendors || []).length > 0) {
        const byId = new Map();
        (vendors || []).forEach((v) => {
          const id = v.vendorId ?? v._id ?? v.id;
          if (id) byId.set(String(id), v);
        });

        data.items = data.items.map((it) => {
          // if vendor object missing but vendorId present, try to populate vendor from vendors list
          if ((!it.vendor || it.vendor === null) && it.vendorId) {
            const found = byId.get(String(it.vendorId));
            if (found) {
              // restore vendor object (keeps all vendor fields available to UI)
              return { ...it, vendor: found };
            }
          }
          return it;
        });
      }

      // debug: log file arrays so AttachedDocuments can pick them up
      console.log("fetchRequestDetails: request payload keys:", {
        requestId: data?.requestId,
        requisitionFiles: data?.requisitionFiles,
        requestFiles: data?.requestFiles,
        quotationFiles: data?.quotationFiles,
        purchaseOrderFiles: data?.purchaseOrderFiles,
      });

      setSelectedRequest(data);
      try {
        const itemsForCheck = data?.items || [];
        const isDeliveryRole = (userRole || "")
          .toString()
          .toLowerCase()
          .includes("delivery");

        // NEW: determine if this request is the special pettyCash requester-delivery-confirmation state
        const reqTypeLower = (data?.requestType || request?.requestType || "")
          .toString()
          .toLowerCase();
        const currentStateStr =
          data?.flow?.currentState ||
          request?.flow?.currentState ||
          data?.status ||
          request?.status ||
          "" ||
          "";
        const isPettySpecial =
          reqTypeLower === "pettycash" &&
          currentStateStr === "PENDING_REQUESTER_DELIVERY_CONFIRMATION";

        // treat a row as eligible if it's inStock OR we're in the special pettyCash confirmation state
        const rowEligible = (it) => !!it.inStock || isPettySpecial;

        // enforce delivered === qty for eligible rows
        const allFullyDelivered = (itemsForCheck || []).every((it) => {
          if (!rowEligible(it)) return true; // ignore non-eligible rows
          const deliveredVal = Number(it.deliveredQuantity || 0);
          const qty = Number(it.quantity || 0);
          return qty === 0 ? true : deliveredVal === qty;
        });
        setCanApproveDelivery(allFullyDelivered);
      } catch (err) {
        console.warn("Could not compute canApproveDelivery:", err);
        setCanApproveDelivery(true);
      }
      return data; // return for callers
    } catch (error) {
      console.error("Error fetching request:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (request?.requestId) {
      fetchRequestDetails().catch((err) => {
        console.error("Failed to load request details on mount:", err);
      });
    }
  }, [request?.requestId]);

  const handleFilesChanged = useCallback(async () => {
    try {
      // re-fetch latest request details (silent)
      await fetchRequestDetails();
      // bump counter so AttachedDocuments can show a local spinner and react
      setFilesRefreshCounter((c) => c + 1);
    } catch (err) {
      console.error("Failed to refresh files after upload:", err);
    }
  }, [fetchRequestDetails]);

  const uploadEntryImmediate = async (entry) => {
    if (!entry) return;
    const id = entry.id;
    try {
      setIsUploading(true);

      // ensure entry exists in state so progress UI updates
      setQuotationFiles((prev) => {
        if (prev.find((p) => p.id === id)) return prev;
        return [...prev, entry];
      });

      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 0, uploaded: false } : p
        )
      );

      const token = getToken();
      const formData = new FormData();
      formData.append("files", entry.file);

      const resp = await axios.post(
        `${API_BASE_URL}/requests/${request.requestId}/quotations`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setQuotationFiles((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))
            );
          },
        }
      );

      // mark uploaded
      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 100, uploaded: true } : p
        )
      );

      // refresh request details so AttachedDocuments sees the new file
      if (typeof fetchRequestDetails === "function")
        await fetchRequestDetails();
      if (typeof handleFilesChanged === "function") handleFilesChanged();

      // remove the temporary entry after successful upload (keeps UI clean)
      setQuotationFiles((prev) => {
        const toRemove = prev.find((p) => p.id === id);
        if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
    } catch (err) {
      console.error("Error uploading quotation (immediate):", err);
      alert(err?.response?.data?.message || "Upload failed");
      // keep entry in list for retry and mark uploaded=false
      setQuotationFiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, uploaded: false } : p))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const fetchVessels = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/vessels?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVessels(response.data.data || []);
    } catch (err) {
      console.error("❌ Error fetching vessels:", err);
    }
  };

  const getVesselName = (vesselId) => {
    const vessel = vessels.find((v) => v.vesselId === vesselId);
    return vessel?.name || vesselId; // Fallback to vesselId if name not found
  };

  // Fetch vessels on mount
  useEffect(() => {
    fetchVessels();
  }, []);

  // attached files function

  const performAttachSearch = async () => {
    const q = (attachSearchTerm || "").trim();
    if (!q) return;
    setAttachSearching(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const resp = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = resp.data?.data || [];
      const lowered = q.toLowerCase();
      const results = all.filter((r) => {
        const vendor = (r.vendor || r.requester?.displayName || "")
          .toString()
          .toLowerCase();
        const po = (r.purchaseOrderNumber || r.reference || r.requestId || "")
          .toString()
          .toLowerCase();
        return vendor.includes(lowered) || po.includes(lowered);
      });
      setAttachSearchResults(results);
    } catch (err) {
      console.error("Attach search error:", err);
      setAttachSearchResults([]);
    } finally {
      setAttachSearching(false);
    }
  };

  // NEW: fetch default dropdown results (pending shipping requests) and optional term filter
  const fetchAttachDropdownResults = async (term = "") => {
    setAttachDropdownLoading(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const resp = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = resp.data?.data || resp.data || [];

      // keep only requests with tag === "shipping" (backend may vary: tag or tags)
      const shipping = all.filter((r) => {
        if (!r) return false;
        if (Array.isArray(r.tags) && r.tags.length) {
          return r.tags
            .map((t) => String(t).toLowerCase())
            .includes("shipping");
        }
        const t = (r.tag || "").toString().toLowerCase();
        return t.includes("shipping");
      });

      // EXCLUDE the currently opened request from the dropdown
      const currentOpenId = request?.requestId || request?.id || null;
      const shippingFiltered = shipping.filter(
        (r) => (r.requestId || r.id) !== currentOpenId
      );

      // optional client-side term filtering (vendor name or PO)
      const q = (term || "").toString().trim().toLowerCase();
      const matched = q
        ? shippingFiltered.filter((r) => {
            const vendor = (r.vendor || r.requester?.displayName || "")
              .toString()
              .toLowerCase();
            const po = (
              r.purchaseOrderNumber ||
              r.reference ||
              r.requestId ||
              ""
            )
              .toString()
              .toLowerCase();
            return vendor.includes(q) || po.includes(q);
          })
        : shippingFiltered;

      // newest-first, limit to 10
      const sorted = matched
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10);

      setAttachDropdownResults(sorted);
      setAttachDropdownOpen(true);
    } catch (err) {
      console.error("Attach dropdown fetch error:", err);
      setAttachDropdownResults([]);
      setAttachDropdownOpen(false);
    } finally {
      setAttachDropdownLoading(false);
    }
  };
  const fetchAccAttachDropdownResults = async (term = "") => {
    setAccAttachDropdownLoading(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const resp = await axios.get(`${API_BASE_URL}/requests/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const all = resp.data?.data || resp.data || [];

      // exclude any request that is shipping (supports tag or tags)
      const nonShipping = all.filter((r) => {
        if (!r) return false;
        if (Array.isArray(r.tags) && r.tags.length) {
          return !r.tags
            .map((t) => String(t).toLowerCase())
            .includes("shipping");
        }
        const tag = (r.tag || "").toString().toLowerCase();
        return !tag.includes("shipping");
      });

      // exclude the currently opened request
      const currentOpenId = request?.requestId || request?.id || null;
      const filtered = nonShipping.filter(
        (r) => (r.requestId || r.id) !== currentOpenId
      );

      // optional client-side search (vendor or PON)
      const q = (term || "").toString().trim().toLowerCase();
      const matched = q
        ? filtered.filter((r) => {
            const vendor = (r.vendor || r.requester?.displayName || "")
              .toString()
              .toLowerCase();
            const po = (
              r.purchaseOrderNumber ||
              r.reference ||
              r.requestId ||
              ""
            )
              .toString()
              .toLowerCase();
            return vendor.includes(q) || po.includes(q);
          })
        : filtered;

      const sorted = matched
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10);

      setAccAttachDropdownResults(sorted);
      setAccAttachDropdownOpen(true);
    } catch (err) {
      console.error("Accounting attach dropdown fetch error:", err);
      setAccAttachDropdownResults([]);
      setAccAttachDropdownOpen(false);
    } finally {
      setAccAttachDropdownLoading(false);
    }
  };

  const loadSourceRequestItems = async (sourceRequestId) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const resp = await axios.get(
        `${API_BASE_URL}/requests/${sourceRequestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const src = resp.data?.data ?? resp.data ?? {};
      // Use only src.items for all cases
      const items = src.items || [];
      setAttachSourceItems(items);
      setAttachSelectedItemIds(
        items.map((it) => it.itemId || it._id).filter(Boolean)
      );
      setAttachSourceMeta({
        requestId: src.requestId || sourceRequestId,
        vendor: src.vendor || src.requester?.displayName || "",
      });
    } catch (err) {
      console.error("Error loading source request items:", err);
      alert(err?.response?.data?.message || "Failed to load request items");
    }
  };
  const loadAccSourceRequestItems = async (sourceRequestId) => {
    if (!sourceRequestId) return null;
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const resp = await axios.get(
        `${API_BASE_URL}/requests/${encodeURIComponent(sourceRequestId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const src = resp.data?.data ?? resp.data ?? {};
      const items = Array.isArray(src.items) ? src.items : [];
      setAccAttachSourceItems(items);
      setAccAttachSelectedItemIds(
        items.map((it) => it.itemId || it._id || it.id).filter(Boolean)
      );
      setAccAttachSourceMeta({
        requestId: src.requestId || sourceRequestId,
        vendor: src.vendor || src.requester?.displayName || "",
      });
      return { src, items };
    } catch (err) {
      console.error("Error loading accounting source request items:", err);
      alert(
        err?.response?.data?.message || "Failed to load source request items"
      );
      return null;
    }
  };

  const attachAccSelectedToTarget = async (
    targetRequestId,
    purpose = "",
    sourceRequestId = null,
    skipConfirm = false
  ) => {
    if (!targetRequestId) return null;
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const sourceId = sourceRequestId || accAttachSourceMeta?.requestId;
      const itemIds =
        accAttachSelectedItemIds && accAttachSelectedItemIds.length
          ? accAttachSelectedItemIds
          : [];
      if (!skipConfirm) {
        if (!window.confirm("Attach selected items to this request?"))
          return null;
      }
      const payload = {
        sourceRequestId: sourceId,
        itemIds, // if empty server moves all active items
        purpose,
      };
      const resp = await axios.post(
        `${API_BASE_URL}/requests/${encodeURIComponent(
          targetRequestId
        )}/attach`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.debug("attachAccSelectedToTarget response:", resp?.data);
      alert(resp.data?.message || "Request attached successfully");
      // refresh current request details so AccountLeadTable updates
      await fetchRequestDetails();
      // clear accounting attach state
      setAccAttachSourceItems([]);
      setAccAttachSelectedItemIds([]);
      setAccAttachSourceMeta(null);
      setAccAttachSearchTerm("");
      setAccAttachDropdownResults([]);
      setAccAttachDropdownOpen(false);
      return resp.data;
    } catch (err) {
      console.error("Accounting attach error:", err);
      alert(err?.response?.data?.message || "Failed to attach items");
      return null;
    }
  };

  const toggleAttachSelect = (itemId) => {
    setAttachSelectedItemIds((prev) => {
      if (prev.includes(itemId)) return prev.filter((id) => id !== itemId);
      return [...prev, itemId];
    });
  };

  const selectAllAttachItems = () => {
    setAttachSelectedItemIds(
      attachSourceItems.map((it) => it.itemId || it._id).filter(Boolean)
    );
  };

  const clearAttachSelection = () => {
    setAttachSourceItems([]);
    setAttachSelectedItemIds([]);
    setAttachSourceMeta(null);
    setAttachSearchResults([]);
    setAttachSearchTerm("");
  };

  const attachSelectedToTarget = async (targetRequestId, purpose = "") => {
    if (!targetRequestId) return;
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");
      const payload = {
        sourceRequestId: attachSourceMeta?.requestId || null,
        itemIds: attachSelectedItemIds || [],
        purpose,
      };
      const resp = await axios.post(
        `${API_BASE_URL}/requests/${targetRequestId}/attach`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(resp.data?.message || "Request attached successfully");
      // refresh current request details so UI updates
      await fetchRequestDetails();
      clearAttachSelection();
    } catch (err) {
      console.error("Attach error:", err);
      alert(err?.response?.data?.message || "Failed to attach items");
    }
  };

  const currentRequest = selectedRequest || request;

  const renderItemsTable = () => {
    const userRole = user?.role?.toLowerCase();

    // determine if this request is a shipping request (tag === "shipping")
    const isShippingTag = String(currentRequest?.tag || "")
      .toLowerCase()
      .includes("shipping");

    const itemsSource = currentRequest?.items || [];

    // normalize fields so downstream tables can render consistently
    const items = (itemsSource || []).map((it, idx) => {
      // prefer vendor.name when vendor is an object, keep vendorId separately
      const vendorObj =
        it && typeof it.vendor === "object" && it.vendor !== null
          ? it.vendor
          : null;
      const vendorName =
        vendorObj?.name ||
        vendorObj?.vendorName ||
        it.vendor ||
        it.vendorName ||
        it.supplier ||
        "";

      return {
        itemId: it.itemId || it._id || it.id || `gen-${idx}`,
        name: it.name || it.description || it.title || "N/A",
        itemType: it.itemType || it.makersType || it.type || "",
        maker: it.maker || it.manufacturer || "",
        makersPartNo:
          it.makersPartNo || it.makerPartNumber || it.partNumber || "",
        // vendor is now a simple name string for downstream tables
        vendor: vendorName,
        // preserve vendorId separately so saves/patches can send it
        vendorId:
          vendorObj?.vendorId ??
          it.vendorId ??
          it.vendor?._id ??
          it.vendor?.id ??
          null,
        quantity: it.quantity || it.qty || it.requestedQuantity || 0,
        unitPrice: it.unitPrice || it.unit_price || it.price || null,
        total:
          it.total ||
          (it.unitPrice && it.quantity
            ? Number(it.unitPrice) * Number(it.quantity)
            : null),
        purchaseRequisitionNumber:
          it.purchaseRequisitionNumber ??
          it.purchaseReqNumber ??
          it.prn ??
          it.prNumber ??
          "",
        purchaseOrderNumber:
          it.purchaseOrderNumber ?? it.PON ?? it.pon ?? it.purchaseOrder ?? "",

        currency: it.currency || "NGN",
        paymentStatus: it.paymentStatus || it.payment_status || "notpaid",
        percentagePaid: it.percentagePaid ?? it.percentage_paid ?? 0,
        paid: it.paid ?? it.paidAmount ?? 0,
        balance: it.balance ?? it.balanceAmount ?? 0,
        deliveredQuantity:
          it.deliveredQuantity ??
          it.deliverybaseDeliveredQuantity ??
          it.deliveryjettyDeliveredQuantity ??
          it.deliveryvesselDeliveredQuantity ??
          0,
        outstandingQuantity:
          (it.quantity || 0) -
          (it.deliveredQuantity ??
            it.deliverybaseDeliveredQuantity ??
            it.deliveryjettyDeliveredQuantity ??
            it.deliveryvesselDeliveredQuantity ??
            0),
        logisticsType: it.logisticsType ?? it.__raw?.logisticsType ?? "local",
        shippingFee: it.shippingFee ?? it.__raw?.shippingFee ?? 0,
        shippingQuantity:
          it.shippingQuantity ?? it.__raw?.shippingQuantity ?? 0,
        inStock: it.inStock ?? false,
        inStockQuantity: it.inStockQuantity ?? it.storeQuantity ?? 0,
        storeLocation: it.storeLocation ?? it.inStockLocation ?? "",
        __raw: it,
      };
    });

    // When viewing approved/completed set tables to read-only (also consider actionLoading)
    const tableReadOnly = isReadOnly || actionLoading;

    if (isReadOnly) {
      return <CompletedTable items={items} userRole={userRole} />;
    }

    // Role-based table selection
    switch (userRole) {
      case "vesselmanager":
      case "vessel manager":
      case "vmanager":
        return (
          <VesselManagerTable
            items={items}
            onEditItem={handleEditItem}
            requestId={request.requestId}
            isReadOnly={tableReadOnly}
            onDeleteItem={openDeleteModal}
            currentState={request.flow?.currentState}
            vendors={vendors}
            requestType={
              selectedRequest?.requestType || request?.requestType || ""
            }
          />
        );

      case "fleetmanager":
      case "fleet manager":
        return (
          <FleetManagerTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            vendors={vendors}
            requestType={
              selectedRequest?.requestType || request?.requestType || ""
            }
          />
        );

      case "managingdirector":
      case "managing director":
        return (
          <MDTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            vendors={vendors}
          />
        );

      case "procurementmanager":
      case "procurement manager":
        return (
          <ProcurementMTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            vendors={vendors}
          />
        );
      case "storebase":
      case "store base":
        return (
          <StoreDeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );
      case "storejetty":
      case "store jetty":
        return (
          <StoreDeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );
      case "storevessel":
      case "store vessel":
        return (
          <StoreDeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );

      case "accountingofficer":
      case "accounting officer":
        return (
          <AccountTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            showPaymentStatus={true}
            allowPaymentEditing={true}
            vendors={vendors}
            onRefreshRequest={fetchRequestDetails}
            requestType={
              selectedRequest?.requestType || request?.requestType || ""
            }
            currentState={
              selectedRequest?.flow?.currentState ||
              request?.flow?.currentState ||
              ""
            }
          />
        );
      case "accountinglead":
      case "accounting lead":
        return (
          <AccountLeadTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            showPaymentStatus={true}
            allowPaymentEditing={true}
            vendors={vendors}
            onRefreshRequest={fetchRequestDetails}
          />
        );
      case "cfo":
      case "CFO":
        return (
          <CFOTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            showPaymentStatus={true}
            allowPaymentEditing={true}
            vendors={vendors}
            onRefreshRequest={fetchRequestDetails}
          />
        );

      case "operationsmanager":
      case "operations manager":
        return (
          <OperationsManagerTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
          />
        );
      case "directorofoperations":
      case "director of operations":
        return (
          <DirectOfOpTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            tag={currentRequest?.tag}
          />
        );

      case "deliverybase":
      case "delivery base":
      case "deliveryjetty":
      case "delivery jetty":
      case "deliveryvessel":
      case "delivery vessel":
        return (
          <DeliveryTable
            items={items}
            onEditItem={handleEditItem}
            isReadOnly={tableReadOnly}
            userRole="deliverybase"
            requestId={request.requestId}
            onDeliveryQuantityChange={handleDeliveryQuantityChange}
            onDeliveryStatusChange={handleDeliveryStatusChange}
          />
        );
      case "requester":
      case "Requester":
        if (isShippingTag) {
          return (
            <ShippingTable
              items={items}
              userRole={userRole}
              isReadOnly={tableReadOnly}
              vendors={vendors}
              selectedRequest={currentRequest}
              onEditItem={handleEditItem}
              handleCreateVendor={handleCreateVendor}
              handleVendorChange={handleVendorChange}
              onFilesChanged={handleFilesChanged}
            />
          );
        }
        return (
          <RequesterTable
            items={items}
            userRole={userRole}
            isReadOnly={tableReadOnly}
            onDeliveryQuantityChange={handleDeliveryQuantityChange}
            requestId={request.requestId}
            requestType={selectedRequest?.requestType || request?.requestType}
            onEditItem={handleEditItem}
            requestStatus={
              selectedRequest?.flow?.currentState ||
              request?.flow?.currentState ||
              request?.status ||
              ""
            }
          />
        );

      case "procurement":
      case "procurement officer":
        return (
          <ProcurementTable
            requests={items}
            selectedRequest={currentRequest}
            vendors={vendors || []}
            onEditItem={handleEditItem}
            handleDeleteItem={handleDeleteItem}
            handleVendorChange={handleVendorChange}
            handleCreateVendor={handleCreateVendor}
            showUnitPrice={true}
            showVat={true}
            showPRN={true}
            showPON={false}
            showItemTypeAndDept={true}
            allowPriceEditing={!tableReadOnly}
            allowEditing={!tableReadOnly}
            canEditPRN={!tableReadOnly}
            canEditPON={false}
            allowVendorSelection={!tableReadOnly}
            allowItemTypeChange={!tableReadOnly}
            allowInStockChange={!tableReadOnly}
            allowLogisticsChange={!tableReadOnly}
            isPreview={false}
            readOnly={tableReadOnly}
            onSwitchInitiated={(itemId) => {}}
            onFilesChanged={handleFilesChanged}
          />
        );
    }
  };

  // Handle edit item
  const handleEditItem = async (item) => {
    try {
      const token = getToken();
      if (!token) {
        console.error("❌ No token available");
        throw new Error("No token");
      }

      const itemId = item.itemId || item._id;
      const requestId = request.requestId;

      // Build payload: send only item fields (remove internal/meta fields)
      const payload = { ...item };
      delete payload.itemId;
      delete payload._id;
      delete payload._groupIndex;
      delete payload.requestId;

      // normalize wrong key to expected API shape
      if (payload.inStockLocation !== undefined) {
        payload.storeLocation = payload.inStockLocation;
        delete payload.inStockLocation;
      }

      // sanitize currency: do not send an empty string (server validates currency)
      if (Object.prototype.hasOwnProperty.call(payload, "currency")) {
        const cur = payload.currency;
        if (
          cur === "" ||
          cur === null ||
          cur === undefined ||
          String(cur).trim() === ""
        ) {
          delete payload.currency;
        }
      }

      const url = `${API_BASE_URL}/requests/${requestId}/items/${itemId}`;
      console.log("🔁 Editing item. PATCH URL:", url);
      console.log("🔁 Editing item. PATCH payload:", payload);

      const response = await axios.patch(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("🔁 Edit item response:", response?.data);

      if (response.status === 200) {
        // Refresh local request details to reflect server changes
        await fetchRequestDetails();
        return response.data;
      } else {
        console.error("Unexpected response editing item:", response);
        throw new Error("Failed to update item");
      }
    } catch (error) {
      // better error output for debugging
      console.error("Error editing item:", {
        message: error.message,
        status: error.response?.status,
        responseData: error.response?.data,
        errorsArray: error.response?.data?.errors,
        payloadPreview: item,
      });
      throw error;
    }
  };

  // Handle delete item
  const handleDeleteItem = async (requestId, itemId, reason = "") => {
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      // send DELETE with optional reason in the body
      const resp = await axios.delete(
        `${API_BASE_URL}/requests/${encodeURIComponent(
          requestId
        )}/items/${encodeURIComponent(itemId)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: reason || null },
        }
      );

      // if backend returns updated request or item, refresh details
      await fetchRequestDetails();

      return resp.data;
    } catch (err) {
      console.error(
        "Error deleting item:",
        err?.response?.data || err.message || err
      );
      throw err;
    }
  };

  const canProceedToApprove = () => {
    const items = currentRequest?.items || [];
    const missingQty = items.find(
      (it) => it.inStock && !(parseInt(it.inStockQuantity, 10) > 0)
    );
    if (missingQty) {
      alert(
        `Cannot approve: item "${
          missingQty.name || missingQty.itemId
        }" provide Instock quantity.`
      );
      return false;
    }
    const missingLocation = items.find(
      (it) => it.inStock && (!it.storeLocation || it.storeLocation === "")
    );
    if (missingLocation) {
      alert(
        `Cannot approve: item "${
          missingLocation.name || missingLocation.itemId
        }" Provide a store location.`
      );
      return false;
    }
    return true;
  };
  const handleApproveClick = () => {
    // currentRequest may be the fresh copy or the original prop
    const req = selectedRequest || request;
    const reqType = (req?.requestType || "").toString().toLowerCase();
    if (reqType === "pettycash" && userRole === "requester") {
      const invoiceFiles = Array.isArray(req?.invoiceFiles)
        ? req.invoiceFiles
        : [];
      if (!invoiceFiles || invoiceFiles.length === 0) {
        alert(
          "Please upload invoice file(s) before approving petty cash requests."
        );
        return;
      }
    }

    const items = Array.isArray(req?.items) ? req.items : [];

    // check for paid / partpayment statuses (case-insensitive)
    const hasPaidOrPart = items.some((it) => {
      const st = (it?.paymentStatus || "").toString().toLowerCase();
      return st === "paid" || st === "partpayment";
    });

    const adviceFiles = Array.isArray(req?.paymentAdviceFiles)
      ? req.paymentAdviceFiles
      : [];

    if (hasPaidOrPart && adviceFiles.length === 0) {
      alert(" Please upload payment advice files ");
      // blocked — user should upload files then click Approve again
      return;
    }

    // existing local validations
    if (!canProceedToApprove()) return;

    // finally call parent approve handler
    onApprove(request.requestId);
  };
  const handleDeliveryQuantityChange = async (
    requestIdParam,
    itemId,
    quantity,
    outstandingQuantity // optional
  ) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Not authenticated");

      const requestIdToUse = requestIdParam || request.requestId;

      const delivered = Number(quantity) || 0;

      const itemsList = selectedRequest?.items || request?.items || [];
      const found = (itemsList || []).find(
        (it) => (it.itemId || it._id || it.id) === (itemId || "")
      );
      const qty = Number(found?.quantity || 0);

      const outstanding =
        typeof outstandingQuantity === "number"
          ? Math.max(0, Number(outstandingQuantity))
          : Math.max(0, qty - delivered);

      // Build payload: only canonical DB fields
      const payload = {
        deliveredQuantity: delivered,
        outstandingQuantity: outstanding,
      };

      const url = `${API_BASE_URL}/requests/${encodeURIComponent(
        requestIdToUse
      )}/items/${encodeURIComponent(itemId)}`;

      const resp = await axios.patch(url, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.debug(
        "handleDeliveryQuantityChange: patch response:",
        resp?.status,
        resp?.data
      );

      const updated = await fetchRequestDetails();

      // recompute canApproveDelivery
      const itemsAfter = updated?.items || [];
      const isDeliveryRole = (userRole || "")
        .toString()
        .toLowerCase()
        .includes("delivery");

      // NEW: same pettyCash special eligibility used when recalculating after changes
      const reqTypeLowerAfter = (
        updated?.requestType ||
        request?.requestType ||
        ""
      )
        .toString()
        .toLowerCase();
      const currentStateAfter =
        updated?.flow?.currentState ||
        request?.flow?.currentState ||
        updated?.status ||
        request?.status ||
        "" ||
        "";
      const isPettySpecialAfter =
        reqTypeLowerAfter === "pettycash" &&
        currentStateAfter === "PENDING_REQUESTER_DELIVERY_CONFIRMATION";

      const rowEligibleAfter = (it) => !!it.inStock || isPettySpecialAfter;

      const allFullyDelivered = (itemsAfter || []).every((it) => {
        if (!rowEligibleAfter(it)) return true;
        const deliveredVal = Number(it.deliveredQuantity || 0);
        const q = Number(it.quantity || 0);
        return q === 0 ? true : deliveredVal === q;
      });
      setCanApproveDelivery(allFullyDelivered);
      return updated;
    } catch (err) {
      console.error("Error saving deliveredQuantity/outstanding:", err);
      alert(
        err?.response?.data?.message ||
          "Failed to save delivered/outstanding quantities"
      );
      throw err;
    }
  };

  const deliveryRolesList = [
    "delivery base",
    "delivery jetty",
    "delivery vessel",
    "deliverybase",
    "deliveryjetty",
    "deliveryvessel",
  ];
  const isDeliveryUserRoleLocal = deliveryRolesList.includes(userRole);
  const computeCanApproveNow = (() => {
    const req = selectedRequest || request;
    const reqTypeLower = (req?.requestType || "").toString().toLowerCase();
    const currentStateStr =
      (req?.flow?.currentState || req?.status || "").toString() || "";
    const isPettySpecial =
      reqTypeLower === "pettycash" &&
      currentStateStr === "PENDING_REQUESTER_DELIVERY_CONFIRMATION";

    const items = Array.isArray(req?.items) ? req.items : [];

    // detect if any row is in-stock (in-stock flow)
    const hasInStockFlow = (items || []).some((it) => !!it.inStock);

    // rows that are eligible for delivery checks
    const rowEligible = (it) => !!it.inStock || isPettySpecial;

    const mustEnforce =
      isDeliveryUserRoleLocal ||
      (isPettySpecial && userRole === "requester") ||
      (hasInStockFlow &&
        userRole === "requester" &&
        reqTypeLower === "purchaseorder");

    if (!mustEnforce) return true;

    return (items || []).every((it) => {
      if (!rowEligible(it)) return true;
      const deliveredVal = Number(it.deliveredQuantity || 0);
      const q = Number(it.quantity || 0);
      if (q === 0) return true;
      return deliveredVal === q;
    });
  })();

  // helper to detect delivery roles for footer logic
  const isDeliveryUserRole = [
    "deliverybase",
    "delivery base",
    "deliveryjetty",
    "delivery jetty",
    "deliveryvessel",
    "delivery vessel",
  ].includes(userRole);

  // ✅ ADD THIS - Handle Vendor Change
  const handleVendorChange = async (itemId, selectedOption) => {
    try {
      const payload = {
        itemId,
        vendorId: selectedOption?.value || null,
        requestId: request.requestId,
      };

      console.log("🔁 handleVendorChange payload:", payload);

      await handleEditItem(payload);

      // Refresh details so UI shows latest values immediately
      await fetchRequestDetails();
    } catch (error) {
      console.error(
        "❌ Error updating vendor:",
        error.response?.data || error.message || error
      );
    }
  };

  const handleCreateVendor = async (vendorName, index) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_BASE_URL}/vendors`,
        { name: vendorName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const created = response.data?.data || response.data;
      if (!created) throw new Error("Invalid vendor response");

      setVendors((prev) => [...(prev || []), created]);

      return {
        value:
          created.vendorId || created.vendorId === 0
            ? created.vendorId
            : created._id || created.id,
        label: created.name || vendorName,
      };
    } catch (error) {
      console.error("❌ Error creating vendor:", error);
      throw error;
    }
  };

  // --- Helpers for quotation upload (REPLACED to handle multiple files)
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length) processSelectedFiles(files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target?.files || []);
    if (files.length) processSelectedFiles(files);
    // reset input so same file can be selected again if needed
    e.target.value = null;
  };

  const processSelectedFiles = (files) => {
    const maxSize = 10 * 1024 * 1024;
    const newEntries = files
      .map((file, idx) => {
        if (file.size > maxSize) {
          alert(`${file.name} is too large. Max 10MB per file.`);
          return null;
        }
        const id = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}-${idx}`;
        const previewUrl = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null;
        return { id, file, previewUrl, progress: 0, uploaded: false };
      })
      .filter(Boolean);

    if (newEntries.length === 0) return;

    // add to UI so user can see items (failed uploads remain for retry)
    setQuotationFiles((prev) => [...prev, ...newEntries]);

    // start uploads immediately (do not await; uploadEntryImmediate handles state & errors)
    newEntries.forEach((entry) => {
      // slight delay so state updates before upload begins (optional)
      setTimeout(() => uploadEntryImmediate(entry), 50);
    });
  };

  const handleRemoveFile = (id) => {
    setQuotationFiles((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleUploadFile = async (id) => {
    const entry = quotationFiles.find((e) => e.id === id);
    if (!entry) return;
    try {
      setIsUploading(true);
      // reset progress for this file when (re)uploading
      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 0, uploaded: false } : p
        )
      );

      const token = getToken();
      const formData = new FormData();
      formData.append("files", entry.file); // API accepts array, sending single file in "files"

      const resp = await axios.post(
        `${API_BASE_URL}/requests/${request.requestId}/quotations`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 1)
            );
            setQuotationFiles((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: percent } : p))
            );
          },
        }
      );

      setQuotationFiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, progress: 100, uploaded: true } : p
        )
      );
      // refresh request details to pick up persisted quotation URLs
      if (typeof fetchRequestDetails === "function")
        await fetchRequestDetails();
      alert(resp.data?.message || "File uploaded.");
    } catch (err) {
      console.error("Error uploading quotation:", err);
      alert(err.response?.data?.message || "Upload failed");
      setQuotationFiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, uploaded: false } : p))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadAll = async () => {
    // Upload sequentially to update progress per-file reliably
    for (const entry of [...quotationFiles]) {
      if (!entry.uploaded) {
        // eslint-disable-next-line no-await-in-loop
        await handleUploadFile(entry.id);
      }
    }
  };

  useEffect(() => {
    return () => {
      // cleanup preview urls
      quotationFiles.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, []); // run once on unmount

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        <MdArrowBack className="text-xl" />
        Back to Requests
      </button>

      {/* Workflow Progress - Now a separate component */}
      {request.flow?.path && (
        <div className="mb-8">
          <RequestWorkflow workflowPath={request.flow.path} />
        </div>
      )}

      {/* Request Information */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Request Details
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Request ID
            </p>
            <p className="text-sm text-slate-900 font-semibold font-mono">
              {request.requestId}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Company</p>
            <p className="text-sm text-slate-900 font-semibold font-mono">
              {request.company?.name || "N/A"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Requester
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.requester?.displayName || "N/A"}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Department
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.department}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            {" "}
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Destination
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.destination}
            </p>
          </div>

          {request.vesselId && (
            <div className="px-4 py-3 border-b border-r border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                Vessel
              </p>
              <p className="text-sm text-slate-900 font-semibold">
                {getVesselName(request.vesselId)}
              </p>
            </div>
          )}
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Submitted Date
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Request Type
            </p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                {request.requestType === "purchaseOrder"
                  ? "Purchase Order"
                  : "Petty Cash"}
              </span>
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Asset ID
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.assetId || "N/A"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Logistics Type{" "}
            </p>
            <p className="text-sm text-slate-900 font-semibold capitalize">
              {request.logisticsType || "N/A"}
            </p>
          </div>
          <div className="px-4 py-3 border-b border-r border-slate-200"></div>
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Job Number{" "}
            </p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                {request.jobNumber || "N/A"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Purpose */}
      {request.purpose && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdDescription className="text-xl" />
            Purpose
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <p className="text-slate-700 leading-relaxed">{request.purpose}</p>
          </div>
        </div>
      )}

      {/* ===== attaching of request to another request ===== */}

      {String(currentRequest?.tag || "")
        .toLowerCase()
        .includes("shipping") &&
        userRole === "requester" &&
        !isReadOnly && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              🔗 Attach Items from Another Request
            </h3>

            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
              <div className="flex gap-3 items-start relative">
                <input
                  ref={attachInputRef}
                  value={attachSearchTerm}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAttachSearchTerm(v);
                    // live filter / fetch dropdown results
                    fetchAttachDropdownResults(v);
                  }}
                  onFocus={() => {
                    // show default dropdown (shipping pending requests)
                    fetchAttachDropdownResults("");
                  }}
                  onBlur={() => {
                    // small delay to allow click on dropdown item
                    setTimeout(() => setAttachDropdownOpen(false), 150);
                  }}
                  onKeyDown={(e) => {
                    const max = (attachDropdownResults || []).length - 1;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setAttachFocusedIndex((i) =>
                        Math.min(max, Math.max(-1, i + 1))
                      );
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setAttachFocusedIndex((i) =>
                        Math.max(-1, Math.min(max, i - 1))
                      );
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const idx = attachFocusedIndex;
                      if (idx >= 0 && attachDropdownResults[idx]) {
                        const selected = attachDropdownResults[idx];
                        loadSourceRequestItems(
                          selected.requestId || selected.id
                        );
                        setAttachDropdownOpen(false);
                      } else {
                        performAttachSearch();
                      }
                    }
                  }}
                  placeholder="Search by vendor name or PON (click to show shipping requests)"
                  className="flex-1 px-4 py-3 border rounded-xl"
                />
                <button
                  onClick={() => performAttachSearch()}
                  disabled={attachSearching || !attachSearchTerm.trim()}
                  className="px-4 py-3 bg-[#036173] text-white rounded-xl"
                >
                  {attachSearching ? "Searching..." : "Search"}
                </button>

                {/* Dropdown results (shows on focus or when open) */}
                {attachDropdownOpen &&
                  (() => {
                    const portalTarget =
                      typeof document !== "undefined" && document.body
                        ? document.body
                        : null;

                    // compute position relative to viewport (use fixed so it escapes stacking contexts)
                    let dropdownStyle = {
                      position: "fixed",
                      top: "0px",
                      left: "0px",
                      width: "300px",
                      zIndex: 2147483647,
                      maxHeight: "60vh",
                      overflow: "auto",
                    };

                    try {
                      const el = attachInputRef && attachInputRef.current;
                      if (
                        el &&
                        typeof el.getBoundingClientRect === "function"
                      ) {
                        const rect = el.getBoundingClientRect();
                        dropdownStyle = {
                          ...dropdownStyle,
                          top: `${rect.bottom}px`,
                          left: `${rect.left}px`,
                          width: `${rect.width}px`,
                        };
                      }
                    } catch (e) {
                      // ignore and use fallback style
                    }

                    const dropdown = (
                      <div
                        style={dropdownStyle}
                        className="bg-white border rounded-lg shadow-lg"
                      >
                        {attachDropdownLoading ? (
                          <div className="p-3 text-sm text-slate-500">
                            Loading...
                          </div>
                        ) : attachDropdownResults.length === 0 ? (
                          <div className="p-3 text-sm text-slate-500">
                            No shipping requests found
                          </div>
                        ) : (
                          attachDropdownResults.map((r, idx) => {
                            const vendor =
                              r.vendor ||
                              r.requester?.displayName ||
                              "Unknown vendor";
                            const po =
                              r.purchaseOrderNumber ||
                              r.reference ||
                              r.requestId ||
                              r.purchaseReqNumber ||
                              r.requestId;
                            const itemCount = Array.isArray(r.items)
                              ? r.items.length
                              : r.itemCount || 0;
                            const focused = idx === attachFocusedIndex;
                            return (
                              <div
                                key={r.requestId || r.id || idx}
                                onMouseDown={(ev) => {
                                  // onMouseDown so click registers before blur
                                  ev.preventDefault();
                                  loadSourceRequestItems(r.requestId || r.id);
                                  setAttachDropdownOpen(false);
                                  setAttachSearchTerm("");
                                }}
                                onMouseEnter={() => setAttachFocusedIndex(idx)}
                                className={`p-3 cursor-pointer flex items-center justify-between ${
                                  focused ? "bg-slate-100" : "hover:bg-slate-50"
                                }`}
                              >
                                <div>
                                  <div className="text-sm font-semibold">
                                    {po}
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    {vendor}
                                  </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {itemCount} item{itemCount === 1 ? "" : "s"}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );

                    return portalTarget
                      ? createPortal(dropdown, portalTarget)
                      : dropdown;
                  })()}
              </div>

              {attachSearchResults.length > 0 && (
                <div className="mt-4 grid gap-2">
                  {attachSearchResults.map((res) => (
                    <div
                      key={res.requestId || res.id}
                      className="p-3 rounded-lg border hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {res.summary ||
                            res.requestId ||
                            res.purchaseOrderNumber ||
                            res.reference}
                        </div>
                        <div className="text-xs text-slate-500">
                          {res.vendor ||
                            res.requester?.displayName ||
                            "Unknown vendor"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            loadSourceRequestItems(res.requestId || res.id)
                          }
                          className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-700"
                        >
                          View Items
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {attachSourceItems.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">
                        Source: {attachSourceMeta?.requestId}
                      </div>
                      <div className="text-xs text-slate-500">
                        {attachSourceMeta?.vendor}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllAttachItems}
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md"
                      >
                        Select All
                      </button>
                      <button
                        onClick={clearAttachSelection}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-md"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {attachSourceItems.map((it) => {
                      const iid = it.itemId || it._id || it.id;
                      return (
                        <label
                          key={iid}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-semibold">
                              {it.name || it.description || iid}
                            </div>
                            <div className="text-xs text-slate-500">
                              Qty: {it.quantity || it.qty || "N/A"}
                            </div>
                          </div>
                          <div>
                            <input
                              type="checkbox"
                              checked={attachSelectedItemIds.includes(iid)}
                              onChange={() => toggleAttachSelect(iid)}
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      placeholder="Purpose (optional)"
                      className="flex-1 px-3 py-2 border rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const p = e.target.value.trim();
                          const confirmed = window.confirm(
                            "Attach selected items to this request?"
                          );
                          if (confirmed)
                            attachSelectedToTarget(currentRequest.requestId, p);
                        }
                      }}
                      id="attach-purpose-input"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          "attach-purpose-input"
                        );
                        const purpose = el ? el.value.trim() : "";
                        const confirmed = window.confirm(
                          "Attach selected items to this request?"
                        );
                        if (confirmed)
                          attachSelectedToTarget(
                            currentRequest.requestId,
                            purpose
                          );
                      }}
                      disabled={attachSelectedItemIds.length === 0}
                      className="px-4 py-2 bg-[#036173] text-white rounded-lg"
                    >
                      Attach Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Accounting Lead: attach-from-other-request (excludes shipping requests) */}
      {!isReadOnly &&
        (userRole === "accountinglead" ||
          userRole === "accounting lead" ||
          userRole === "account lead") && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              🔗 Attach Items from Another Request (Accounting)
            </h3>

            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
              <div className="flex gap-3 items-start relative">
                <input
                  ref={accAttachInputRef}
                  value={accAttachSearchTerm}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAccAttachSearchTerm(v);
                    fetchAccAttachDropdownResults(v);
                  }}
                  onFocus={() => fetchAccAttachDropdownResults("")}
                  onBlur={() =>
                    setTimeout(() => setAccAttachDropdownOpen(false), 150)
                  }
                  onKeyDown={(e) => {
                    const max = (accAttachDropdownResults || []).length - 1;
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setAccAttachFocusedIndex((i) =>
                        Math.min(max, Math.max(-1, i + 1))
                      );
                      return;
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setAccAttachFocusedIndex((i) =>
                        Math.max(-1, Math.min(max, i - 1))
                      );
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const idx = accAttachFocusedIndex;
                      if (idx >= 0 && accAttachDropdownResults[idx]) {
                        const selected = accAttachDropdownResults[idx];
                        // load then auto-attach
                        (async () => {
                          const loaded = await loadAccSourceRequestItems(
                            selected.requestId || selected.id
                          );
                          if (!loaded) return;
                          await attachAccSelectedToTarget(
                            currentRequest.requestId,
                            "",
                            loaded.src?.requestId ||
                              selected.requestId ||
                              selected.id,
                            true
                          );
                        })();
                        setAccAttachDropdownOpen(false);
                        setAccAttachSearchTerm("");
                      } else {
                        fetchAccAttachDropdownResults(accAttachSearchTerm);
                      }
                    }
                  }}
                  placeholder="Search vendor or PON (excludes shipping requests)"
                  className="flex-1 px-4 py-3 border rounded-xl"
                />
              </div>

              {/* Dropdown results portal */}
              {accAttachDropdownOpen &&
                (() => {
                  const portalTarget =
                    typeof document !== "undefined" && document.body
                      ? document.body
                      : null;
                  let dropdownStyle = {
                    position: "fixed",
                    top: "0px",
                    left: "0px",
                    width: "300px",
                    zIndex: 2147483647,
                    maxHeight: "60vh",
                    overflow: "auto",
                  };
                  try {
                    const el = accAttachInputRef && accAttachInputRef.current;
                    if (el && typeof el.getBoundingClientRect === "function") {
                      const rect = el.getBoundingClientRect();
                      dropdownStyle = {
                        ...dropdownStyle,
                        top: `${rect.bottom}px`,
                        left: `${rect.left}px`,
                        width: `${rect.width}px`,
                      };
                    }
                  } catch (e) {
                    // ignore
                  }

                  const dropdown = (
                    <div
                      style={dropdownStyle}
                      className="bg-white border rounded-lg shadow-lg"
                    >
                      {accAttachDropdownLoading ? (
                        <div className="p-3 text-sm text-slate-500">
                          Loading...
                        </div>
                      ) : accAttachDropdownResults.length === 0 ? (
                        <div className="p-3 text-sm text-slate-500">
                          No pending requests found
                        </div>
                      ) : (
                        accAttachDropdownResults.map((r, idx) => {
                          const vendor =
                            r.vendor ||
                            r.requester?.displayName ||
                            "Unknown vendor";
                          const po =
                            r.purchaseOrderNumber ||
                            r.reference ||
                            r.requestId ||
                            r.summary ||
                            r.requestId;
                          const itemCount = Array.isArray(r.items)
                            ? r.items.length
                            : r.itemCount || 0;
                          // compute total safely (server may not include totals)
                          const total = (
                            Array.isArray(r.items) ? r.items : []
                          ).reduce((s, it) => {
                            const qty = Number(it.quantity || it.qty || 0);
                            const line =
                              it.total != null
                                ? Number(it.total)
                                : Number(it.unitPrice || it.price || 0) * qty;
                            return s + (isNaN(line) ? 0 : line);
                          }, 0);
                          const focused = idx === accAttachFocusedIndex;
                          return (
                            <div
                              key={r.requestId || r.id || idx}
                              onMouseDown={async (ev) => {
                                ev.preventDefault();
                                const loaded = await loadAccSourceRequestItems(
                                  r.requestId || r.id
                                );
                                if (!loaded) return;
                                await attachAccSelectedToTarget(
                                  currentRequest.requestId,
                                  "",
                                  loaded.src?.requestId || r.requestId || r.id,
                                  true
                                );
                                setAccAttachDropdownOpen(false);
                                setAccAttachSearchTerm("");
                              }}
                              onMouseEnter={() => setAccAttachFocusedIndex(idx)}
                              className={`p-3 cursor-pointer flex items-center justify-between ${
                                focused ? "bg-slate-100" : "hover:bg-slate-50"
                              }`}
                            >
                              <div>
                                <div className="text-sm font-semibold">
                                  {po}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {vendor}
                                </div>
                              </div>
                              <div className="text-xs text-slate-500 text-right">
                                <div>
                                  {itemCount} item{itemCount === 1 ? "" : "s"}
                                </div>
                                <div className="mt-1">
                                  {formatAmount(total, r.currency || "NGN")}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                  return portalTarget
                    ? createPortal(dropdown, portalTarget)
                    : dropdown;
                })()}

              {/* Loaded source items (after selection) */}
              {accAttachSourceItems.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold">
                        Source: {accAttachSourceMeta?.requestId}
                      </div>
                      <div className="text-xs text-slate-500">
                        {accAttachSourceMeta?.vendor}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setAccAttachSelectedItemIds(
                            accAttachSourceItems
                              .map((it) => it.itemId || it._id || it.id)
                              .filter(Boolean)
                          )
                        }
                        className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => {
                          setAccAttachSourceItems([]);
                          setAccAttachSelectedItemIds([]);
                          setAccAttachSourceMeta(null);
                        }}
                        className="px-3 py-1 bg-red-50 text-red-600 rounded-md"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {accAttachSourceItems.map((it) => {
                      const iid = it.itemId || it._id || it.id;
                      return (
                        <label
                          key={iid}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <div>
                            <div className="text-sm font-semibold">
                              {it.name || it.description || iid}
                            </div>
                            <div className="text-xs text-slate-500">
                              Qty: {it.quantity || it.qty || "N/A"}
                            </div>
                          </div>
                          <div>
                            <input
                              type="checkbox"
                              checked={accAttachSelectedItemIds.includes(iid)}
                              onChange={() =>
                                setAccAttachSelectedItemIds((prev) =>
                                  prev.includes(iid)
                                    ? prev.filter((x) => x !== iid)
                                    : [...prev, iid]
                                )
                              }
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <input
                      placeholder="Purpose (optional)"
                      id="attach-purpose-accounting"
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => {
                        const el = document.getElementById(
                          "attach-purpose-accounting"
                        );
                        const purpose = el ? el.value.trim() : "";
                        attachAccSelectedToTarget(
                          currentRequest.requestId,
                          purpose,
                          accAttachSourceMeta?.requestId || null,
                          true
                        );
                      }}
                      disabled={accAttachSelectedItemIds.length === 0}
                      className="px-4 py-2 bg-[#036173] text-white rounded-lg"
                    >
                      Attach Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Quotation Upload - inserted ABOVE Requested Items (UPDATED for multiple files) */}
      {(canUploadQuotation ||
        (String(currentRequest?.tag || "")
          .toLowerCase()
          .includes("shipping") &&
          userRole === "requester")) &&
        !isReadOnly && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MdAttachFile className="text-xl" />
              Upload Quotation
            </h3>

            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                role="button"
                tabIndex={0}
                onClick={handleBrowseClick}
                className="w-full cursor-pointer rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors duration-200 p-6 flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl">
                    📎
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {quotationFiles.length > 0
                        ? `${quotationFiles.length} file(s) selected`
                        : "Drag & drop quotation(s) here, or click to browse"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                    className="px-4 py-2 bg-[#036173] text-white rounded-md hover:bg-[#024f56] transition"
                  >
                    Add Files
                  </button>

                  {quotationFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUploadAll();
                      }}
                      disabled={isUploading}
                      className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition text-sm"
                    >
                      Upload All
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleInputChange}
                  multiple
                  className="hidden"
                />
              </div>

              {/* Files list & per-file actions */}
              {quotationFiles.length > 0 && (
                <div className="mt-4 space-y-3">
                  {quotationFiles.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border">
                        {entry.previewUrl ? (
                          <img
                            src={entry.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-600 text-sm px-2 text-center">
                            {entry.file.type === "application/pdf"
                              ? "PDF"
                              : "FILE"}
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 truncate w-72">
                              {entry.file.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {(entry.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUploadFile(entry.id);
                              }}
                              disabled={isUploading || entry.uploaded}
                              className={`px-3 py-2 rounded-md text-sm font-medium ${
                                isUploading || entry.uploaded
                                  ? "bg-gray-200 text-slate-600 cursor-not-allowed"
                                  : "bg-emerald-500 text-white hover:bg-emerald-600"
                              }`}
                            >
                              {entry.uploaded ? "Uploaded" : "Upload"}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(entry.id);
                              }}
                              className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 bg-emerald-500 transition-all"
                              style={{ width: `${entry.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {entry.progress}%{" "}
                            {isUploading && entry.progress < 100
                              ? "• uploading"
                              : entry.uploaded
                              ? "• complete"
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      {/* ===== End Quotation Upload ===== */}

      {/* Items List - Role-based table */}
      {currentRequest?.items && currentRequest.items.length > 0 && (
        <div className="mb-8 ">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdShoppingCart className="text-xl" />
            Requested Items
          </h3>
          <div
            className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg"
            style={{ position: "relative", zIndex: 1 }}
          >
            {renderItemsTable()}
          </div>
        </div>
      )}

      {(() => {
        const currentStateStr =
          selectedRequest?.flow?.currentState ||
          request.flow?.currentState ||
          "" ||
          "";
        const reqType = (
          selectedRequest?.requestType ||
          request?.requestType ||
          ""
        )
          .toString()
          .toLowerCase();
        const isSecondApprovalAcc =
          currentStateStr === "PENDING_ACCOUNTING_OFFICER_APPROVAL_2";
        const isPettyCashReq = reqType === "pettycash";
        const showPaymentAdviceUpload =
          reqType === "purchaseorder" ||
          (isPettyCashReq && isSecondApprovalAcc);

        const isAccountingRole =
          userRole === "accountingofficer" ||
          userRole === "accounting officer" ||
          userRole === "accountinglead" ||
          userRole === "accounting lead" ||
          userRole === "account lead";

        if (showPaymentAdviceUpload && isAccountingRole && !isReadOnly) {
          return (
            <PaymentAdviceUpload
              requestId={request.requestId}
              apiBase={API_BASE_URL}
              getToken={getToken}
              onFilesChanged={handleFilesChanged}
            />
          );
        }
        return null;
      })()}
      {userRole === "requester" &&
        !isReadOnly &&
        (selectedRequest?.requestType || request?.requestType) ===
          "pettyCash" &&
        (selectedRequest?.flow?.currentState ||
          request?.flow?.currentState ||
          request?.status ||
          "") !== "PENDING_REQUESTER_DELIVERY_CONFIRMATION" && (
          <InvoiceUpload
            requestId={request.requestId}
            apiBase={API_BASE_URL}
            getToken={getToken}
            onFilesChanged={handleFilesChanged}
          />
        )}
      {/* Comments */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          💬 Comments
        </h3>
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg space-y-4">
          {/* Add Comment */}
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment... (be polite and concise)"
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

      {user?.role?.toLowerCase() === "procurement officer" && !isReadOnly && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdDirectionsBoat className="text-xl" />
            Assign Delivery
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <div className="max-w-md">
              <Select
                options={deliveryOptions}
                value={deliveryTarget}
                onChange={handleDeliveryChange}
                isClearable
                placeholder="Select delivery target..."
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "48px",
                    borderRadius: 12,
                    boxShadow: "none",
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                menuPortalTarget={document.body}
              />
              {deliveryTarget && (
                <p className="mt-3 text-sm text-slate-600">
                  Selected:{" "}
                  <span className="font-semibold">{deliveryTarget.label}</span>
                  {isSavingDelivery && (
                    <span className="ml-3 text-xs text-slate-500">
                      Saving...
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {["delivery base", "delivery jetty", "delivery vessel"].includes(
        userRole
      ) && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MdDirectionsBoat className="text-xl" />
            Next Delivery
          </h3>
          <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-lg">
            <div className="max-w-md">
              <Select
                options={
                  Array.isArray(selectedRequest?.nextDeliveryStations) &&
                  selectedRequest.nextDeliveryStations.length
                    ? selectedRequest.nextDeliveryStations.map((s) => ({
                        value: s,
                        label: s,
                      }))
                    : Array.isArray(request?.nextDeliveryStations) &&
                      request.nextDeliveryStations.length
                    ? request.nextDeliveryStations.map((s) => ({
                        value: s,
                        label: s,
                      }))
                    : deliveryOptions
                }
                value={nextDeliveryTarget}
                onChange={handleNextDeliveryChange}
                isClearable
                placeholder="Select next delivery station..."
                styles={{
                  control: (provided) => ({
                    ...provided,
                    minHeight: "48px",
                    borderRadius: 12,
                    boxShadow: "none",
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                menuPortalTarget={document.body}
              />
              {nextDeliveryTarget && (
                <p className="mt-3 text-sm text-slate-600">
                  Selected:{" "}
                  <span className="font-semibold">
                    {nextDeliveryTarget.label}
                  </span>
                  {isSavingNextDelivery && (
                    <span className="ml-3 text-xs text-slate-500">
                      Saving...
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attached Documents (quotationFiles from request) */}
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
      {isRejectModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeRejectModal}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/3 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="text-sm font-semibold">Reject Request</div>
                <button
                  onClick={closeRejectModal}
                  className="text-slate-500 hover:text-slate-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-slate-600 mb-3">
                  Provide a reason for rejection.
                </p>

                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  placeholder="Please explain why this request needs correction..."
                  className="w-full border rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-500">
                    <span>{(rejectComment || "").length}</span>/1000
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeRejectModal}
                      className="px-4 py-2 bg-white border rounded-md text-sm text-slate-700 hover:bg-slate-50"
                      disabled={isRejecting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitReject}
                      disabled={
                        isRejecting || (rejectComment || "").trim().length < 3
                      }
                      className={`px-4 py-2 rounded-md text-sm font-semibold ${
                        isRejecting
                          ? "bg-gray-300 text-slate-700 cursor-not-allowed"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {isRejecting ? "Rejecting…" : "Reject and Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isQueryModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeQueryModal}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/3 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="text-sm font-semibold">Query Request</div>
                <button
                  onClick={closeQueryModal}
                  className="text-slate-500 hover:text-slate-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-slate-600 mb-3">
                  Provide a reason for querying this request.
                </p>

                <textarea
                  value={queryComment}
                  onChange={(e) => setQueryComment(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  placeholder="Please explain what needs correction..."
                  className="w-full border rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-500">
                    <span>{(queryComment || "").length}</span>/1000
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeQueryModal}
                      className="px-4 py-2 bg-white border rounded-md text-sm text-slate-700 hover:bg-slate-50"
                      disabled={isQuerying}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitQuery}
                      disabled={
                        isQuerying || (queryComment || "").trim().length < 3
                      }
                      className={`px-4 py-2 rounded-md text-sm font-semibold ${
                        isQuerying
                          ? "bg-gray-300 text-slate-700 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {isQuerying ? "Sending..." : "Send Query"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {isDeleteModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeDeleteModal}
          />
          <div className="fixed left-1/2 -translate-x-1/2 top-1/3 z-50 w-[95%] max-w-2xl">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="text-sm font-semibold">Delete Item</div>
                <button
                  onClick={closeDeleteModal}
                  className="text-slate-500 hover:text-slate-700"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <p className="text-sm text-slate-600 mb-3">
                  Provide a reason for deleting this item:{" "}
                  <span className="font-semibold">
                    {deleteTargetItem?.name || deleteTargetItem?.itemId || ""}
                  </span>
                </p>

                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  placeholder="Please explain why this item should be deleted..."
                  className="w-full border rounded-lg p-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />

                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-slate-500">
                    <span>{(deleteReason || "").length}</span>/1000
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeDeleteModal}
                      className="px-4 py-2 bg-white border rounded-md text-sm text-slate-700 hover:bg-slate-50"
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitDelete}
                      disabled={
                        isDeleting || (deleteReason || "").trim().length < 3
                      }
                      className={`px-4 py-2 rounded-md text-sm font-semibold ${
                        isDeleting
                          ? "bg-gray-300 text-slate-700 cursor-not-allowed"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      {isDeleting ? "Deleting…" : "Delete Item"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Action Footer */}
      {!isReadOnly && (
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-6 md:px-8 py-6 shadow-lg sticky bottom-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-sm">
              Review the request details and take action
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {allowedRejectRoles.includes(userRole) && (
                <button
                  onClick={openRejectModal}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-6 h-12 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <MdCancel className="text-lg" />
                  Reject
                </button>
              )}
              <button
                onClick={openQueryModal}
                disabled={actionLoading}
                className="w-full sm:w-auto px-6 h-12 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <MdHelp className="text-lg" />
                Query
              </button>
              <button
                onClick={handleApproveClick}
                disabled={
                  actionLoading ||
                  !computeCanApproveNow ||
                  (isDeliveryUserRole && !canApproveDelivery)
                }
                className={`w-full sm:w-auto px-6 h-12 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  !computeCanApproveNow ||
                  (isDeliveryUserRole && !canApproveDelivery)
                    ? "bg-gray-400 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-[#036173] to-emerald-600 text-white hover:shadow-xl hover:shadow-emerald-500/30"
                } disabled:opacity-50`}
              >
                <MdCheckCircle className="text-lg" />
                {actionLoading ? "Processing..." : "Approve Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetailView;
