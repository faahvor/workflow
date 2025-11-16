// src/components/workflow/RequestWorkflow.jsx

import React, { useRef, useState, useEffect } from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const RequestWorkflow = ({ workflowPath }) => {
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  if (!workflowPath || workflowPath.length === 0) return null;

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

  // Calculate progress percentage
  const progressPercentage =
    (workflowPath.filter((s) => s.status === "completed").length / workflowPath.length) * 100;

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
      
      <div className="relative px-12">
        {/* Left Scroll Arrow - Now with left-0 positioning and proper spacing */}
        {showLeftArrow && (
          <button
            onClick={scrollLeft}
            className="absolute -left-4 top-6 z-20 w-10 h-10 bg-white border-2 border-slate-300 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-50 hover:border-emerald-400 hover:scale-110 transition-all duration-200"
            aria-label="Scroll left"
          >
            <MdChevronLeft className="text-2xl text-slate-700" />
          </button>
        )}

        {/* Right Scroll Arrow - Now with right-0 positioning and proper spacing */}
        {showRightArrow && (
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
          className="relative overflow-x-auto overflow-y-visible scrollbar-hide pb-4"
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

          {/* Progress Line */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200 -z-10">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Stages */}
          <div className="relative flex items-start gap-2" style={{ minWidth: "max-content" }}>
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
                  {stage.user && (stage.status === "completed" || stage.status === "current") && (
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