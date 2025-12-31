import React from "react";

// Demo data matching the image
const demo = {
  vendor: "Rylako International Services",
  poNo: "267601",
  regNo: "827-01-23",
  date: "4-12-2023",
  items: [
    { sn: 1, desc: "Kevlar gloves XL", qty: 4 },
    { sn: 2, desc: "Kevlar gloves XXL", qty: 6 },
  ],
  approvedBy: "Udeme Saturday",
  receivedBy: "Osi Ojo",
  signed: "Osi Ojo",
  signDate: "4-12-2023",
};

const RequestForm = () => (
  <div
    className="bg-white p-8 rounded-xl shadow max-w-4xl mx-auto border border-slate-300"
    style={{ fontFamily: "Arial, sans-serif" }}
  >
    
    {/* Header */}
    <div className="flex justify-between items-start mb-2">
      <div>
        <div
          className="text-2xl font-bold text-sky-700"
          style={{ fontFamily: "Segoe UI, Arial, sans-serif" }}
        >
          HydroDive
        </div>
        <div className="text-xs mt-1 text-slate-700">
          17, WHARF ROAD, APAPA, LAGOS-NIGERIA
          <br />
          TEL: +234-1-5450946, +234-1-5870946
          <br />
          0700HYDRODIVE FAX: 4611443
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs font-semibold text-slate-700">
          GOODS RECEIVED NOTE
        </div>
        <div className="text-xs text-slate-500 mt-1">
          NO:{" "}
          <span
            className="inline-block min-w-[60px] border-b border-slate-400 align-middle"
            style={{ letterSpacing: 2 }}
          >
            3021359
          </span>
        </div>
      </div>
    </div>
    {/* Vendor and PO info */}
    <div className="flex justify-between items-start mt-4 mb-2 gap-4">
      {/* Vendor Name box */}
      <div className="border border-slate-400 rounded-sm p-2 flex-1 max-w-[60%]">
        <div
          className="text-[11px] text-slate-700 mb-1"
          style={{ lineHeight: 4 }}
        >
          Vendor Name:
        </div>
        <div
          className="text-[13px] font-medium"
          style={{
            fontFamily: "cursive",
            borderBottom: "1px solid #bbb",
            minHeight: 22,
            paddingBottom: 2,
            color: "#444",
          }}
        >
          {demo.vendor}
        </div>
      </div>
      {/* PO/Reg/Date box */}
      <div className="border border-slate-400 rounded-sm p-2 flex flex-col min-w-[210px]">
        <div
          className="flex items-center text-[11px] text-slate-700 mb-1"
          style={{ lineHeight: 1 }}
        >
          <span className="mr-2">P.O No.:</span>
          <span
            className="text-[13px] font-medium flex-1"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minWidth: 40,
              minHeight: 20,
              paddingBottom: 2,
              color: "#444",
            }}
          >
            {demo.poNo}
          </span>
        </div>
        <div
          className="flex items-center text-[11px] text-slate-700 mb-1"
          style={{ lineHeight: 1 }}
        >
          <span className="mr-2">Reg No.:</span>
          <span
            className="text-[13px] font-medium flex-1"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minWidth: 60,
              minHeight: 20,
              paddingBottom: 2,
              color: "#444",
            }}
          >
            {demo.regNo}
          </span>
        </div>
        <div
          className="flex items-center text-[11px] text-slate-700"
          style={{ lineHeight: 1 }}
        >
          <span className="mr-2">Date:</span>
          <span
            className="text-[13px] font-medium flex-1"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minWidth: 60,
              minHeight: 20,
              paddingBottom: 2,
              color: "#444",
            }}
          >
            {demo.date}
          </span>
        </div>
      </div>
    </div>
    {/* Table */}
    <table
      className="w-full border border-slate-400 text-xs mt-2 mb-8"
      cellPadding={0}
      cellSpacing={0}
    >
      <thead>
        <tr className="bg-slate-100">
          <th className="border border-slate-400 px-2 py-1 w-8">S/N</th>
          <th className="border border-slate-400 px-2 py-1">Description</th>
          <th className="border border-slate-400 px-2 py-1 w-12">Qty</th>
          <th className="border border-slate-400 px-2 py-1 w-16"></th>
        </tr>
      </thead>
      <tbody>
        {demo.items.map((item, idx) => (
          <tr key={idx}>
            <td className="border border-slate-400 px-2 py-1 text-center">
              {item.sn}
            </td>
            <td className="border border-slate-400 px-2 py-1">{item.desc}</td>
            <td className="border border-slate-400 px-2 py-1 text-center">
              {item.qty}
            </td>
            <td className="border border-slate-400 px-2 py-1"></td>
          </tr>
        ))}
        {/* Add 20 empty rows */}
        {Array.from({ length: 10 }).map((_, idx) => (
          <tr key={`empty-${idx}`}>
            <td className="border border-slate-400 px-2 py-4 text-center">
              {idx + 3}
            </td>
            <td className="border border-slate-400 px-2 py-4"></td>
            <td className="border border-slate-400 px-2 py-4 text-center"></td>
            <td className="border border-slate-400 px-2 py-4"></td>
          </tr>
        ))}
        {/* Diagonal line */}
        <tr>
          <td colSpan={4} className="relative p-0" style={{ height: 80 }}>
            <svg
              width="100%"
              height="80"
              style={{ position: "absolute", left: 0, top: 0 }}
            >
              <line
                x1="0"
                y1="80"
                x2="100%"
                y2="0"
                stroke="#888"
                strokeWidth="1"
              />
            </svg>
          </td>
        </tr>
      </tbody>
    </table>
    {/* Footer */}
    <div className="grid grid-cols-2 gap-[4rem] mt-8 text-xs">
      {/* Left: Approved by */}
      <div>
        <div className="mb-4">
          <div className="mb-1 text-slate-700">Approved by:</div>
          <div
            className="text-[15px]"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minHeight: 22,
              paddingBottom: 2,
              color: "#444",
              width: "80%",
            }}
          >
            {demo.approvedBy}
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-1 text-slate-700">Signed:</div>
          <div
            style={{
              borderBottom: "1px solid #bbb",
              minHeight: 22,
              paddingBottom: 2,
              width: "80%",
            }}
          >
            {/* Simulated signature scribble */}
            <svg width="80" height="28" style={{ display: "block" }}>
              <path
                d="M5 20 Q20 5 35 20 Q50 35 75 10"
                stroke="#036173"
                strokeWidth="2"
                fill="none"
              />
              <text
                x="40"
                y="25"
                fontSize="10"
                fill="#036173"
                fontFamily="cursive"
              >
                U.S.
              </text>
            </svg>
          </div>
        </div>
        <div>
          <div className="mb-1 text-slate-700">Date:</div>
          <div
            className="text-[15px]"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minHeight: 22,
              paddingBottom: 2,
              color: "#444",
              width: "80%",
            }}
          >
            {demo.signDate}
          </div>
        </div>
      </div>
      {/* Right: Received by */}
      <div>
        <div className="mb-4">
          <div className="mb-1 text-slate-700">Received by:</div>
          <div
            className="text-[15px]"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minHeight: 22,
              paddingBottom: 2,
              color: "#444",
              width: "80%",
            }}
          >
            {demo.receivedBy}
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-1 text-slate-700">Signed:</div>
          <div
            style={{
              borderBottom: "1px solid #bbb",
              minHeight: 22,
              paddingBottom: 2,
              width: "80%",
            }}
          >
            {/* Simulated signature scribble */}
            <svg width="80" height="28" style={{ display: "block" }}>
              <path
                d="M10 18 Q30 2 50 18 Q60 28 75 5"
                stroke="#036173"
                strokeWidth="2"
                fill="none"
              />
              <text
                x="45"
                y="25"
                fontSize="10"
                fill="#036173"
                fontFamily="cursive"
              >
                O.O.
              </text>
            </svg>
          </div>
        </div>
        <div>
          <div className="mb-1 text-slate-700">Date:</div>
          <div
            className="text-[15px]"
            style={{
              fontFamily: "cursive",
              borderBottom: "1px solid #bbb",
              minHeight: 22,
              paddingBottom: 2,
              color: "#444",
              width: "80%",
            }}
          >
            {demo.signDate}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default RequestForm;
