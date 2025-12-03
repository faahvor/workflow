import React, { useState, useRef, useEffect } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdShoppingCart,
  MdAttachMoney,
  MdDirectionsBoat,
  MdPerson,
  MdLocationOn,
  MdDescription,
  MdAttachFile,
  MdCancel,
  MdHelp,
} from "react-icons/md";
import { HiClock } from "react-icons/hi";
import Select from "react-select";
import axios from "axios";
import RequestForm from "./RequestForm"; // <-- add import
import EmailComposer from "./EmailComposer"; // <-- NEW import

const RequestDetailDemo = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const API_BASE = "https://hdp-backend-1vcl.onrender.com/api";

  // Sample items (moved above items state so it exists when used)
  const requestItems = [
    {
      id: 1,
      name: "Marine Engine Oil SAE 40",
      quantity: 50,
      unit: "liters",
      unitPrice: "$85.00",
      total: "$4,250.00",
    },
    {
      id: 2,
      name: "Oil Filter - Premium Grade",
      quantity: 24,
      unit: "pieces",
      unitPrice: "$45.00",
      total: "$1,080.00",
    },
    {
      id: 3,
      name: "Fuel Filter Assembly",
      quantity: 12,
      unit: "sets",
      unitPrice: "$120.00",
      total: "$1,440.00",
    },
    {
      id: 4,
      name: "Air Filter Element",
      quantity: 18,
      unit: "pieces",
      unitPrice: "$65.00",
      total: "$1,170.00",
    },
    {
      id: 5,
      name: "Hydraulic Oil ISO 68",
      quantity: 100,
      unit: "liters",
      unitPrice: "$75.00",
      total: "$7,500.00",
    },
  ];

  // --- items state (was static requestItems) ---
  const [items, setItems] = useState(requestItems);

  // search state for pulling another request's items
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedExternalRequest, setSelectedExternalRequest] = useState(null);

  const mockRequests = [
    {
      requestId: "REQ-2024-B",
      purchaseOrderNumber: "PON-0002",
      vendor: "Wartsila",
      items: [
        {
          id: "B-1",
          name: "Spare Pump",
          quantity: 3,
          unit: "pcs",
          unitPrice: "$450.00",
          total: "$1,350.00",
        },
        {
          id: "B-2",
          name: "Valve Set",
          quantity: 2,
          unit: "sets",
          unitPrice: "$220.00",
          total: "$440.00",
        },
      ],
    },
  ];

  // ===== New state for quotation upload (demo) =====
  const [quotationFile, setQuotationFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Delivery assignment state
  const [deliveryTarget, setDeliveryTarget] = useState(null);
  const deliveryOptions = [
    { value: "delivery", label: "Delivery" },
    { value: "delivery_base", label: "Delivery Base" },
    { value: "delivery_jetty", label: "Delivery Jetty" },
    { value: "delivery_vessel", label: "Delivery Vessel" },
  ];

  // Requisition preview state
  const [showRequisition, setShowRequisition] = useState(false);
  const openRequisition = () => setShowRequisition(true);
  const closeRequisition = () => setShowRequisition(false);

  // RequestForm preview state
  const [showRequestFormPreview, setShowRequestFormPreview] = useState(false);
  const openRequestFormPreview = () => setShowRequestFormPreview(true);
  const closeRequestFormPreview = () => setShowRequestFormPreview(false);

  // NEW: Email composer state and attachments
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailInitialAttachments, setEmailInitialAttachments] = useState([]);

  // NEW: create a demo "PDF" File for the attachment (demo-only, simple blob)
  const createDemoPdfAttachment = (req) => {
    const txt = `
      Requisition Demo PDF
      Request ID: ${req.id}
      Title: ${req.title}
      Requested by: ${req.requester}
      Amount: ${req.amount}
      Date: ${req.date}
    `;
    const blob = new Blob([txt], { type: "application/pdf" }); // demo PDF-like blob
    const fileName = `RequestForm-${req.id}.pdf`;
    try {
      // File constructor for better UX when supported
      return new File([blob], fileName, { type: "application/pdf" });
    } catch (e) {
      // fallback for older browsers
      const f = blob;
      f.name = fileName;
      return f;
    }
  };

  // NEW: handler for Send as Mail button
  const handleSendAsMailFromPreview = () => {
    const demoPdf = createDemoPdfAttachment(request);
    setEmailInitialAttachments([demoPdf]);
    closeRequestFormPreview();
    // small delay to allow modal to close visually before opening composer
    setTimeout(() => setShowEmailComposer(true), 120);
  };

  // Demo request data
  const request = {
    id: "REQ-2024-001",
    type: "purchase-order",
    title: "Marine Engine Parts",
    requester: "John Smith",
    department: "Marine",
    destination: "IT",
    vessel: "MV Ocean Star",
    amount: "$15,450",
    priority: "urgent",
    date: "2024-11-14",
    time: "09:30 AM",
    items: 12,
  };

  // Workflow stages
  const workflowStages = [
    { id: 1, name: "Submitted", status: "completed" },
    { id: 2, name: "Procurement Review", status: "current" },
    { id: 3, name: "Manager Approval", status: "pending" },
    { id: 4, name: "Finance Approval", status: "pending" },
    { id: 5, name: "Processing", status: "pending" },
    { id: 6, name: "Completed", status: "pending" },
  ];

  const getStageColor = (status) => {
    switch (status) {
      case "completed":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
      case "current":
        return "text-teal-500 bg-teal-500/10 border-teal-500/30";
      case "pending":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getStageIcon = (status) => {
    switch (status) {
      case "completed":
        return "✓";
      case "current":
        return "⏱";
      case "pending":
        return "⏳";
      default:
        return "⏳";
    }
  };

  // ===== New handlers =====
  const handleFileSelect = (file) => {
    if (!file) return;
    // Only allow single file in demo
    setQuotationFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleBrowseClick = () => fileInputRef.current?.click();

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    handleFileSelect(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    handleFileSelect(f);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleRemoveFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setQuotationFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  // Simulated upload for demo — replace with real API call if needed
  const handleUpload = async () => {
    if (!quotationFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    const total = 100;
    let p = 0;
    const t = setInterval(() => {
      p += Math.floor(Math.random() * 15) + 5;
      if (p >= total) {
        p = total;
        clearInterval(t);
        setTimeout(() => setIsUploading(false), 300);
      }
      setUploadProgress(p);
    }, 160);
  };

  // --- Search other requests (by vendor or PON) and merge items ---
  const performSearch = async () => {
    const q = searchTerm.trim();
    if (!q) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const token = sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Try paginated search endpoint - fallback to mockRequests on error
      const resp = await axios.get(
        `${API_BASE}/requests?search=${encodeURIComponent(q)}&limit=20`,
        { headers }
      );
      const body = resp.data || {};
      const data = Array.isArray(body.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];
      // Map to minimal result shape
      const results = data.map((r) => ({
        requestId: r.requestId || r.id || r.requestId,
        purchaseOrderNumber:
          r.purchaseOrderNumber || r.pon || r.purchaseOrderNumber,
        vendor: r.vendor || (r.items && r.items[0]?.vendor) || "",
        summary: `${r.requestId || r.id} • ${r.purchaseOrderNumber || ""} • ${
          r.vendor || ""
        }`,
      }));
      setSearchResults(
        results.length
          ? results
          : mockRequests.map((m) => ({
              requestId: m.requestId,
              purchaseOrderNumber: m.purchaseOrderNumber,
              vendor: m.vendor,
              summary: `${m.requestId} • ${m.purchaseOrderNumber} • ${m.vendor}`,
            }))
      );
    } catch (err) {
      console.warn("Search failed, using mock:", err);
      setSearchResults(
        mockRequests.map((m) => ({
          requestId: m.requestId,
          purchaseOrderNumber: m.purchaseOrderNumber,
          vendor: m.vendor,
          summary: `${m.requestId} • ${m.purchaseOrderNumber} • ${m.vendor}`,
        }))
      );
    } finally {
      setSearching(false);
    }
  };

  const fetchAndAttachRequest = async (requestIdOrPON) => {
    // Accept either a requestId or purchaseOrderNumber - try direct fetch by id then fallback to search
    try {
      const token = sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let resp;
      // try fetching by requestId
      try {
        resp = await axios.get(
          `${API_BASE}/requests/${encodeURIComponent(requestIdOrPON)}`,
          { headers }
        );
      } catch (err) {
        // fallback: search by PON or vendor
        const s = encodeURIComponent(requestIdOrPON);
        const listResp = await axios.get(
          `${API_BASE}/requests?search=${s}&limit=20`,
          { headers }
        );
        const listBody = listResp.data || {};
        const list = Array.isArray(listBody.data)
          ? listBody.data
          : Array.isArray(listBody)
          ? listBody
          : [];
        resp = { data: list[0] || null };
      }

      const data = resp.data || resp.data?.data || resp.data?.request || null;
      if (!data) {
        // Try mock
        const mock = mockRequests.find(
          (m) =>
            m.requestId === requestIdOrPON ||
            m.purchaseOrderNumber === requestIdOrPON
        );
        if (mock) {
          attachItemsFromExternalRequest(mock);
          setSelectedExternalRequest(mock);
          return;
        }
        alert("No matching request found.");
        return;
      }

      // normalize items array
      const extItems = data.items || data.data?.items || [];
      if (!extItems || extItems.length === 0) {
        alert("Selected request has no items to attach.");
        return;
      }
      attachItemsFromExternalRequest({
        requestId: data.requestId || data.id || data._id,
        items: extItems,
      });
      setSelectedExternalRequest({
        requestId: data.requestId || data.id || data._id,
      });
    } catch (err) {
      console.error("Error fetching external request:", err);
      alert("Failed to fetch external request (see console).");
    }
  };

  const attachItemsFromExternalRequest = (externalRequest) => {
    // append items from externalRequest into current items state
    const extId = externalRequest.requestId || externalRequest.requestId;
    const newItems = (externalRequest.items || []).map((it, idx) => ({
      // ensure unique id for demo
      id: `${extId || "EXT"}-${it.id || it.inventoryId || idx}-${Date.now()
        .toString()
        .slice(-4)}`,
      name: it.name || it.description || it.title || "Item",
      quantity: it.quantity || it.qty || 1,
      unit: it.unit || "pcs",
      unitPrice: it.unitPrice || it.price || "$0.00",
      total: it.total || it.totalPrice || "$0.00",
      _attached: true,
      _attachedFrom: extId || externalRequest.purchaseOrderNumber || "external",
    }));

    setItems((prev) => [...prev, ...newItems]);
    // scroll into view or give feedback
    alert(
      `${newItems.length} item(s) attached from ${extId || "external request"}.`
    );
  };

  // helper: if user types PON and presses Enter
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") {
        if (searchTerm.trim()) performSearch();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchTerm]);

  // ref to the requisition printable content
  const requisitionRef = useRef(null);

  const openPrintableWindow = (htmlContent, title = "Requisition") => {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      alert("Popup blocked — allow popups for this site to print or download.");
      return null;
    }
    const styles = `
      <style>
        body{font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color:#0f172a; margin:20px;}
        .header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
        .company{font-weight:700;font-size:18px}
        .meta{font-size:13px;color:#475569}
        table{width:100%;border-collapse:collapse;margin-top:12px}
        th,td{padding:8px;border:1px solid #e6e9ee;font-size:13px}
        th{background:#f8fafc;text-align:left}
        .right{text-align:right}
        .signature{margin-top:28px}
      </style>
    `;
    win.document.open();
    win.document.write(
      `<!doctype html><html><head><title>${title}</title>${styles}</head><body>${htmlContent}</body></html>`
    );
    win.document.close();
    return win;
  };

  const handlePrint = () => {
    if (!requisitionRef.current) return;
    const html = requisitionRef.current.innerHTML;
    const win = openPrintableWindow(html, `Requisition - ${request.id}`);
    if (win) {
      // give the window a moment to render then trigger print
      setTimeout(() => {
        win.focus();
        win.print();
      }, 300);
    }
  };

  const handleDownload = () => {
    // We reuse print flow: user can Save as PDF in the print dialog.
    handlePrint();
  };

  const handleShare = async () => {
    const shareText = `Requisition ${request.id} • ${request.title} • Requested by ${request.requester}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Requisition ${request.id}`,
          text: shareText,
        });
      } catch (err) {
        console.error("Share cancelled or failed", err);
      }
    } else {
      // Fallback: copy summary to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert(
          "Requisition details copied to clipboard (paste into chat/email to share)."
        );
      } catch (err) {
        alert("Share not supported on this browser.");
      }
    }
  };

  // Comments UI state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const COMMENTS_PER_PAGE = 3;
  const [commentsPage, setCommentsPage] = useState(1);

  useEffect(() => {
    setCommentsPage(1);
  }, [comments]);

  // derived values (use where rendering happens)
  const totalCommentPages = Math.max(
    1,
    Math.ceil((comments?.length || 0) / COMMENTS_PER_PAGE)
  );
  const paginatedComments = (comments || []).slice(
    (commentsPage - 1) * COMMENTS_PER_PAGE,
    commentsPage * COMMENTS_PER_PAGE
  );

  // small mock fallback for demo
  const mockComments = [
    {
      id: "c1",
      author: "John Smith",
      text: "Please ensure filters are available for immediate replacement.",
      createdAt: new Date().toISOString(),
    },
    {
      id: "c2",
      author: "Procurement Officer",
      text: "Noted. Will confirm supplier lead time before approval.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: "c2",
      author: "Procurement Officer",
      text: "Noted. Will confirm supplier lead time before approval.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ];

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const token = sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // try several id shapes used in the demo
      const id = request?.id || request?.requestId || "REQ-2024-001";
      const resp = await axios.get(
        `${API_BASE}/requests/${encodeURIComponent(id)}/comments`,
        { headers }
      );
      const data = resp?.data?.data ?? resp?.data ?? [];
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Failed to fetch comments, using mock:", err);
      setComments(mockComments);
    } finally {
      setCommentsLoading(false);
    }
  };

  const postComment = async () => {
    const text = (newComment || "").trim();
    if (!text) return;
    setPostingComment(true);
    // optimistic UI
    const temp = {
      id: `temp-${Date.now()}`,
      author: "You",
      text,
      createdAt: new Date().toISOString(),
      _temp: true,
    };
    setComments((c) => [temp, ...c]);
    setNewComment("");
    try {
      const token = sessionStorage.getItem("userToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const id = request?.id || request?.requestId || "REQ-2024-001";
      const resp = await axios.post(
        `${API_BASE}/requests/${encodeURIComponent(id)}/comments`,
        { text },
        { headers }
      );
      // replace temp comment with server response when available
      const created = resp?.data?.data ?? resp?.data ?? null;
      if (created) {
        setComments((prev) => [created, ...prev.filter((x) => !x._temp)]);
      } else {
        // keep optimistic but remove temp flag
        setComments((prev) =>
          prev.map((c) => (c.id === temp.id ? { ...c, _temp: false } : c))
        );
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      // rollback optimistic comment if desired (here we keep it and show error)
      alert("Failed to submit comment (demo fallback). Comment saved locally.");
    } finally {
      setPostingComment(false);
    }
  };

  // fetch comments when demo request mounts
  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, request?.requestId]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse delay-500" />

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
        <div
          className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          } flex flex-col`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Gemz Software</h1>
                <p className="text-gray-400 text-xs">Request Details</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
                <MdDashboard className="text-xl shrink-0" />
                <span className="font-medium text-sm">Overview</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                <MdPendingActions className="text-xl shrink-0" />
                <span className="font-medium text-sm">Request Details</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
                <MdCheckCircle className="text-xl shrink-0" />
                <span className="font-medium text-sm">Approved</span>
              </button>

              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-gray-800/50">
                <MdHistory className="text-xl shrink-0" />
                <span className="font-medium text-sm">History</span>
              </button>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-800/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-800/30">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                PO
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  Procurement Officer
                </p>
                <p className="text-gray-400 text-xs truncate">
                  officer@gemz.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 w-12 h-12 bg-[#0a0a0a] border border-gray-800/50 rounded-xl flex items-center justify-center text-white hover:bg-gray-900 transition-colors"
        >
          {isSidebarOpen ? (
            <IoMdClose className="text-2xl" />
          ) : (
            <IoMdMenu className="text-2xl" />
          )}
        </button>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl px-8 py-6 mb-8 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-slate-400 text-sm font-mono font-semibold">
                  {request.id}
                </span>
                <span
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${
                    request.type === "purchase-order"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                      : "bg-teal-500/20 text-teal-300 border-teal-400/30"
                  }`}
                >
                  {request.type === "purchase-order" ? (
                    <MdShoppingCart className="text-sm" />
                  ) : (
                    <MdAttachMoney className="text-sm" />
                  )}
                  <span>
                    {request.type === "purchase-order"
                      ? "Purchase Order"
                      : "Petty Cash"}
                  </span>
                </span>
                {request.priority === "urgent" && (
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse">
                    <span>⚠️ URGENT</span>
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm">
                Requested by{" "}
                <span className="text-white font-medium">
                  {request.requester}
                </span>{" "}
                on {request.date} at {request.time}
              </p>
            </div>

            {/* Workflow Progress */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-3xl px-8 py-6 mb-8 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-600 mb-6 uppercase tracking-wider">
                Request Workflow
              </h3>
              <div className="relative">
                {/* Progress Line - Behind icons */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 -z-10">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 w-1/6 transition-all duration-500" />
                </div>

                {/* Stages */}
                <div className="relative flex items-start justify-between">
                  {workflowStages.map((stage, index) => (
                    <div
                      key={stage.id}
                      className="flex flex-col items-center z-10"
                      style={{ width: "16.666%" }}
                    >
                      <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 text-xl font-bold transition-all duration-300 bg-white ${getStageColor(
                          stage.status
                        )}`}
                      >
                        {getStageIcon(stage.status)}
                      </div>
                      <p
                        className={`text-xs font-medium text-center leading-tight ${
                          stage.status === "completed"
                            ? "text-emerald-600"
                            : stage.status === "current"
                            ? "text-teal-600"
                            : "text-slate-400"
                        }`}
                      >
                        {stage.name}
                      </p>
                      {stage.status === "current" && (
                        <span className="mt-1 px-2 py-0.5 bg-teal-500/10 text-teal-600 text-[10px] font-semibold rounded-full">
                          IN PROGRESS
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Request Information - Compact Table Layout */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-8">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-3 border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Request Details
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {/* Row 1 */}
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Request ID
                  </p>
                  <p className="text-sm text-slate-900 font-semibold font-mono">
                    {request.id}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Requester
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.requester}
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
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Destination
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.destination}
                  </p>
                </div>

                {/* Row 2 */}
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Vessel
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.vessel}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Submitted Date
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.date}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Submitted Time
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    {request.time}
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Status
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    Pending Review
                  </p>
                </div>

                {/* Row 3 */}
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Priority
                  </p>
                  <p className="text-sm font-semibold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs ${
                        request.priority === "urgent"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {request.priority === "urgent" ? "URGENT" : "Normal"}
                    </span>
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Request Type
                  </p>
                  <p className="text-sm font-semibold">
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                      {request.type === "purchase-order"
                        ? "Purchase Order"
                        : "Petty Cash"}
                    </span>
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Company
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    HWFP Marine Services
                  </p>
                </div>
                <div className="px-4 py-3 border-b border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Cost Center
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    CC-2024-1105
                  </p>
                </div>

                {/* Row 4 */}
                <div className="px-4 py-3 border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Budget Code
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    BDG-MAR-Q4
                  </p>
                </div>
                <div className="px-4 py-3 border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Approval Level
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    Level 2 (Manager)
                  </p>
                </div>
                <div className="px-4 py-3 border-r border-slate-200">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Delivery Required
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    Within 7 Days
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-slate-500 font-medium mb-0.5">
                    Currency
                  </p>
                  <p className="text-sm text-slate-900 font-semibold">
                    NGN (₦)
                  </p>
                </div>
              </div>
            </div>

            {/* Quotation Upload - inserted ABOVE Requested Items */}
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
                        {quotationFile
                          ? "Quotation selected"
                          : "Drag & drop quotation here, or click to browse"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Accepted: PDF, JPG, PNG. Max (demo): 10MB
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
                      className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition"
                    >
                      Browse
                    </button>

                    {quotationFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleInputChange}
                    className="hidden"
                  />
                </div>

                {/* File preview & upload actions */}
                {quotationFile && (
                  <div className="mt-4 flex items-start gap-4">
                    <div className="w-20 h-20 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden border">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-slate-600 text-sm px-2 text-center">
                          {quotationFile.type === "application/pdf"
                            ? "PDF"
                            : "FILE"}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 truncate w-72">
                            {quotationFile.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(quotationFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpload();
                            }}
                            disabled={isUploading || uploadProgress === 100}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              isUploading || uploadProgress === 100
                                ? "bg-gray-200 text-slate-600 cursor-not-allowed"
                                : "bg-emerald-500 text-white hover:bg-emerald-600"
                            }`}
                          >
                            {isUploading
                              ? "Uploading..."
                              : uploadProgress === 100
                              ? "Uploaded"
                              : "Upload"}
                          </button>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 bg-emerald-500 transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {uploadProgress}%{" "}
                          {isUploading
                            ? "• processing"
                            : uploadProgress === 100
                            ? "• complete (demo)"
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* ===== End Quotation Upload ===== */}

            {/* Items List */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MdShoppingCart className="text-xl" />
                Requested Items
              </h3>
              <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-4 shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Item Description
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, index) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-medium text-slate-900">
                                {item.name}
                              </p>
                              {item._attached && (
                                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                  Attached ({item._attachedFrom})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <p className="text-sm text-slate-700 font-semibold">
                              {item.quantity}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
                              {item.unit}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm text-slate-700">
                              {item.unitPrice}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-slate-900">
                              {item.total}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

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
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      {newComment.length}/1000
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setNewComment("");
                        }}
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
                                    {c.author || "Unknown"}
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
                          onClick={() =>
                            setCommentsPage((p) => Math.max(1, p - 1))
                          }
                          disabled={commentsPage === 1}
                          className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50"
                        >
                          Prev
                        </button>

                        {Array.from({ length: totalCommentPages }).map(
                          (_, i) => {
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
                          }
                        )}

                        <button
                          onClick={() =>
                            setCommentsPage((p) =>
                              Math.min(totalCommentPages, p + 1)
                            )
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

            {/* Attached Files */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MdAttachFile className="text-xl" />
                Attached Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Request Form - open preview like Requisition */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openRequestFormPreview}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openRequestFormPreview();
                  }}
                  className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">📄</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-emerald-600">
                    Request Form.pdf
                  </p>
                  <p className="text-xs text-slate-500">245 KB</p>
                </div>

                {/* Requisition card - opens preview above content */}
                <div
                  onClick={openRequisition}
                  role="button"
                  tabIndex={0}
                  className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group shadow-lg"
                >
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-emerald-600">
                    Requisition File.xlsx
                  </p>
                  <p className="text-xs text-slate-500">128 KB</p>
                </div>

                {/* RequestForm Preview Modal (mirrors Requisition overlay) */}
                {showRequestFormPreview && (
                  <>
                    <div
                      className="fixed inset-0 bg-black/60 z-40"
                      onClick={closeRequestFormPreview}
                    />
                    <div className="fixed left-1/2 transform -translate-x-1/2 top-16 z-50 w-[95%] md:w-[80%] lg:w-[70%] max-h-[80vh] overflow-auto">
                      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        {/* NEW: wrap RequestForm so we can place the Send button top-left */}
                        <div className="relative">
                          <div className="absolute left-4 top-4 z-20">
                            <button
                              onClick={handleSendAsMailFromPreview}
                              className="px-3 py-2 bg-emerald-500 text-white rounded-lg shadow-md hover:bg-emerald-600 transition text-sm flex items-center gap-2"
                            >
                              ✉️ Send as Mail
                            </button>
                          </div>
                          <RequestForm request={request} items={items} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* NEW: Email Composer modal */}
                {showEmailComposer && (
                  <EmailComposer
                    initialAttachments={emailInitialAttachments}
                    subject={`Requisition ${request.id} • ${request.title}`}
                    onClose={() => setShowEmailComposer(false)}
                    onSent={() => {
                      setShowEmailComposer(false);
                      alert("Demo email sent (simulated).");
                    }}
                  />
                )}

                <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-xl p-4 hover:border-slate-400 transition-all cursor-pointer group shadow-lg">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3">
                    <span className="text-2xl">🖼️</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-emerald-600">
                    Quotation File.jpg
                  </p>
                  <p className="text-xs text-slate-500">892 KB</p>
                </div>
              </div>
            </div>

            {/* Requisition Preview Overlay (modern) */}
            {showRequisition && (
              <>
                <div
                  className="fixed inset-0-bg-black/40 z-40"
                  onClick={closeRequisition}
                />
                <div className="fixed left-1/2 transform -translate-x-1/2 top-16 z-50 w-[95%] md:w-[80%] lg:w-[70%] max-h-[80vh] overflow-auto">
                  {/* Card: the visual requisition (wrap with ref so we can print/download its content) */}
                  <div
                    ref={requisitionRef}
                    className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideDown"
                  >
                    {/* Modern header: logo/company left, meta right */}
                    <div className="px-6 py-4 border-b bg-gradient-to-r from-white to-slate-50">
                      <h2 className="text-2xl font-extrabold text-slate-900">
                        Requisition Form
                      </h2>
                    </div>
                    <div className="px-6 py-5 border-b">
                      <div className="grid gap-2 md:grid-cols-[1fr_250px] grid-cols-1 md:gap-4">
                        {/* Left: logo + company + address */}
                        <div className="flex flex-col items-start gap-4 min-w-0">
                          <div className="w-16 h-16 flex-shrink-0 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            G
                          </div>
                          <div className="min-w-0">
                            <div className="text-lg font-bold text-slate-900 leading-tight">
                              Hydrodive Nigeria Ltd
                            </div>
                            <div className="text-sm text-slate-500 mt-1 truncate">
                              17, Wharf Road, <br />
                              Apapa, Lagos <br />
                              Nigeria.
                              <br />
                            </div>
                            <div className="text-sm text-slate-500 mt-1 truncate">
                              234-1-2600562, 4600563, 4740509 <br />
                              4704686, 7749433, 9505023, 4631445
                              <br />
                            </div>
                          </div>
                        </div>

                        {/* Right: metadata */}
                        <div className="text-right shrink-0 flex flex-col justify-start items-start ">
                          <div className="flex justify-center items-center gap-2">
                            <div className=" font-semibold text-slate-900">
                              Number:{" "}
                            </div>
                            <div className=" text-sm text-slate-500">
                              {request.id}
                            </div>
                          </div>
                          <div className="flex justify-center items-center gap-2 ">
                            <div className="font-semibold text-slate-900">
                              {" "}
                              Date:
                            </div>
                            <div className="text-sm text-slate-500">
                              {request.date}
                            </div>
                          </div>

                          <div className="flex justify-center items-center gap-2 ">
                            <div className="font-semibold text-slate-900">
                              {" "}
                              Page:
                            </div>
                            <div className="text-sm text-slate-500">1 of 1</div>
                          </div>
                          <div className="flex justify-center items-center gap-2 ">
                            <div className="font-semibold text-slate-900 ">
                              {" "}
                              Required:
                            </div>
                            <div className="text-sm text-slate-500">
                              {request.date}
                            </div>
                          </div>
                          <div className="flex justify-center items-center gap-2 ">
                            <div className="font-semibold text-slate-900">
                              {" "}
                              Reference:
                            </div>
                            <div className="text-sm text-slate-500">1 of 1</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Issued To / Ship To boxes (from attached image) */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
                        <div className="text-sm font-semibold text-slate-800 mb-2">
                          Issued To:
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          AVL Integrated Technology Solution
                          {"\n"}Block B, Suite 366, Sura Shopping Complex
                          {"\n"}Ikeja
                          {"\n"}Lagos
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
                        <div className="text-sm font-semibold text-slate-800 mb-2">
                          Ship To:
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          Hydrodive Nigeria Limited
                          {"\n"}17, Wharf Road
                          {"\n"}Apapa
                          {"\n"}Lagos
                          {"\n"}Nigeria
                        </div>
                      </div>
                    </div>

                    {/* Title row */}

                    <div className="p-6 space-y-4">
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <h4 className="text-sm font-semibold mb-3">
                          Requisition Items
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-slate-500">
                                <th className="pb-2">#</th>
                                <th className="pb-2">Description</th>
                                <th className="pb-2">Qty</th>
                                <th className="pb-2">Unit</th>
                                <th className="pb-2 text-right">Unit Price</th>
                                <th className="pb-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {requestItems.map((it, i) => (
                                <tr key={it.id} className="py-2">
                                  <td className="py-3 text-slate-700">
                                    {i + 1}
                                  </td>
                                  <td className="py-3 text-slate-900">
                                    {it.name}
                                  </td>
                                  <td className="py-3 text-slate-700">
                                    {it.quantity}
                                  </td>
                                  <td className="py-3 text-slate-700">
                                    {it.unit}
                                  </td>
                                  <td className="py-3 text-right text-slate-700">
                                    {it.unitPrice}
                                  </td>
                                  <td className="py-3 text-right font-semibold text-slate-900">
                                    {it.total}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td
                                  colSpan={5}
                                  className="pt-4 text-right font-bold"
                                >
                                  Grand Total
                                </td>
                                <td className="pt-4 text-right text-xl font-bold">
                                  {request.amount}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      <div className="pt-4 border-t"></div>

                      {/* Electronic signature block */}
                      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-2">
                            Approved by
                          </p>
                          <div className="bg-white p-4 rounded-xl border border-slate-100 w-full max-w-md">
                            {/* simple signature SVG placeholder */}
                            <svg
                              width="240"
                              height="70"
                              viewBox="0 0 240 70"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M10 40 C40 10, 80 10, 110 40 S180 70, 230 40"
                                stroke="#036173"
                                strokeWidth="2.5"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <div className="mt-2">
                              <div className="text-sm font-semibold text-slate-900">
                                Procurement Officer
                              </div>
                              <div className="text-xs text-slate-500">
                                e-signature • {new Date().toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-right md:text-left">
                          <p className="text-xs text-slate-500">Contact</p>
                          <p className="font-semibold text-slate-900">
                            procurement@gemz.com
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Footer */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl px-8 py-6 shadow-lg sticky bottom-0">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-slate-600 text-sm">
                  Review the request details and take action
                </p>
                <div className="flex items-center gap-3">
                  <button className="px-6 h-12 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-200 flex items-center gap-2">
                    <MdCancel className="text-lg" />
                    Reject
                  </button>
                  <button className="px-6 h-12 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-amber-500/20">
                    <MdHelp className="text-lg" />
                    Query
                  </button>
                  <button className="px-6 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-200 flex items-center gap-2">
                    <MdCheckCircle className="text-lg" />
                    Approve Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailDemo;
