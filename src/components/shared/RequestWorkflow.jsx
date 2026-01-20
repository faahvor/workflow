import React, { useRef, useState, useEffect } from "react";
import { MdChevronLeft, MdChevronRight, MdExpandMore, MdExpandLess } from "react-icons/md";

const RequestWorkflow = ({ 
  workflowPath, 
  internationalWorkflowPath = null,
  showInternationalToggle = false,
  onToggleInternational = null,
  loadingInternational = false
}) => {
  const scrollContainerRef = useRef(null);
  const intlScrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showIntlLeftArrow, setShowIntlLeftArrow] = useState(false);
  const [showIntlRightArrow, setShowIntlRightArrow] = useState(false);
  const [showInternational, setShowInternational] = useState(false);

  if (!workflowPath || workflowPath.length === 0) return null;

  // Determine if workflow should be centered (8 or fewer stages)
  const visibleStages = (workflowPath || []).filter(
    (s) => (s.role || "").toUpperCase() !== "SYSTEM"
  );

  const visibleIntlStages = (internationalWorkflowPath || []).filter(
    (s) => (s.role || "").toUpperCase() !== "SYSTEM"
  );

  const shouldCenter = visibleStages.length <= 8;
  const shouldCenterIntl = visibleIntlStages.length <= 8;

  // Auto-show international flow when data is loaded
  useEffect(() => {
    if (internationalWorkflowPath && internationalWorkflowPath.length > 0) {
      setShowInternational(true);
    }
  }, [internationalWorkflowPath]);

  const getStageColor = (status, mode) => {
    if (mode === "queried" && status === "current") {
      return "text-indigo-600 bg-indigo-100 border-indigo-300 ring-2 ring-indigo-200";
    }
    if (mode === "querying" && status === "waiting") {
      return "text-gray-400 bg-gray-100 border-gray-300 border-dashed animate-pulse";
    }
    switch (status) {
      case "completed":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
      case "current":
        return "text-yellow-600 bg-yellow-100 border-yellow-300";
      case "future":
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
      case "waiting":
        return "text-gray-400 bg-gray-100 border-gray-300 border-dashed";
      default:
        return "text-gray-400 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getStageIcon = (status, mode) => {
    if (mode === "queried" && status === "current") return "❓";
    if (mode === "querying" && status === "waiting") return "⏳";
    switch (status) {
      case "completed":
        return "✓";
      case "current":
        return "⏱";
      case "future":
        return "⏳";
      case "waiting":
        return "⏳";
      default:
        return "⏳";
    }
  };

  const getRoleFromState = (stage) => {
    if (stage.role) {
      return stage.role;
    }

    const state = stage.state || "";

    const rolePatterns = [
      { pattern: /DIRECTOR_OF_OPERATIONS|DIRECTOR OF OPERATIONS|DIRECTOROFOPERATIONS/i, role: "Director of Operations" },
      { pattern: /MANAGING_DIRECTOR|MANAGING DIRECTOR|MANAGINGDIRECTOR|^MD$/i, role: "Managing Director" },
      { pattern: /HEAD_OF_PROCUREMENT/i, role: "Head of Procurement" },
      { pattern: /PROCUREMENT_MANAGER/i, role: "Procurement Manager" },
      { pattern: /PROCUREMENT_OFFICER/i, role: "Procurement Officer" },
      { pattern: /OPERATIONS_MANAGER/i, role: "Operations Manager" },
      { pattern: /ACCOUNTING_OFFICER/i, role: "Accounting Officer" },
      { pattern: /VESSEL_MANAGER/i, role: "Vessel Manager" },
      { pattern: /FLEET_MANAGER/i, role: "Fleet Manager" },
      { pattern: /IT_MANAGER/i, role: "IT Manager" },
      { pattern: /REQUESTER/i, role: "Requester" },
      { pattern: /DELIVERY/i, role: "Delivery" },
      { pattern: /DRAFT/i, role: "Requester" },
      { pattern: /COMPLETED/i, role: "Completed" },
      { pattern: /DIRECTOR/i, role: "Director" },
      { pattern: /CFO/i, role: "CFO" },
    ];

    for (const { pattern, role } of rolePatterns) {
      if (pattern.test(state)) {
        return role;
      }
    }

    return state
      .replace(/PENDING_/gi, "")
      .replace(/_APPROVAL/gi, "")
      .replace(/_2/gi, " (2nd)")
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const checkIntlScroll = () => {
    const container = intlScrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowIntlLeftArrow(scrollLeft > 10);
    setShowIntlRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const scrollIntlLeft = () => {
    intlScrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollIntlRight = () => {
    intlScrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  const handleToggle = () => {
    if (showInternational) {
      // Hide international flow
      setShowInternational(false);
    } else {
      // Trigger the parent's toggle function to load data
      if (onToggleInternational) {
        onToggleInternational();
      }
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [workflowPath]);

  useEffect(() => {
    if (showInternational) {
      checkIntlScroll();
      window.addEventListener("resize", checkIntlScroll);
      return () => window.removeEventListener("resize", checkIntlScroll);
    }
  }, [showInternational, internationalWorkflowPath]);

  const renderWorkflowStages = (stages, isCentered, scrollRef, showLeft, showRight, onScrollLeft, onScrollRight) => (
    <div className={`relative ${isCentered ? "px-4" : "px-12"}`}>
      {!isCentered && showLeft && (
        <button
          onClick={onScrollLeft}
          className="absolute -left-4 top-6 z-20 w-10 h-10 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 hover:border-emerald-400 hover:scale-110 transition-all duration-200"
          aria-label="Scroll left"
        >
          <MdChevronLeft className="text-2xl text-slate-700" />
        </button>
      )}

      {!isCentered && showRight && (
        <button
          onClick={onScrollRight}
          className="absolute -right-4 top-6 z-20 w-10 h-10 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 hover:border-emerald-400 hover:scale-110 transition-all duration-200"
          aria-label="Scroll right"
        >
          <MdChevronRight className="text-2xl text-slate-700" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={() => {
          if (scrollRef === scrollContainerRef) checkScroll();
          else checkIntlScroll();
        }}
        className={`relative ${
          isCentered ? "overflow-x-visible" : "overflow-x-auto"
        } overflow-y-visible scrollbar-hide pb-4`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div
          className={`relative flex items-start gap-2 ${
            isCentered ? "justify-center" : ""
          }`}
          style={{ minWidth: isCentered ? "auto" : "max-content" }}
        >
          {stages.map((stage, index) => {
            const roleName = getRoleFromState(stage);
            const mode = stage.mode || "standard";
            const status = stage.status || "future";

            return (
              <div
                key={index}
                className="flex flex-col items-center min-w-[100px] flex-shrink-0"
              >
                <div
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 text-xl font-bold transition-all duration-300 bg-white ${getStageColor(
                    status,
                    mode
                  )}`}
                >
                  {getStageIcon(status, mode)}
                </div>

                <p
                  className={`text-xs font-medium text-center leading-tight px-2 ${
                    status === "completed"
                      ? "text-emerald-600"
                      : status === "current" && mode === "queried"
                      ? "text-indigo-600"
                      : status === "current"
                      ? "text-yellow-600"
                      : status === "waiting" && mode === "querying"
                      ? "text-gray-400"
                      : "text-slate-400"
                  }`}
                >
                  {roleName}
                </p>

                {status === "current" && mode === "standard" && (
                  <span className="mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-semibold rounded-full">
                    IN PROGRESS
                  </span>
                )}
                {status === "current" && mode === "queried" && (
                  <span className="mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-full">
                    QUERIED
                  </span>
                )}
                {status === "waiting" && mode === "querying" && (
                  <span className="mt-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded-full border border-dashed border-gray-300">
                    WAITING FOR REPLY
                  </span>
                )}

                {stage.user &&
                  (status === "completed" ||
                    status === "current" ||
                    (status === "waiting" && mode === "querying")) && (
                    <p className="text-[9px] text-slate-500 mt-1 text-center truncate w-full px-1">
                      {stage.user.displayName}
                    </p>
                  )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-3xl px-6 md:px-8 py-6 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-600 mb-6 uppercase tracking-wider">
        Request Workflow
      </h3>

      {renderWorkflowStages(
        visibleStages,
        shouldCenter,
        scrollContainerRef,
        showLeftArrow,
        showRightArrow,
        scrollLeft,
        scrollRight
      )}

      {/* International Flow Toggle and Display */}
      {showInternationalToggle && (
        <div className="mt-8 border-t-2 border-slate-200 pt-6">
          <button
            onClick={handleToggle}
            disabled={loadingInternational}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors mb-4 disabled:opacity-50"
          >
            {loadingInternational ? (
              <>
                <span className="animate-spin">⏳</span>
                Loading International Flow...
              </>
            ) : showInternational ? (
              <>
                <MdExpandLess className="text-xl" />
                Hide International Flow
              </>
            ) : (
              <>
                <MdExpandMore className="text-xl" />
                View International Flow
              </>
            )}
          </button>

          {showInternational && internationalWorkflowPath && (
            <>
              <h4 className="text-sm font-semibold text-slate-600 mb-6 uppercase tracking-wider">
                International Flow
              </h4>
              {renderWorkflowStages(
                visibleIntlStages,
                shouldCenterIntl,
                intlScrollContainerRef,
                showIntlLeftArrow,
                showIntlRightArrow,
                scrollIntlLeft,
                scrollIntlRight
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RequestWorkflow;