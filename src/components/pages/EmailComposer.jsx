import React, { useState, useRef, useEffect } from "react";
import { MdClose, MdAttachFile, MdSend, MdUploadFile } from "react-icons/md";

export default function EmailComposer({
  initialAttachments = [],
  subject = "",
  onClose = () => {},
  onSent = () => {},
}) {
  const [to, setTo] = useState(""); // user asked: leave it empty
  const [cc, setCc] = useState("");
  const [subj, setSubj] = useState(subject || "");
  const [body, setBody] = useState(
    `Hello,\n\nPlease find the attached request form (demo PDF).\n\nRegards,\nProcurement`
  );
  const [attachments, setAttachments] = useState(() => [...initialAttachments]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setAttachments([...initialAttachments]);
  }, [initialAttachments]);

  const handleAddFiles = (files) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 10); // cap for demo
    setAttachments((prev) => [...prev, ...arr]);
  };

  const onFileChange = (e) => {
    handleAddFiles(e.target.files);
    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const simulateSend = async () => {
    setSending(true);
    // demo progress simulation
    await new Promise((r) => setTimeout(r, 900));
    setSending(false);
    onSent();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-30">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
              G
            </div>
            <div>
              <div className="text-sm font-semibold">New Message</div>
              <div className="text-xs text-slate-500">
                Compose an email (demo)
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={simulateSend}
              disabled={sending}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold ${
                sending
                  ? "bg-gray-200 text-slate-600 cursor-not-allowed"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              <MdSend /> {sending ? "Sending..." : "Send"}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-slate-600 hover:bg-slate-100"
            >
              <MdClose />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="w-14 text-xs text-slate-500">To</label>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder=""
                className="flex-1 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-14 text-xs text-slate-500">CC</label>
              <input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Optional"
                className="flex-1 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="w-14 text-xs text-slate-500">Subject</label>
              <input
                value={subj}
                onChange={(e) => setSubj(e.target.value)}
                placeholder="Subject"
                className="flex-1 border border-slate-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />

          {/* Attachments area */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Attachments</div>
              <div className="text-xs text-slate-500">
                You can add files (optional)
              </div>
            </div>

            <div className="space-y-2">
              {attachments.length === 0 ? (
                <div className="text-xs text-slate-500">No attachments</div>
              ) : (
                attachments.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-slate-100 rounded-md p-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-md text-sm">
                        <MdAttachFile />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {f.name || `file-${i + 1}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          {f.size
                            ? (f.size / 1024 / 1024).toFixed(2) + " MB"
                            : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={
                          typeof f === "string" ? f : URL.createObjectURL(f)
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 hover:underline"
                        onClick={(e) => {
                          // revoke created objectURL after slight delay when opened
                          if (
                            !(f instanceof String) &&
                            !(typeof f === "string")
                          ) {
                            const obj = URL.createObjectURL(f);
                            e.currentTarget.href = obj;
                            setTimeout(() => URL.revokeObjectURL(obj), 2000);
                          }
                        }}
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => removeAttachment(i)}
                        className="text-xs text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-md bg-white border text-sm hover:bg-slate-50 flex items-center gap-2"
              >
                <MdUploadFile /> Add files
              </button>
              <div className="text-xs text-slate-400">Max 10 files (demo)</div>
            </div>
          </div>

          {/* Confidentiality / legal footer */}
          <div className="text-xs text-slate-400 leading-relaxed bg-white/80 p-3 rounded-md border border-slate-100">
            <div className="font-semibold text-slate-700 mb-1">
              Confidentiality Notice
            </div>
            <div>
              This email and any attachments are intended only for the
              addressee(s) and may contain confidential information. If you are
              not the intended recipient, please notify the sender immediately
              and delete this email. Any unauthorized review, use, disclosure,
              or distribution is prohibited.
            </div>
          </div>
        </div>

        {/* Footer (sticky) */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-white">
          <div className="text-xs text-slate-500">
            Draft saved locally (demo)
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border text-sm hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={simulateSend}
              disabled={sending}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                sending
                  ? "bg-gray-200 text-slate-600"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
