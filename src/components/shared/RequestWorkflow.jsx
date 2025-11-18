// src/components/workflow/RequestWorkflow.jsx

import React, { useRef, useState, useEffect } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const RequestWorkflow = ({ workflowPath }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  if (!workflowPath || workflowPath.length === 0) return null;

  // Determine if workflow should be centered (8 or fewer stages)
  const shouldCenter = workflowPath.length <= 8;

  const getStageColor = (status) => {
    switch (status) {
      case "completed":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
      case "current":
        return "text-teal-500 bg-teal-500/10 border-teal-500/30";
      case "future":
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
      case "future":
        return "⏳";
      default:
        return "⏳";
    }
  };

  // Extract role from state name if role is not provided
  const getRoleFromState = (stage) => {
    if (stage.role) {
      return stage.role;
    }

    const state = stage.state || "";

    const rolePatterns = [
      { pattern: /VESSEL_MANAGER/i, role: "Vessel Manager" },
      { pattern: /FLEET_MANAGER/i, role: "Fleet Manager" },
      { pattern: /PROCUREMENT_OFFICER/i, role: "Procurement Officer" },
      { pattern: /PROCUREMENT_MANAGER/i, role: "Procurement Manager" },
      { pattern: /ACCOUNTING_OFFICER/i, role: "Accounting Officer" },
      { pattern: /REQUESTER/i, role: "Requester" },
      { pattern: /IT_MANAGER/i, role: "IT Manager" },
      { pattern: /OPERATIONS_MANAGER/i, role: "Operations Manager" },
      { pattern: /HEAD_OF_PROCUREMENT/i, role: "Head of Procurement" },
      { pattern: /DIRECTOR/i, role: "Director" },
      { pattern: /CFO/i, role: "CFO" },
      { pattern: /MD/i, role: "Managing Director" },
      { pattern: /DELIVERY/i, role: "Delivery" },
      { pattern: /DRAFT/i, role: "Requester" },
      { pattern: /COMPLETED/i, role: "Completed" },
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



  // Check scroll position and update arrow visibility
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll functions
  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  // Check scroll on mount and when workflowPath changes
  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [workflowPath]);

  return (
    <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-3xl px-6 md:px-8 py-6 shadow-lg">
      <h3 className="text-sm font-semibold text-slate-600 mb-6 uppercase tracking-wider">
        Request Workflow
      </h3>

      <div className={`relative ${shouldCenter ? "px-4" : "px-12"}`}>
        {/* Left Scroll Arrow - Only show if not centered */}
        {!shouldCenter && showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute -left-4 top-6 z-20 w-10 h-10 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 hover:border-emerald-400 hover:scale-110 transition-all duration-200"
            aria-label="Scroll left"
          >
            <MdChevronLeft className="text-2xl text-slate-700" />
          </button>
        )}

        {/* Right Scroll Arrow - Only show if not centered */}
        {!shouldCenter && showRightArrow && (
          <button
            onClick={scrollRight}
            className="absolute -right-4 top-6 z-20 w-10 h-10 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 hover:border-emerald-400 hover:scale-110 transition-all duration-200"
            aria-label="Scroll right"
          >
            <MdChevronRight className="text-2xl text-slate-700" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className={`relative ${
            shouldCenter ? "overflow-x-visible" : "overflow-x-auto"
          } overflow-y-visible scrollbar-hide pb-4`}
          style={{
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
          }}
        >
          {/* Hide scrollbar for Chrome/Safari/Opera */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

         
          {/* Stages - Centered if 8 or fewer, otherwise left-aligned */}
          <div
            className={`relative flex items-start gap-2 ${
              shouldCenter ? "justify-center" : ""
            }`}
            style={{ minWidth: shouldCenter ? "auto" : "max-content" }}
          >
            {workflowPath.map((stage, index) => {
              const roleName = getRoleFromState(stage);

              return (
                <div
                  key={index}
                  className="flex flex-col items-center min-w-[100px] flex-shrink-0"
                >
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 text-xl font-bold transition-all duration-300 bg-white ${getStageColor(
                      stage.status
                    )}`}
                  >
                    {getStageIcon(stage.status)}
                  </div>

                  {/* Role */}
                  <p
                    className={`text-xs font-medium text-center leading-tight px-2 ${
                      stage.status === "completed"
                        ? "text-emerald-600"
                        : stage.status === "current"
                        ? "text-teal-600"
                        : "text-slate-400"
                    }`}
                  >
                    {roleName}
                  </p>

                  {/* "IN PROGRESS" badge */}
                  {stage.status === "current" && (
                    <span className="mt-1 px-2 py-0.5 bg-teal-500/10 text-teal-600 text-[10px] font-semibold rounded-full">
                      IN PROGRESS
                    </span>
                  )}

                  {/* User name */}
                  {stage.user &&
                    (stage.status === "completed" ||
                      stage.status === "current") && (
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
    </div>
  );
};

export default RequestWorkflow;
