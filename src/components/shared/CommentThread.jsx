import React, { useState, useEffect } from "react";
import axios from "axios";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { MdReply } from "react-icons/md";
import { FcComments } from "react-icons/fc";

const COMMENTS_PER_PAGE = 3;
const API_BASE_URL = "https://hdp-backend-1vcl.onrender.com/api";

function flattenComments(comments, parentCommentId = null) {
  let flat = [];
  for (const c of comments) {
    flat.push({
      id: c._id || c.id,
      author:
        (c.userId && (c.userId.displayName || c.userId.name)) ||
        c.author ||
        "Unknown",
      role:
        (c.userId && (c.userId.role || "").toString().toLowerCase()) ||
        (c.role || "").toString().toLowerCase(),
      text: c.content || c.comment || c.body || c.text || "",
      createdAt:
        c.timestamp || c.createdAt || c.created_at || new Date().toISOString(),
      isQueryComment: !!c.isQueryComment,
      parentCommentId: parentCommentId,
      raw: c,
    });
    if (Array.isArray(c.replies) && c.replies.length > 0) {
      flat = flat.concat(flattenComments(c.replies, c._id || c.id));
    }
  }
  return flat;
}

function CommentThread({ requestId, user, getToken }) {
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  // For reply UI
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState({});
  const [page, setPage] = useState(1);
  const [showCommentsList, setShowCommentsList] = useState(false); // default hidden
  // At the top of CommentThread
  const [collapsedReplies, setCollapsedReplies] = useState({});

  // Fetch comments
  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get(
        `${API_BASE_URL}/requests/${encodeURIComponent(requestId)}/comments`,
        { headers }
      );
      const data = Array.isArray(resp?.data?.data)
        ? resp.data.data
        : Array.isArray(resp?.data)
        ? resp.data
        : [];
      setComments(flattenComments(data));
    } catch (err) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) fetchComments();
    // eslint-disable-next-line
  }, [requestId]);

  // Post comment or reply
  const handlePostComment = async (text, parentCommentId = null) => {
    if (!text.trim()) return;
    setPostingComment(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `${API_BASE_URL}/requests/${encodeURIComponent(requestId)}/comments`,
        { content: text, parentCommentId },
        { headers }
      );
      setReplyText("");
      setReplyingTo(null);
      await fetchComments();
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  // UI helpers
  const rootComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (commentId) =>
    comments.filter((c) => c.parentCommentId === commentId);
  const totalPages = Math.max(
    1,
    Math.ceil(rootComments.length / COMMENTS_PER_PAGE)
  );
  const paginatedRoot = rootComments.slice(
    (page - 1) * COMMENTS_PER_PAGE,
    page * COMMENTS_PER_PAGE
  );

  // Render a single comment (with nested replies)
  const renderComment = (comment, level = 0) => {
    const replies = getReplies(comment.id);
    const showAllReplies = showReplies[comment.id];
    const visibleReplies = showAllReplies ? replies : replies.slice(0, 3);

    return (
      <div
        key={comment.id}
        className="relative rounded-xl  bg-white/80  p-4 mb-3"
        style={{
          marginLeft: level ? `${level * 2}px` : 0,
          background: "rgba(255,255,255,0.85)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {(comment.author || "U")
              .toString()
              .split(" ")
              .map((s) => s[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {comment.author || "Unknown"}
              </span>
              {comment.role && (
                <span className="text-xs text-slate-400">• {comment.role}</span>
              )}
              {comment.isQueryComment && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                  Queried
                </span>
              )}
              {comment.parentAuthor && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200">
                  Reply to {comment.parentAuthor}
                </span>
              )}
              {/* Arrow for root comments with replies */}
            </div>
            <div className="text-xs text-slate-400">
              {new Date(comment.createdAt || Date.now()).toLocaleString()}
            </div>
            <div className="mt-2 text-sm text-slate-700 whitespace-pre-line">
              {comment.text}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                className="flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline"
                onClick={() =>
                  setReplyingTo(replyingTo === comment.id ? null : comment.id)
                }
              >
                <MdReply className="text-base" />
                Reply
              </button>
              {level === 0 && getReplies(comment.id).length > 0 && (
                <button
                  type="button"
                  className="ml-2 flex items-center text-xs text-blue-600 hover:underline"
                  onClick={() =>
                    setCollapsedReplies((prev) => ({
                      ...prev,
                      [comment.id]: !prev[comment.id],
                    }))
                  }
                >
                  {collapsedReplies[comment.id] ? (
                    <>
                      <IoChevronDown className="inline-block" />
                      View {getReplies(comment.id).length} repl
                      {getReplies(comment.id).length === 1 ? "y" : "ies"}
                    </>
                  ) : (
                    <>
                      <IoChevronUp className="inline-block" />
                      Hide replies
                    </>
                  )}
                </button>
              )}
            </div>
            {/* Reply input */}
            {replyingTo === comment.id && (
              <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">
                  Replying to{" "}
                  <span className="font-semibold">{comment.author}</span>
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.author}...`}
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-slate-400">
                    {replyText.length}/1000
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setReplyText("");
                        setReplyingTo(null);
                      }}
                      className="px-3 py-1 bg-gray-100 text-slate-700 rounded-md hover:bg-gray-200 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handlePostComment(replyText, comment.id)}
                      disabled={postingComment || !replyText.trim()}
                      className={`px-3 py-1 rounded-md text-xs font-semibold ${
                        postingComment
                          ? "bg-gray-300 text-slate-600 cursor-not-allowed"
                          : "bg-[#036173] text-white hover:bg-[#024f57]"
                      }`}
                    >
                      {postingComment ? "Posting..." : "Post Reply"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Replies */}
            {replies.length > 0 &&
              (!collapsedReplies[comment.id] || level > 0) && (
                <div className="mt-3">
                  {visibleReplies.map((reply) => (
                    <div key={reply.id} className="flex">
                      {/* Vertical line for all levels of replies */}
                      <div
                        className="mr-2"
                        style={{
                          width: "12px",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "2px",
                            background: "#e5e7eb", // Tailwind gray-200
                            borderRadius: "1px",
                            height: "100%",
                            minHeight: "100%",
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, marginLeft: 0 }}>
                        {renderComment(
                          {
                            ...reply,
                            parentAuthor: comment.author,
                          },
                          level + 1
                        )}
                      </div>
                    </div>
                  ))}
                  {level > 0 && replies.length > 3 && (
                    <button
                      className="flex items-center gap-1 text-xs text-blue-600 mt-2"
                      onClick={() =>
                        setShowReplies((prev) => ({
                          ...prev,
                          [comment.id]: !showAllReplies,
                        }))
                      }
                    >
                      {showAllReplies ? (
                        <>
                          <IoChevronUp /> Hide replies
                        </>
                      ) : (
                        <>
                          <IoChevronDown /> See {replies.length - 3} more repl
                          {replies.length - 3 === 1 ? "y" : "ies"}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    );
  };

  // Main render

  return (
    <div>
      {/* Add Comment */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 ">
          <FcComments />
          <h1 className="font-semibold"> Comments</h1>
        </div>
        <textarea
          value={replyingTo ? "" : replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Add a comment... (be polite and concise)"
          rows={4}
          maxLength={1000}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          disabled={!!replyingTo}
        />
        <div className="flex items-center justify-between">
          <div>
           <button
  onClick={() => setShowCommentsList((v) => !v)}
  className="px-3 py-2 rounded bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-200 transition"
  type="button"
>
  {showCommentsList ? <IoChevronUp /> : <IoChevronDown />}
  {showCommentsList
    ? `Hide Comments (${comments.length})`
    : `Show Comments (${comments.length})`}
</button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReplyText("")}
              className="px-4 py-2 bg-gray-100 text-slate-700 rounded-md hover:bg-gray-200 text-sm"
              disabled={!!replyingTo}
            >
              Clear
            </button>
            <button
              onClick={() => {
                if (!replyText.trim()) return;
                handlePostComment(replyText, null);
              }}
              disabled={postingComment || !replyText.trim() || !!replyingTo}
              className={`px-4 py-2 rounded-md text-sm font-semibold ${
                postingComment || replyingTo
                  ? "bg-gray-300 text-slate-600 cursor-not-allowed"
                  : "bg-[#036173] text-white hover:bg-[#024f57]"
              }`}
            >
              {postingComment ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      {showCommentsList && (
        <div className="pt-2 border-t border-slate-100">
          {commentsLoading ? (
            <div className="py-6 text-center text-slate-500">
              Loading comments...
            </div>
          ) : rootComments.length > 0 ? (
            <>
              <ul className="space-y-3">
                {paginatedRoot.map((c) => (
                  <li key={c.id}>{renderComment(c)}</li>
                ))}
              </ul>
              {/* Pagination controls */}
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageIndex = i + 1;
                  return (
                    <button
                      key={pageIndex}
                      onClick={() => setPage(pageIndex)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        page === pageIndex
                          ? "bg-[#036173] text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {pageIndex}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-slate-500">
              No comments yet. Be the first to comment.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentThread;
