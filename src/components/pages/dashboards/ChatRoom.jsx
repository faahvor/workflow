import React, { useState, useRef, useEffect } from "react";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import { MdPerson, MdSend } from "react-icons/md";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "https://hdp-backend-1vcl.onrender.com/api/chat";
const ChatRoom = () => {
  const { user, getToken } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [pagination, setPagination] = useState({});
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  // Connect to WebSocket
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const socket = io(
      import.meta.env.VITE_WS_URL || "wss://hdp-backend-1vcl.onrender.com",
      {
        auth: { token },
        transports: ["websocket"],
      }
    );
    socketRef.current = socket;

    socket.on("connect", () => {});
    socket.on("disconnect", () => {});
    socket.on("error", (err) => {});

    // New message received
    socket.on("new_message", ({ message, conversationId }) => {
      if (selectedConversation?.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
        socket.emit("mark_read", { conversationId });
      } else {
        setConversations((prev) =>
          prev.map((c) =>
            c.conversationId === conversationId
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
              : c
          )
        );
      }
    });

    // Read receipts
    socket.on("messages_read", ({ conversationId, readBy, readAt }) => {
      // Optionally update UI for read receipts
    });

    // Conversation updated
    socket.on("conversation_updated", (data) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === data.conversationId ? { ...c, ...data } : c
        )
      );
    });

    // Typing events
    socket.on("user_typing", ({ conversationId, userId, isTyping }) => {
      if (
        selectedConversation &&
        selectedConversation.conversationId === conversationId &&
        userId !== user?.userId
      ) {
        setOtherTyping(isTyping);
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [user]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      const token = getToken();
      if (!token) return;
      const resp = await fetch(`${API_BASE}/conversations?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setConversations(data.conversations || []);
    };
    fetchConversations();
    // eslint-disable-next-line
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;
    const token = getToken();
    const fetchMessages = async () => {
      const resp = await fetch(
        `${API_BASE}/conversations/${selectedConversation.conversationId}/messages?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await resp.json();
      setMessages(data.messages || []);
      setPagination(data.pagination || {});
      // Mark as read
      socketRef.current?.emit("join_conversation", {
        conversationId: selectedConversation.conversationId,
      });
      socketRef.current?.emit("mark_read", {
        conversationId: selectedConversation.conversationId,
      });
    };
    fetchMessages();
    setSelectedUser(selectedConversation.otherParticipant);
    // eslint-disable-next-line
  }, [selectedConversation]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Search users
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const token = getToken();
    const fetchUsers = async () => {
      const resp = await fetch(
        `${API_BASE}/users/search?q=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await resp.json();
      setSearchResults(data.users || []);
    };
    fetchUsers();
    // eslint-disable-next-line
  }, [search]);

  // Start conversation with searched user
  const handleStartConversation = async (userObj) => {
    const token = getToken();
    const resp = await fetch(`${API_BASE}/conversations/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: userObj.userId }),
    });
    const data = await resp.json();

    // 1. Refresh conversations from backend
    const fetchConversations = async () => {
      const token = getToken();
      if (!token) return;
      const resp = await fetch(`${API_BASE}/conversations?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const convData = await resp.json();
      setConversations(convData.conversations || []);
      // 2. Find the conversation for the selected user and open it
      const found = (convData.conversations || []).find(
        (c) =>
          c.conversationId === data.conversation.conversationId ||
          (c.otherParticipant && c.otherParticipant.userId === userObj.userId)
      );
      if (found) {
        setSelectedConversation(found);
        setSelectedUser(found.otherParticipant);
      } else {
        // fallback: open the just-created conversation
        setSelectedConversation(data.conversation);
        setSelectedUser(data.otherParticipant);
      }
    };
    await fetchConversations();

    // 3. Clear search UI
    setSearch("");
    setSearchResults([]);
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !selectedConversation) return;
    const token = getToken();
    // Send via REST
    const resp = await fetch(`${API_BASE}/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        conversationId: selectedConversation.conversationId,
        content: input,
      }),
    });
    const data = await resp.json();
    setMessages((prev) => [...prev, data.message]);
    setInput("");
    // Optionally emit via socket for instant delivery
    // socketRef.current?.emit("send_message", {
    //   conversationId: selectedConversation.conversationId,
    //   content: input,
    // });
  };

  // Typing indicator
  useEffect(() => {
    if (!selectedConversation) return;
    if (typing) {
      socketRef.current?.emit("typing_start", {
        conversationId: selectedConversation.conversationId,
      });
    } else {
      socketRef.current?.emit("typing_stop", {
        conversationId: selectedConversation.conversationId,
      });
    }
    // eslint-disable-next-line
  }, [typing]);

  // Sidebar: show conversations, allow search for new users
  // User list: conversations + search results
  const userList =
    search.length >= 2
      ? searchResults
      : conversations
          .filter((c) => c.otherParticipant) // <-- add this filter
          .map((c) => ({
            ...c.otherParticipant,
            unread: c.unreadCount,
            online: c.otherParticipant.isOnline,
            conversationId: c.conversationId,
            lastMessagePreview: c.lastMessagePreview,
            lastMessageAt: c.lastMessageAt,
          }));

  const markConversationAsRead = (conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit("mark_read", { conversationId });
    }
  };

  return (
    <div className="relative w-full bg-grey-300">
      {/* Glassmorphic animated orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full filter blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-400/20 rounded-full filter blur-3xl animate-pulse delay-500" />
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
            {userList.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-8">
                No users found.
              </div>
            )}
            <ul className="space-y-2">
              {userList.map((user) => (
                <li key={user.userId || user.conversationId}>
                  <button
                    onClick={() => {
                      if (user.conversationId) {
                        setSelectedConversation(
                          conversations.find(
                            (c) => c.conversationId === user.conversationId
                          )
                        );
                        setSelectedUser(user);
                        // Mark as read immediately when opening the conversation
                        markConversationAsRead(user.conversationId);

                        // --- Add this: update local unread count immediately ---
                        setConversations((prev) =>
                          prev.map((c) =>
                            c.conversationId === user.conversationId
                              ? { ...c, unreadCount: 0 }
                              : c
                          )
                        );
                      } else {
                        handleStartConversation(user);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 ${
                      selectedUser?.userId === user.userId
                        ? "bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white shadow"
                        : "hover:bg-emerald-50 text-gray-700"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm`}
                    >
                      {user.displayName
                        ? user.displayName
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold truncate">
                        {user.displayName || user.name}
                      </div>
                      <div className="text-xs truncate opacity-70">
                        {user.role}
                      </div>
                      {user.lastMessagePreview && (
                        <div className="text-xs text-gray-400 truncate">
                          {user.lastMessagePreview}
                        </div>
                      )}
                    </div>
                    {user.online && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-400 ml-2"
                        title="Online"
                      ></span>
                    )}
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
                className={`w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg`}
              >
                {selectedUser?.displayName
                  ? selectedUser.displayName
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "U"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedUser?.displayName || selectedUser?.name || ""}
                </h2>
                <div className="text-xs text-gray-400">
                  {selectedUser?.role}
                </div>
              </div>
              {selectedUser?.online && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  Online
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {otherTyping && (
                <span className="text-xs text-emerald-500 animate-pulse">
                  Typing...
                </span>
              )}
            </div>
          </div>

          {/* Chat area */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-12 py-8 bg-gradient-to-br from-white/80 via-slate-50/80 to-emerald-50/60"
            style={{ minHeight: 0 }}
          >
            <div className="mx-auto flex flex-col gap-6">
              {messages.map((msg) => (
                <div
                  key={msg.messageId || msg.id}
                  className={`flex items-end gap-3 ${
                    msg.senderId === user?.userId
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  {msg.senderId !== user?.userId && (
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow`}
                    >
                      {selectedUser?.displayName
                        ? selectedUser.displayName
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "U"}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-md border ${
                      msg.senderId === user?.userId
                        ? "bg-gradient-to-br from-emerald-100/80 to-white/80 border-emerald-200/60 text-emerald-900"
                        : "bg-white/80 border-slate-200/60 text-gray-900"
                    }`}
                    style={{
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 4px 24px 0 rgba(31, 38, 135, 0.09)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold">
                        {msg.senderId === user?.userId
                          ? "You"
                          : selectedUser?.displayName || "User"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                      {msg.isRead && (
                        <span className="text-xs text-emerald-400 ml-2">✓</span>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed">{msg.content}</div>
                  </div>
                  {msg.senderId === user?.userId && (
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow`}
                    >
                      {user?.displayName
                        ? user.displayName
                            .split(" ")
                            .map((s) => s[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()
                        : "U"}
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
              onChange={(e) => {
                setInput(e.target.value);
                setTyping(e.target.value.length > 0);
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                selectedUser
                  ? `Message ${selectedUser.displayName || selectedUser.name}…`
                  : "Select a user to chat…"
              }
              className="flex-1 rounded-xl bg-slate-50/80 border border-slate-200/60 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
              style={{
                backdropFilter: "blur(6px)",
                boxShadow: "0 2px 8px 0 rgba(31, 38, 135, 0.04)",
              }}
              maxLength={1000}
              disabled={!selectedConversation}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !selectedConversation}
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
