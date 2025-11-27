import React, { useRef } from "react";
import { MdShoppingCart } from "react-icons/md";

/*
  RequestForm - preview-only component
  - Displays Request Details, Requested Items table and signature
  - Props:
     - request: object with request metadata (fallback to demo)
     - items: array of items (fallback to demo requestItems)
*/

const formatDate = (d) => {
  if (!d) return "N/A";
  const dt = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString();
};

const RequestForm = ({ request: reqProp, items: itemsProp }) => {
  // Demo fallback data (kept minimal)
  const demoRequest = {
    requestId: "REQ-2024-001",
    id: "REQ-2024-001",
    type: "purchase-order",
    requestType: "purchaseOrder",
    title: "Marine Engine Parts",
    requester: "John Smith",
    department: "Marine",
    destination: "IT",
    vessel: "MV Ocean Star",
    amount: "$15,450",
    priority: "urgent",
    date: "2024-11-14",
    createdAt: "2024-11-14T09:30:00Z",
    time: "09:30 AM",
    company: { name: "HWFP Marine Services" },
    costCenter: "CC-2024-1105",
    budgetCode: "BDG-MAR-Q4",
    approvalLevel: "Level 2 (Manager)",
    deliveryRequired: "Within 7 Days",
    currency: "NGN (₦)",
    jobNumber: "N/A",
    assetId: "N/A",
  };

  const demoItems = [
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
  ];

  const request = { ...demoRequest, ...(reqProp || {}) };

  // normalize request id field
  const requestId = request.requestId || request.id || "N/A";
  const submittedDate = formatDate(request.createdAt || request.date);
  const submittedTime = request.time || "";

  const items = itemsProp && itemsProp.length ? itemsProp : demoItems;

  const requisitionRef = useRef(null);

  return (
    <div
      // make the preview fill the modal container (no max-width / centering)
      className="p-6 bg-white rounded-2xl shadow-lg w-full"
      ref={requisitionRef}
    >
      {/* Company header: logo, name, address */}
      <div className="text-center mb-8">
        <div className="mx-auto w-28 h-28 flex items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600">
          {request.company?.logoUrl ? (
            <img
              src={request.company.logoUrl}
              alt={request.company?.name || "Company Logo"}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-white text-3xl font-bold">G</div>
          )}
        </div>

        <div className="mt-3">
          <div className="text-lg font-bold text-slate-900">
            {request.company?.name || "HWFP Marine Services"}
          </div>
          <div className="text-sm text-slate-500 mt-1">
            {request.company?.address ||
              "17, Wharf Road, Apapa, Lagos, Nigeria"}
          </div>
        </div>
      </div>

      {/* Request Information - Compact Table Layout (copied from RequestDetailDemo) */}
      <div className="bg-white/90 backdrop-blur-xl border-2 border-slate-200 rounded-2xl overflow-hidden shadow-lg mb-6">
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
              {requestId}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Requester
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {typeof request.requester === "object"
                ? request.requester.displayName || request.requester.name
                : request.requester || "N/A"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Department
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.department || "N/A"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Destination
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.destination || request.destinationPort || "N/A"}
            </p>
          </div>

          {/* Row 2 */}
          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Vessel</p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.vessel ||
                request.vesselName ||
                request.vesselId ||
                "N/A"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Submitted Date
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {submittedDate}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Submitted Time
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {submittedTime || ""}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Status</p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.status || request.state || "Pending Review"}
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
                  String(request.priority || "").toLowerCase() === "urgent"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {String(request.priority || "").toLowerCase() === "urgent"
                  ? "URGENT"
                  : request.priority
                  ? request.priority
                  : "Normal"}
              </span>
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Request Type
            </p>
            <p className="text-sm font-semibold">
              <span className="inline-block px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700">
                {request.requestType === "purchaseOrder" ||
                request.type === "purchase-order"
                  ? "Purchase Order"
                  : "Petty Cash"}
              </span>
            </p>
          </div>

          <div className="px-4 py-3 border-b border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">Company</p>
            <p className="text-sm text-slate-900 font-semibold">
              {(request.company && request.company.name) ||
                request.companyName ||
                "HWFP Marine Services"}
            </p>
          </div>

          <div className="px-4 py-3 border-b border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Cost Center
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.costCenter || request.cost_center || "CC-2024-1105"}
            </p>
          </div>

          {/* Row 4 */}
          <div className="px-4 py-3 border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Budget Code
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.budgetCode || request.budget_code || "BDG-MAR-Q4"}
            </p>
          </div>

          <div className="px-4 py-3 border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Approval Level
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.approvalLevel || "Level 2 (Manager)"}
            </p>
          </div>

          <div className="px-4 py-3 border-r border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Delivery Required
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.deliveryRequired || "Within 7 Days"}
            </p>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              Currency
            </p>
            <p className="text-sm text-slate-900 font-semibold">
              {request.currency || "NGN (₦)"}
            </p>
          </div>
        </div>
      </div>

      {/* Requested Items table (copied from demo) */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <MdShoppingCart /> Requested Items
        </h3>

        <div className="bg-white border rounded-xl p-3">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it, i) => (
                  <tr key={it.id || i}>
                    <td className="px-3 py-2 align-top">{i + 1}</td>
                    <td className="px-3 py-2 align-top text-slate-900">
                      {it.name}
                    </td>
                    <td className="px-3 py-2 align-top">{it.quantity}</td>
                    <td className="px-3 py-2 align-top">{it.unit || "N/A"}</td>
                    <td className="px-3 py-2 align-top text-right text-slate-700">
                      {it.unitPrice || "-"}
                    </td>
                    <td className="px-3 py-2 align-top text-right font-semibold text-slate-900">
                      {it.total || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="pt-4 text-right font-bold">
                    Grand Total
                  </td>
                  <td className="pt-4 text-right text-lg font-bold">
                    {request.amount || ""}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Signature block */}
      <div className="pt-6 border-t">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-2">Approved by</div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 w-full max-w-md">
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
            <div className="text-xs text-slate-500">Contact</div>
            <div className="font-semibold text-slate-900">
              procurement@gemz.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;
