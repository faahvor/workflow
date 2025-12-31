import React, { useState, useRef, useEffect } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import {
  MdDashboard,
  MdPendingActions,
  MdCheckCircle,
  MdHistory,
  MdPerson,
  MdChat,
  MdSend,
  MdNotifications,
} from "react-icons/md";

// Demo user and chat data
const demoUser = {
  name: "Procurement Officer",
  email: "officer@gemz.com",
  initials: "PO",
  avatarColor: "from-emerald-500 to-teal-600",
};

// Demo users to chat with
const demoUsers = [
  {
    id: "john",
    name: "John Smith",
    role: "Fleet Manager",
    initials: "JS",
    avatarColor: "from-cyan-500 to-blue-600",
    online: true,
    unread: 2,
  },
  {
    id: "marineops",
    name: "Marine Ops",
    role: "Operations",
    initials: "MO",
    avatarColor: "from-indigo-500 to-purple-600",
    online: true,
    unread: 0,
  },
  {
    id: "engineer",
    name: "Chief Engineer",
    role: "Chief Engineer",
    initials: "CE",
    avatarColor: "from-amber-500 to-yellow-600",
    online: false,
    unread: 1,
  },
  {
    id: "captain",
    name: "Captain Rivers",
    role: "Vessel Captain",
    initials: "CR",
    avatarColor: "from-green-500 to-emerald-600",
    online: true,
    unread: 0,
  },
];

// Demo chat history per user
const demoChatsPerUser = {
  john: [
    {
      id: 1,
      author: "John Smith",
      authorInitials: "JS",
      time: "09:30 AM",
      text: "Good morning team, please confirm ETA for the spare parts delivery.",
      self: false,
    },
    {
      id: 2,
      author: "You",
      authorInitials: "PO",
      time: "09:32 AM",
      text: "Received, John. ETA is 3 days. Will update if there are changes.",
      self: true,
    },
  ],
  marineops: [
    {
      id: 1,
      author: "Marine Ops",
      authorInitials: "MO",
      time: "09:35 AM",
      text: "Noted. Please ensure all documentation is ready for customs.",
      self: false,
    },
    {
      id: 2,
      author: "You",
      authorInitials: "PO",
      time: "09:36 AM",
      text: "All documentation will be ready before arrival.",
      self: true,
    },
  ],
  engineer: [
    {
      id: 1,
      author: "Chief Engineer",
      authorInitials: "CE",
      time: "08:10 AM",
      text: "Please check the hydraulic oil levels before departure.",
      self: false,
    },
  ],
  captain: [
    {
      id: 1,
      author: "Captain Rivers",
      authorInitials: "CR",
      time: "Yesterday",
      text: "Weather looks clear for the next 48 hours.",
      self: false,
    },
  ],
};

const ChatRoom = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(demoUsers[0]);
  const [messages, setMessages] = useState(
    demoChatsPerUser[demoUsers[0].id] || []
  );
  const [input, setInput] = useState("");
  const [notified, setNotified] = useState(true);
  const chatEndRef = useRef(null);

  // Filter users by search
  const filteredUsers = demoUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  // Change chat when user is selected
  useEffect(() => {
    if (selectedUser.unread) {
      demoUsers.forEach((u) => {
        if (u.id === selectedUser.id) u.unread = 0;
      });
    }
    setMessages(demoChatsPerUser[selectedUser.id] || []);
    // eslint-disable-next-line
  }, [selectedUser]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate notification
  useEffect(() => {
    if (!notified) {
      setTimeout(() => setNotified(true), 2000);
    }
  }, [notified]);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: "You",
        authorInitials: demoUser.initials,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        text: input,
        self: true,
      },
    ]);
    setInput("");
    setNotified(false);
  };

  return (
    <div className="relative w-full  bg-grey-300">
      
{/* Glassmorphic animated orbs */}
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
      <div className="relative z-10 flex w-full h-full ">
       

        {/* Users Sidebar */}
        <div className="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-gray-200/60 shadow-lg z-20">
          <div className="px-6 py-4 border-b border-gray-200/60 flex items-center gap-2">
            <MdPerson className="text-xl text-emerald-500" />
            <span className="font-bold text-gray-900 text-lg">Chats</span>
          </div>
          <div className="px-4 py-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-lg bg-slate-50/80 border border-slate-200/60 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
              style={{
                backdropFilter: "blur(6px)",
                boxShadow: "0 2px 8px 0 rgba(31, 38, 135, 0.04)",
              }}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {filteredUsers.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                No users found.
              </div>
            )}
            <ul className="space-y-2">
              {filteredUsers.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 ${
                      selectedUser.id === user.id
                        ? "bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white shadow"
                        : "hover:bg-emerald-50 text-gray-700"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${user.avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                    >
                      {user.initials}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold truncate">{user.name}</div>
                      <div className="text-xs truncate opacity-70">
                        {user.role}
                      </div>
                    </div>
                    {user.online && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-400 ml-2"
                        title="Online"
                      ></span>
                    )}
                    {/* Notification badge for unread messages */}
                    {user.unread > 0 && (
                      <span className="relative ml-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white shadow">
                          {user.unread}
                        </span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-ping" />
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-gradient-to-br ${selectedUser.avatarColor} rounded-full flex items-center justify-center text-white font-semibold text-lg`}
              >
                {selectedUser.initials}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedUser.name}
                </h2>
                <div className="text-xs text-gray-400">{selectedUser.role}</div>
              </div>
              {selectedUser.online && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  Online
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {messages.length} messages
              </span>
            </div>
          </div>

          {/* Chat area */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-12 py-8 bg-gradient-to-br from-white/80 via-slate-50/80 to-emerald-50/60"
            style={{ minHeight: 0 }}
          >
            <div className=" mx-auto flex flex-col gap-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-3 ${
                    msg.self ? "justify-end" : "justify-start"
                  }`}
                >
                  {!msg.self && (
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedUser.avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow`}
                    >
                      {msg.authorInitials}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-md border ${
                      msg.self
                        ? "bg-gradient-to-br from-emerald-100/80 to-white/80 border-emerald-200/60 text-emerald-900"
                        : "bg-white/80 border-slate-200/60 text-gray-900"
                    }`}
                    style={{
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.09)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold">{msg.author}</span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <div className="text-sm leading-relaxed">{msg.text}</div>
                  </div>
                  {msg.self && (
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${demoUser.avatarColor} flex items-center justify-center text-white font-semibold text-sm shadow`}
                    >
                      {demoUser.initials}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat input */}
          <div className="px-6 py-5 border-t border-gray-200/60 bg-white/80 backdrop-blur-xl shadow-lg flex items-center gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Message ${selectedUser.name}…`}
              className="flex-1 rounded-xl bg-slate-50/80 border border-slate-200/60 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
              style={{
                backdropFilter: "blur(6px)",
                boxShadow: "0 2px 8px 0 rgba(31, 38, 135, 0.04)",
              }}
              maxLength={1000}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-150 flex items-center gap-2 disabled:opacity-50"
              style={{
                boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.09)",
              }}
            >
              <MdSend className="text-lg" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
