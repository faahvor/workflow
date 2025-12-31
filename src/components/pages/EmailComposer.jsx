import React, { useState, useRef, useEffect } from "react";
import { MdClose, MdAttachFile, MdSend, MdUploadFile } from "react-icons/md";

export default function EmailComposer({
    initialAttachments = [],
  subject = "",
  userEmail = "",
  token = "",
  docType = "",
  userRole = "",
  purchaseOrderNumber = "",
  onClose = () => {},
  onSent = () => {},
}) {
  const [to, setTo] = useState(""); // user asked: leave it empty
  const [cc, setCc] = useState("");
  const [subj, setSubj] = useState(subject || "");
  const [toInput, setToInput] = useState("");
const [toList, setToList] = useState([]);
const [ccInput, setCcInput] = useState("");
const [ccList, setCcList] = useState([]);
const [replyTo, setReplyTo] = useState(userEmail || "");
const [replyToInput, setReplyToInput] = useState(replyTo || "");
const [replyToList, setReplyToList] = useState([]);
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function handleInputChange(setInput, value) {
  setInput(value);
}

function handleInputKeyDown(e, input, setInput, list, setList) {
  if (
    e.key === "Enter" ||
    e.key === "," ||
    e.key === "Tab"
  ) {
    e.preventDefault();
    addEmailsFromInput(input, setInput, list, setList);
  }
}

function addEmailsFromInput(input, setInput, list, setList) {
  const emails = input
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  const validEmails = emails.filter(isValidEmail);
  if (validEmails.length > 0) {
    setList([...list, ...validEmails.filter((e) => !list.includes(e))]);
    setInput("");
  }
}

function handleBlur(input, setInput, list, setList) {
  addEmailsFromInput(input, setInput, list, setList);
}

function removeEmail(idx, list, setList) {
  setList(list.filter((_, i) => i !== idx));
}
  const getInitialBody = () => {
    if (docType === "requestForm" && userRole === "procurementofficer") {
      return `Hello,

Please find the attached request form for your review and processing.

Regards,
Procurement Officer`;
    }
    if (docType === "purchaseOrder" && userRole === "procurementmanager") {
      return `Hello,

Please find the attached purchase order for your review and processing.

Regards,
Procurement Manager`;
    }
    if (docType === "reminder" && userRole === "invoice controller") {
      return `Hello,

This is a kind reminder regarding Purchase Order ${
        purchaseOrderNumber ? `No. ${purchaseOrderNumber}` : ""
      }.

Please review and process the invoice as soon as possible. If you have already taken action, kindly disregard this message.

Thank you.

Best regards,
Invoice Controller`;
    }
    // fallback
    return `Hello,

Please find the attached document.

Regards,
Procurement`;
  };

  const [body, setBody] = useState(getInitialBody());
  const [attachments, setAttachments] = useState(() => [...initialAttachments]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setAttachments([...initialAttachments]);
  }, [initialAttachments]);

  useEffect(() => {
    setReplyTo(userEmail || "");
  }, [userEmail]);

  useEffect(() => {
  // Only update replyToInput if the user hasn't typed anything and no chips are present
  if (!replyToInput && replyToList.length === 0 && replyTo) {
    setReplyToInput(replyTo);
  }
}, [replyTo]);

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

  // --- Mailing API integration ---
 const sendEmail = async () => {
  setSending(true);
  try {
    if (!toList.length || !subj || !body || (!replyToList.length && !replyToInput)) {
      alert("To, Subject, Body, and Reply-To are required.");
      setSending(false);
      return;
    }
    const formData = new FormData();
    formData.append("recipients", JSON.stringify(toList));
    formData.append("subject", subj);
    formData.append("body", body);
    if (replyToList.length > 0) {
      formData.append("replyTo", JSON.stringify(replyToList));
    } else {
      formData.append("replyTo", replyToInput);
    }
    if (ccList.length > 0) formData.append("cc", JSON.stringify(ccList));

    attachments.forEach((file) => {
      formData.append("attachments", file);
    });

    const response = await fetch(
      "https://hdp-backend-1vcl.onrender.com/api/mail/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const result = await response.json();
    console.log("Mail API response:", result);

    if (result.success) {
      onSent();
    } else {
      alert(result.message || "Failed to send email.");
    }
  } catch (err) {
    console.error("Mail send error:", err);
    alert("Failed to send email. See console for details.");
  } finally {
    setSending(false);
  }
};
  useEffect(() => {
    // Fetch user profile for email
    const fetchProfile = async () => {
      try {
        if (!token) return;
        const resp = await fetch(
          "https://hdp-backend-1vcl.onrender.com/api/user/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await resp.json();
        if (data && data.email) {
          setReplyTo(data.email);
        }
      } catch (err) {
        // fallback to userEmail prop if fetch fails
        setReplyTo(userEmail || "");
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [token]);

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
              <div className="text-xs text-slate-500">Compose an email</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={sendEmail}
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
           {/* To Field */}
{/* To Field */}
<div className="flex items-center gap-3">
  <label className="w-14 text-xs text-slate-500">To</label>
  <div className="flex-1 flex flex-wrap items-center border border-slate-200 rounded-lg p-2 min-h-[40px] bg-white">
    {toList.map((email, idx) => (
      <span
        key={email}
        className="flex items-center bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 mr-2 mb-1 shadow text-xs"
      >
        {email}
        <button
          type="button"
          className="ml-1 text-emerald-700 hover:text-red-600"
          onClick={() => removeEmail(idx, toList, setToList)}
        >
          <MdClose size={16} />
        </button>
      </span>
    ))}
    <input
      value={toInput}
      onChange={(e) => handleInputChange(setToInput, e.target.value)}
      onKeyDown={(e) =>
        handleInputKeyDown(e, toInput, setToInput, toList, setToList)
      }
      onBlur={() => handleBlur(toInput, setToInput, toList, setToList)}
      placeholder={toList.length === 0 ? "Add recipient" : ""}
      className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm"
    />
  </div>
</div>

{/* CC Field */}
<div className="flex items-center gap-3">
  <label className="w-14 text-xs text-slate-500">CC</label>
  <div className="flex-1 flex flex-wrap items-center border border-slate-200 rounded-lg p-2 min-h-[40px] bg-white">
    {ccList.map((email, idx) => (
      <span
        key={email}
        className="flex items-center bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 mr-2 mb-1 shadow text-xs"
      >
        {email}
        <button
          type="button"
          className="ml-1 text-emerald-700 hover:text-red-600"
          onClick={() => removeEmail(idx, ccList, setCcList)}
        >
          <MdClose size={16} />
        </button>
      </span>
    ))}
    <input
      value={ccInput}
      onChange={(e) => handleInputChange(setCcInput, e.target.value)}
      onKeyDown={(e) =>
        handleInputKeyDown(e, ccInput, setCcInput, ccList, setCcList)
      }
      onBlur={() => handleBlur(ccInput, setCcInput, ccList, setCcList)}
      placeholder={ccList.length === 0 ? "Add CC" : ""}
      className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm"
    />
  </div>
</div>

{/* Reply-To Field */}
<div className="flex items-center gap-3">
  <label className="w-14 text-xs text-slate-500">Reply-To</label>
  <div className="flex-1 flex flex-wrap items-center border border-slate-200 rounded-lg p-2 min-h-[40px] bg-white">
    {replyToList.map((email, idx) => (
      <span
        key={email}
        className="flex items-center bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 mr-2 mb-1 shadow text-xs"
      >
        {email}
        <button
          type="button"
          className="ml-1 text-emerald-700 hover:text-red-600"
          onClick={() => removeEmail(idx, replyToList, setReplyToList)}
        >
          <MdClose size={16} />
        </button>
      </span>
    ))}
    <input
      value={replyToInput}
      onChange={(e) => handleInputChange(setReplyToInput, e.target.value)}
      onKeyDown={(e) =>
        handleInputKeyDown(
          e,
          replyToInput,
          setReplyToInput,
          replyToList,
          setReplyToList
        )
      }
      onBlur={() =>
        handleBlur(replyToInput, setReplyToInput, replyToList, setReplyToList)
      }
      placeholder={replyToList.length === 0 ? "Reply-To" : ""}
      className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm"
      required
    />
  </div>
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
              <div className="text-xs text-slate-400">Max 10 files</div>
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
          <div className="text-xs text-slate-500">Draft saved locally</div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border text-sm hover:bg-slate-50"
            >
              Close
            </button>
            <button
              onClick={sendEmail}
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
