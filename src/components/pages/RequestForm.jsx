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
    className="bg-white p-8 rounded-xl shadow max-w-2xl mx-auto border border-slate-300"
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
    <div className="flex justify-between items-center mt-4 mb-2">
      <div className="text-xs">
        Vendor Name: <span className="font-semibold">{demo.vendor}</span>
      </div>
      <div className="flex gap-6 text-xs">
        <div>
          P.O No.: <span className="font-semibold">{demo.poNo}</span>
        </div>
        <div>
          Reg No.: <span className="font-semibold">{demo.regNo}</span>
        </div>
        <div>
          Date: <span className="font-semibold">{demo.date}</span>
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
        {Array.from({ length: 20 }).map((_, idx) => (
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
    <div className="flex flex-wrap justify-between items-end gap-4 mt-8 text-xs">
      <div>
        <div>
          Approved by: <span className="font-semibold">{demo.approvedBy}</span>
        </div>
      </div>
      <div>
        <div>
          Received by: <span className="font-semibold">{demo.receivedBy}</span>
        </div>
        <div className="mt-2">
          Signed:
          <span
            className="inline-block align-middle ml-2"
            style={{
              fontFamily: "cursive",
              fontSize: 18,
              color: "#036173",
            }}
          >
            {/* Simulated signature */}
            Osi Ojo
          </span>
        </div>
        <div>
          Date: <span className="font-semibold">{demo.signDate}</span>
        </div>
      </div>
    </div>
  </div>
);

export default RequestForm;
