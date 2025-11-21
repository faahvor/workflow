import React, { forwardRef } from "react";

const formatCurrency = (v, currency = "NGN") => {
  const n = Number(v || 0).toFixed(2);
  return `${currency} ${Number(n).toLocaleString()}`;
};

const RequisitionPreview = forwardRef(({ request = {}, items = [] }, ref) => {
  const requestId = request.requestId || request.id || "N/A";
  const createdAt = request.createdAt ? new Date(request.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString();
  const requiredDate = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString();
  const reference = request.reference || "N/A";
  const total = items.reduce((s, it) => s + (Number(it.total || it.unitPrice || 0) || 0), 0);

  return (
    <div ref={ref} className="bg-white p-6 print:p-8 text-slate-900">
      <div className="px-4 py-4 border-b bg-gradient-to-r from-white to-slate-50">
        <h2 className="text-2xl font-extrabold">Requisition Form</h2>
      </div>

      <div className="px-6 py-5 border-b">
        <div className="grid gap-2 md:grid-cols-[1fr_250px] grid-cols-1 md:gap-4">
          <div className="flex flex-col items-start gap-4 min-w-0">
            <div className="w-16 h-16 flex-shrink-0 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              G
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight">Hydrodive Nigeria Ltd</div>
              <div className="text-sm text-slate-500 mt-1 leading-relaxed">
                17, Wharf Road, <br />
                Apapa, Lagos <br />
                Nigeria.
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 flex flex-col justify-start items-start">
            <div className="flex justify-center items-center gap-2">
              <div className="font-semibold">Number:</div>
              <div className="text-sm text-slate-500">{requestId}</div>
            </div>
            <div className="flex justify-center items-center gap-2 mt-1">
              <div className="font-semibold">Date:</div>
              <div className="text-sm text-slate-500">{dateStr}</div>
            </div>
            <div className="flex justify-center items-center gap-2 mt-1">
              <div className="font-semibold">Page:</div>
              <div className="text-sm text-slate-500">1 of 1</div>
            </div>
            <div className="flex justify-center items-center gap-2 mt-1">
              <div className="font-semibold">Required:</div>
              <div className="text-sm text-slate-500">{requiredDate}</div>
            </div>
            <div className="flex justify-center items-center gap-2 mt-1">
              <div className="font-semibold">Reference:</div>
              <div className="text-sm text-slate-500">{reference}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
          <div className="text-sm font-semibold text-slate-800 mb-2">Issued To:</div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            AVL Integrated Technology Solution
            {"\n"}Block B, Suite 366, Sura Shopping Complex
            {"\n"}Ikeja
            {"\n"}Lagos
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-300">
          <div className="text-sm font-semibold text-slate-800 mb-2">Ship To:</div>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            Hydrodive Nigeria Limited
            {"\n"}17, Wharf Road
            {"\n"}Apapa
            {"\n"}Lagos
            {"\n"}Nigeria
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h4 className="text-sm font-semibold mb-3">Requisition Items</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2">Unit</th>
                  <th className="pb-2 text-right">Unit Price</th>
                  <th className="pb-2 text-right">Discount</th>
                  <th className="pb-2 text-right">VAT</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((it, i) => (
                  <tr key={it.itemId || i} className="py-2">
                    <td className="py-3 text-slate-700">{i + 1}</td>
                    <td className="py-3 text-slate-900">{it.name}</td>
                    <td className="py-3 text-slate-700">{it.quantity}</td>
                    <td className="py-3 text-slate-700">{it.unit || "pcs"}</td>
                    <td className="py-3 text-right text-slate-700">{formatCurrency(it.unitPrice, request.currency)}</td>
                    <td className="py-3 text-right text-slate-700">{it.discount ? formatCurrency(it.discount, request.currency) : "-"}</td>
                    <td className="py-3 text-right text-slate-700">{it.vat ? `${it.vat}%` : "-"}</td>
                    <td className="py-3 text-right font-semibold text-slate-900">{formatCurrency(it.total || (it.unitPrice * it.quantity), request.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} className="pt-4 text-right font-bold">Grand Total</td>
                  <td className="pt-4 text-right text-xl font-bold">{formatCurrency(total, request.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="pt-4 border-t"></div>

        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex-1">
            <p className="text-xs text-slate-500 mb-2">Approved by</p>
            <div className="bg-white p-4 rounded-xl border border-slate-100 w-full max-w-md">
              <svg width="240" height="70" viewBox="0 0 240 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 40 C40 10, 80 10, 110 40 S180 70, 230 40" stroke="#036173" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-2">
                <div className="text-sm font-semibold">Procurement Officer</div>
                <div className="text-xs text-slate-500">e-signature • {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="text-right md:text-left">
            <p className="text-xs text-slate-500">Contact</p>
            <p className="font-semibold text-slate-900">procurement@gemz.com</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default RequisitionPreview;