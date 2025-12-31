import React, { useState } from "react";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdAttachFile,
  MdHelp,
  MdPhone,
  MdEmail,
  MdSupportAgent,
} from "react-icons/md";
import { IoMdMenu, IoMdClose } from "react-icons/io";

const sidebarLinks = [
  {
    icon: <MdDashboard className="text-xl shrink-0" />,
    label: "Overview",
    active: false,
  },
  {
    icon: <MdPendingActions className="text-xl shrink-0" />,
    label: "Requests",
    active: false,
  },
  {
    icon: <MdCheckCircle className="text-xl shrink-0" />,
    label: "Approved",
    active: false,
  },
  {
    icon: <MdHistory className="text-xl shrink-0" />,
    label: "History",
    active: false,
  },
  {
    icon: <MdHelp className="text-xl shrink-0" />,
    label: "Support",
    active: true,
  },
];

const glass =
  "bg-white/70 backdrop-blur-xl border border-slate-200 shadow-lg shadow-emerald-100/20";

const Support = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mode, setMode] = useState("call"); // "call" or "email" or "chat"
  // Live chat state
  const [chatMessages, setChatMessages] = useState([
    {
      from: "support",
      text: "👋 Hi! Welcome to Gemz Support. How can we help you today?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [emailForm, setEmailForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailChange = (e) => {
    setEmailForm({ ...emailForm, [e.target.name]: e.target.value });
  };

  const handleSendEmail = (e) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setEmailForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setTimeout(() => setSent(false), 3000);
    }, 1800);
  };

  // Live chat send handler
  const handleSendChat = (e) => {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    setChatMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: msg,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setChatInput("");
    setChatSending(true);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          from: "support",
          text: "Thank you for your message! A support agent will reply shortly. (This is a demo chat.)",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setChatSending(false);
    }, 1200);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated glass orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse delay-500" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 flex h-full">
       
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8  mx-auto">
            {/* Header */}
                            <h1 className="font-bold text-4xl mb-6">Support</h1>

            <div
              className={`${glass} rounded-3xl px-8 py-6 mb-8 border-2 border-slate-100/60`}
            >
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-slate-400 text-sm font-mono font-semibold">
                  SUPPORT
                </span>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold border bg-emerald-500/20 text-emerald-700 border-emerald-400/30">
                  <MdSupportAgent className="text-sm" />
                  <span>Help Desk</span>
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                How can we help you today?
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Our support team is available 24/7 to assist you. Choose your
                preferred contact method below.
              </p>
            </div>
            {/* Contact Mode Selection */}
            <div className="flex items-center gap-6 mb-10">
              <button
                onClick={() => setMode("call")}
                className={`flex-1 flex flex-col items-center justify-center px-6 py-5 rounded-2xl border-2 transition-all duration-200 ${
                  mode === "call"
                    ? "bg-gradient-to-r from-emerald-500/10 to-teal-400/10 border-emerald-400/40 shadow-lg"
                    : "bg-white/60 border-slate-200 hover:border-emerald-400"
                }`}
              >
                <MdPhone
                  className={`text-3xl mb-2 ${
                    mode === "call" ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <span
                  className={`font-semibold text-lg ${
                    mode === "call" ? "text-emerald-700" : "text-slate-700"
                  }`}
                >
                  Call Support
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Speak directly with our team
                </span>
              </button>
              <button
                onClick={() => setMode("email")}
                className={`flex-1 flex flex-col items-center justify-center px-6 py-5 rounded-2xl border-2 transition-all duration-200 ${
                  mode === "email"
                    ? "bg-gradient-to-r from-purple-500/10 to-emerald-400/10 border-purple-400/40 shadow-lg"
                    : "bg-white/60 border-slate-200 hover:border-purple-400"
                }`}
              >
                <MdEmail
                  className={`text-3xl mb-2 ${
                    mode === "email" ? "text-purple-600" : "text-slate-400"
                  }`}
                />
                <span
                  className={`font-semibold text-lg ${
                    mode === "email" ? "text-purple-700" : "text-slate-700"
                  }`}
                >
                  Email Support
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Get a detailed response in your inbox
                </span>
              </button>
              {/* Live Chat Option */}
              <button
                onClick={() => setMode("chat")}
                className={`flex-1 flex flex-col items-center justify-center px-6 py-5 rounded-2xl border-2 transition-all duration-200 ${
                  mode === "chat"
                    ? "bg-gradient-to-r from-blue-500/10 to-emerald-400/10 border-blue-400/40 shadow-lg"
                    : "bg-white/60 border-slate-200 hover:border-blue-400"
                }`}
              >
                <span
                  className={`text-3xl mb-2 ${
                    mode === "chat" ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  💬
                </span>
                <span
                  className={`font-semibold text-lg ${
                    mode === "chat" ? "text-blue-700" : "text-slate-700"
                  }`}
                >
                  Live Chat
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Chat instantly with support
                </span>
              </button>
            </div>
            {/* Mode Content */}
            <div>
              {mode === "call" ? (
                <div
                  className={`${glass} rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center border-2 border-slate-100/60`}
                >
                  <div className="flex-1 flex flex-col items-center md:items-start">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-4xl shadow-lg mb-4">
                      <MdPhone />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      Call Our Support Team
                    </h3>
                    <p className="text-slate-600 mb-4 text-sm">
                      Our agents are available 24/7. Calls are toll-free within
                      Nigeria.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg text-emerald-700">
                          +234-1-800-5555
                        </span>
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          Main Line
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg text-emerald-700">
                          +234-1-800-8888
                        </span>
                        <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          Priority
                        </span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <a
                        href="tel:+23418005555"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200"
                      >
                        <MdPhone className="text-lg" />
                        Call Now
                      </a>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-full max-w-xs rounded-2xl bg-gradient-to-br from-emerald-100/60 to-white/80 border border-emerald-200 shadow-lg p-6 flex flex-col items-center">
                      <MdSupportAgent className="text-5xl text-emerald-500 mb-2" />
                      <div className="text-lg font-bold text-slate-900 mb-1">
                        Live Support
                      </div>
                      <div className="text-sm text-slate-600 text-center">
                        Average wait time:{" "}
                        <span className="font-semibold text-emerald-700">
                          1 min
                        </span>
                        <br />
                        <span className="text-xs text-slate-400">
                          (Mon-Sun, 24hrs)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : mode === "email" ? (
                <form
                  onSubmit={handleSendEmail}
                  className={`${glass} rounded-2xl p-8 border-2 border-slate-100/60 shadow-xl`}
                  style={{
                    background:
                      "linear-gradient(120deg,rgba(255,255,255,0.85) 60%,rgba(236,254,255,0.7) 100%)",
                  }}
                >
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-emerald-400 flex items-center justify-center text-white text-4xl shadow-lg mb-4">
                        <MdEmail />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Email Our Support Team
                      </h3>
                      <p className="text-slate-600 mb-4 text-sm">
                        Fill out the form and our team will respond within 1
                        hour.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <MdAttachFile className="text-lg text-slate-400" />
                        <span className="text-xs text-slate-500">
                          Attachments supported (PDF, JPG, PNG)
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          type="text"
                          name="name"
                          value={emailForm.name}
                          onChange={handleEmailChange}
                          required
                          placeholder="Your Name"
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                        />
                        <input
                          type="email"
                          name="email"
                          value={emailForm.email}
                          onChange={handleEmailChange}
                          required
                          placeholder="Your Email"
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                        />
                        <input
                          type="text"
                          name="subject"
                          value={emailForm.subject}
                          onChange={handleEmailChange}
                          required
                          placeholder="Subject"
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                        />
                        <textarea
                          name="message"
                          value={emailForm.message}
                          onChange={handleEmailChange}
                          required
                          rows={5}
                          placeholder="Describe your issue or question in detail..."
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition resize-none"
                        />
                        {/* Attachments (demo only, not functional) */}
                        <div className="flex items-center gap-3">
                          <label
                            htmlFor="attachment"
                            className="flex items-center gap-2 cursor-pointer text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                          >
                            <MdAttachFile className="text-lg" />
                            Add Attachment
                          </label>
                          <input
                            id="attachment"
                            type="file"
                            className="hidden"
                            accept=".pdf,image/*"
                            disabled
                          />
                          <span className="text-xs text-slate-400">
                            (Demo: disabled)
                          </span>
                        </div>
                        <button
                          type="submit"
                          disabled={sending}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          {sending
                            ? "Sending..."
                            : sent
                            ? "Sent!"
                            : "Send Email"}
                        </button>
                        {sent && (
                          <div className="text-center text-emerald-600 font-semibold mt-2 animate-fadeIn">
                            Your message has been sent! Our team will reply
                            soon.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                // Live Chat UI
                <div
                  className={`${glass} rounded-2xl p-0 border-2 border-slate-100/60 shadow-xl flex flex-col h-[500px] md:h-[520px]  mx-auto`}
                  style={{
                    background:
                      "linear-gradient(120deg,rgba(255,255,255,0.85) 60%,rgba(236,254,255,0.7) 100%)",
                  }}
                >
                  {/* Chat header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-emerald-50/80 rounded-t-2xl">
                    <span className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-2xl shadow-lg">
                      💬
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 text-lg">
                        Live Chat Support
                      </div>
                      <div className="text-xs text-slate-500">
                        You are chatting with Gemz Support
                      </div>
                    </div>
                  </div>
                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-white/60">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.from === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2 rounded-2xl shadow ${
                            msg.from === "user"
                              ? "bg-gradient-to-br from-emerald-500/90 to-teal-400/90 text-white rounded-br-none"
                              : "bg-gradient-to-br from-blue-100/90 to-emerald-100/80 text-slate-900 rounded-bl-none"
                          }`}
                        >
                          <div className="text-sm">{msg.text}</div>
                          <div
                            className={`text-[10px] mt-1 ${
                              msg.from === "user"
                                ? "text-emerald-100/80 text-right"
                                : "text-slate-400 text-left"
                            }`}
                          >
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ))}
                    {chatSending && (
                      <div className="flex justify-start">
                        <div className="max-w-[70%] px-4 py-2 rounded-2xl bg-gradient-to-br from-blue-100/90 to-emerald-100/80 text-slate-900 rounded-bl-none shadow">
                          <div className="text-sm flex items-center gap-2">
                            <span className="animate-pulse">...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Chat input */}
                  <form
                    onSubmit={handleSendChat}
                    className="px-6 py-4 border-t border-slate-100 bg-white/80 rounded-b-2xl flex items-center gap-3"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                      disabled={chatSending}
                    />
                    <button
                      type="submit"
                      disabled={chatSending || !chatInput.trim()}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-semibold shadow-lg hover:scale-105 transition-all duration-200"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="mt-12 text-center text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Gemz Software. All rights
              reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
