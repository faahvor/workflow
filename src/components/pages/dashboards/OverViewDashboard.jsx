// src/components/pages/dashboards/OverviewDashboard.jsx

import React, { useState } from "react";
import {
  MdPendingActions,
  MdShoppingCart,
  MdAttachMoney,
  MdCheckCircle,
  MdFilterList,
  MdExpandMore,
  MdHelp,
} from "react-icons/md";
import { IoMdSearch } from "react-icons/io";
import Approved from "./Approved";
import PendingRequestsList from "./PendingRequestList";
import QueriedRequest from "./QueriedRequest";

const OverviewDashboard = ({
  user,
  pendingRequests = [],
  approvedTodayCount = 0,
  queriedCount = 0,
  setActiveView = () => {},
  onViewDetails = () => {},
   onPendingUnreadChange = () => {},
}) => {
  // Get user role for future role-specific logic
  const userRole = (user?.role || "").toString().toLowerCase();

  // Track which card is selected (for delivery roles)
  const [selectedCard, setSelectedCard] = useState("pending");

  // Search and filter state for the list
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Calculate counts
  const pendingCount = pendingRequests.length;
  const purchaseOrderCount = pendingRequests.filter(
    (r) => r.requestType === "purchaseOrder"
  ).length;
  const pettyCashCount = pendingRequests.filter(
    (r) => r.requestType !== "purchaseOrder"
  ).length;

  // Check if user is a delivery role
  const isDeliveryRole =
    userRole === "deliverybase" ||
    userRole === "delivery base" ||
    userRole === "deliveryjetty" ||
    userRole === "delivery jetty" ||
    userRole === "deliveryvessel" ||
    userRole === "delivery vessel";

  // Handle card click for delivery roles
  const handleCardClick = (cardId) => {
    // Allow "pending", "approved", and "delivered" for delivery roles
    if (
      cardId !== "pending" &&
      cardId !== "approved" &&
      cardId !== "delivered" &&
      cardId !== "queried"
    )
      return;
    // Treat "delivered" as "approved" for the selectedCard state
    setSelectedCard(cardId === "delivered" ? "approved" : cardId);
    // Don't navigate sidebar here - just update the displayed list
  };

  // Handle view details - navigate sidebar AND open detail
  const handleViewDetailsWithNavigation = (request, cardType) => {
    // Use cardType instead of selectedCard
    if (cardType === "pending") {
      setActiveView("pending");
    } else if (cardType === "delivered" || cardType === "approved") {
      setActiveView("approved");
    } else if (cardType === "queried") {
      setActiveView("queried");
    }
  onViewDetails(request, cardType);
  };
  // Card definitions - customized per role
  const getCardsForRole = () => {
    if (isDeliveryRole) {
      // Delivery roles: only show Pending Delivery Approval and Delivered Requests
      return [
        {
          id: "pending",
          label: "Pending Delivery Approval",
          value: pendingCount,
          icon: MdPendingActions,
          bgColor: "bg-orange-500",
          shadowColor: "shadow-orange-500/20",
          targetView: "pending",
        },
        {
          id: "delivered",
          label: "Delivered Requests",
          value: approvedTodayCount,
          icon: MdCheckCircle,
          bgColor: "bg-purple-500",
          shadowColor: "shadow-purple-500/20",
          targetView: "approved",
        },
      ];
    }

    // Default cards for other roles
    return [
      {
        id: "pending",
        label: "Pending Requests",
        value: pendingCount,
        icon: MdPendingActions,
        bgColor: "bg-orange-500",
        shadowColor: "shadow-orange-500/20",
        clickable: true,
      },
      {
        id: "approved",
        label: "Approved PO",
        value: approvedTodayCount,
        icon: MdCheckCircle,
        bgColor: "bg-purple-500",
        shadowColor: "shadow-purple-500/20",
        clickable: true,
      },
      {
        id: "queried",
        label: "Queried Requests",
        value: queriedCount,
        icon: MdHelp,
        bgColor: "bg-amber-500",
        shadowColor: "shadow-amber-500/20",
        clickable: true,
      },
    ];
  };

  const visibleCards = getCardsForRole();

  // Determine grid columns based on number of cards
  const getGridClass = () => {
    const cardCount = visibleCards.length;
    if (cardCount === 2) {
      return "grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto";
    }
    if (cardCount === 3) {
      return "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-5xl mx-auto";
    }
    // 4 or more cards
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8";
  };

  return (
    <div>
      {/* Cards */}
      <div className={getGridClass()}>
        {visibleCards.map((card) => {
          const IconComponent = card.icon;

          const isClickable = card.clickable || isDeliveryRole;
          const isSelected =
            selectedCard === card.id ||
            // For delivery roles, highlight "delivered" card when selectedCard is "approved"
            (isDeliveryRole &&
              card.id === "delivered" &&
              selectedCard === "approved");

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`bg-white/90 backdrop-blur-xl border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 ${
                isClickable ? "cursor-pointer" : ""
              } ${
                isSelected
                  ? "border-emerald-500 ring-2 ring-emerald-500/30"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center shadow-lg ${card.shadowColor}`}
                >
                  <IconComponent className="text-2xl text-white" />
                </div>
                {/* Selected indicator for delivery roles */}
                {isSelected && isClickable && (
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </div>
              <p className="text-slate-500 text-sm mb-1 font-semibold">
                {card.label}
              </p>
              <p className="text-slate-900 text-3xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search and Filter - Only for delivery roles */}
      <>
        <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <IoMdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
              <input
                type="text"
                placeholder="Search by request ID, requester, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200"
              />
            </div>
            {/* <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-12 pl-12 pr-10 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 hover:border-slate-300 transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="purchaseOrder">Purchase Order</option>
                  <option value="pettycash">PettyCash</option>
                </select>
                <MdFilterList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" />
                <MdExpandMore className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xl" />
              </div> */}
          </div>
        </div>

        {/* Request List based on selected card */}
        {selectedCard === "pending" && (
          <PendingRequestsList
            searchQuery={searchQuery}
            filterType={filterType}
            requests={pendingRequests}
            onViewDetails={(request) =>
              handleViewDetailsWithNavigation(request, "pending")
            }
              onUnreadChange={onPendingUnreadChange} // <-- add this

          />
        )}

        {(selectedCard === "delivered" || selectedCard === "approved") && (
          <Approved
            searchQuery={searchQuery}
            filterType={filterType}
            onOpenDetail={(request) =>
              handleViewDetailsWithNavigation(request, "approved")
            }
          />
        )}
        {selectedCard === "queried" && (
          <QueriedRequest
            searchQuery={searchQuery}
            filterType={filterType}
            onOpenDetail={(request) =>
              handleViewDetailsWithNavigation(request, "queried")
            }
          />
        )}
      </>
    </div>
  );
};

export default OverviewDashboard;
