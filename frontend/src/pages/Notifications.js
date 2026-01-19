// src/pages/Notifications.js
<<<<<<< HEAD

import { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import TopNav from "../components/TopNav";
import { FiBell, FiCheckCircle } from "react-icons/fi";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);

    // User context (retrieved once)
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role"); // ADMIN, PM, PO, RP

    // ---------------------------------------------------------
    // LOAD NOTIFICATIONS BASED ON USER ROLE
    // ---------------------------------------------------------
    const loadNotifications = useCallback(async () => {
        if (!role) {
            console.warn("User role not found. Skipping notifications fetch.");
            return;
        }

        try {
            let endpoint = `/notifications/${role}`;

            if (role === "ADMIN") {
                endpoint = "/notifications/admin";
            }

            const res = await API.get(endpoint);
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to load notifications", e
=======
import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import TopNav from "../components/TopNav";
import Sidebar from "../layout/Sidebar";
import {
  FiBell,
  FiCheckCircle,
  FiMessageSquare,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { toast } from "react-toastify";

/**
 * OLD DM format (legacy):
 * DM:from=<user>;to=<user>;req=<id>; <text>
 */
function parseLegacyDm(message) {
  if (!message || typeof message !== "string") return null;
  if (!message.startsWith("DM:")) return null;

  const raw = message.slice(3).trim();
  const parts = raw.split(";");

  const fromPart = parts.find((p) => p.trim().startsWith("from="));
  const toPart = parts.find((p) => p.trim().startsWith("to="));
  const reqPart = parts.find((p) => p.trim().startsWith("req="));

  const from = fromPart ? fromPart.trim().replace("from=", "") : "";
  const to = toPart ? toPart.trim().replace("to=", "") : "";
  const req = reqPart ? reqPart.trim().replace("req=", "") : "";

  const text = parts.length >= 4 ? parts.slice(3).join(";").trim() : "";
  return { from, to, req, text };
}

// ✅ Extract participants from threadKey (works even if DB row is broken/self-copy)
function extractUsersFromThreadKey(threadKey) {
  if (!threadKey || typeof threadKey !== "string") return [];

  // format 1: REQ-25:John-Mausam
  const m1 = threadKey.match(/^REQ-(.*?):([^:]+)-([^:]+)$/);
  if (m1) return [m1[2], m1[3]].filter(Boolean);

  // format 2: REQ:SUPPORT|U:Bidhan|Paul
  const m2 = threadKey.match(/\|U:([^|]+)\|([^|]+)$/);
  if (m2) return [m2[1], m2[2]].filter(Boolean);

  return [];
}

// Normalize notification -> DM object
function normalizeDmNotification(n) {
  if (!n) return null;

  if (n.category === "DIRECT_MESSAGE") {
    const from = n.senderUsername || "";
    const to = n.recipientUsername || "";
    const req = (n.requestId ?? "").toString();
    const text = n.message || "";

    const fromRole = n.senderRole || "";
    const toRole = n.recipientRole || "";

    const users = [from, to].filter(Boolean).sort();
    const threadKey =
      n.threadKey || `REQ-${req}:${users[0] || "?"}-${users[1] || "?"}`;

    return { from, to, req, text, threadKey, fromRole, toRole, _source: "NEW" };
  }

  const legacy = parseLegacyDm(n.message);
  if (legacy) {
    const users = [legacy.from, legacy.to].filter(Boolean).sort();
    const threadKey = `REQ:${legacy.req}|U:${users[0] || "?"}|${users[1] || "?"}`;
    return { ...legacy, threadKey, fromRole: "", toRole: "", _source: "LEGACY" };
  }

  return null;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("DM");

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);

  const [expandedThreads, setExpandedThreads] = useState(() => ({}));
  const [requestTitleById, setRequestTitleById] = useState({});

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  const loadNotifications = async () => {
    try {
      let endpoint = null;

      if (role === "ADMIN") endpoint = "/notifications/admin";
      else {
        if (!username) return;
        endpoint = `/notifications/user/${username}`;
      }

      const res = await API.get(endpoint);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setNotifications([]);
    }
  };

  const markRead = async (id) => {
    try {
      await API.post(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
      toast.error("Failed to mark as read.");
    }
  };

  // ✅ Mark ALL as read: ONLY incoming unread (system + incoming DM)
  const markAllAsRead = async () => {
    try {
      const unreadActionable = (notifications || []).filter((n) => {
        if (n.read) return false;

        // DM: only mark if I am recipient (incoming)
        if (n.category === "DIRECT_MESSAGE") {
          return n.recipientUsername === username;
        }

        // SYSTEM: mark it
        return true;
      });

      if (unreadActionable.length === 0) {
        toast.info("No unread notifications.");
        return;
      }

      await Promise.all(
        unreadActionable.map((n) => API.post(`/notifications/${n.id}/read`))
      );

      setNotifications((prev) =>
        prev.map((n) =>
          unreadActionable.some((u) => u.id === n.id ? true : false)
            ? { ...n, read: true }
            : n
        )
      );

      toast.success("All notifications marked as read.");
    } catch (err) {
      console.error("Failed to mark all as read", err);
      toast.error("Failed to mark all as read.");
    }
  };

  const dmFlatItems = useMemo(() => {
    return (notifications || []).filter((n) => normalizeDmNotification(n));
  }, [notifications]);

  const systemItems = useMemo(() => {
    return (notifications || []).filter((n) => !normalizeDmNotification(n));
  }, [notifications]);

  // ✅ system unread indicators
  const systemUnreadCount = useMemo(
    () => (systemItems || []).filter((n) => !n.read).length,
    [systemItems]
  );
  const hasUnreadSystem = systemUnreadCount > 0;

  const dmThreads = useMemo(() => {
    const map = new Map();

    for (const n of dmFlatItems) {
      const dm = normalizeDmNotification(n);
      if (!dm) continue;

      const key = dm.threadKey || "NO_THREAD";
      if (!map.has(key)) {
        map.set(key, { key, reqId: dm.req || "", participants: [], messages: [] });
      }

      map.get(key).messages.push({
        id: n.id,
        sentAt: n.sentAt,
        read: n.read,
        dm,
      });
    }

    const threads = Array.from(map.values()).map((t) => {
      const sorted = [...t.messages].sort((a, b) => {
        const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0;
        const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0;
        return ta - tb;
      });

      const people = new Set();
      for (const m of sorted) {
        if (m?.dm?.from) people.add(m.dm.from);
        if (m?.dm?.to) people.add(m.dm.to);
      }

      extractUsersFromThreadKey(t.key).forEach((u) => people.add(u));

      return { ...t, participants: Array.from(people), messages: sorted };
    });

    threads.sort((a, b) => {
      const la = a.messages[a.messages.length - 1]?.sentAt
        ? new Date(a.messages[a.messages.length - 1].sentAt).getTime()
        : 0;
      const lb = b.messages[b.messages.length - 1]?.sentAt
        ? new Date(b.messages[b.messages.length - 1].sentAt).getTime()
        : 0;
      return lb - la;
    });

    return threads;
  }, [dmFlatItems]);

  useEffect(() => {
    const ids = Array.from(
      new Set(
        dmThreads
          .map((t) => (t.reqId || "").trim())
          .filter((id) => /^\d+$/.test(id))
      )
    );

    const missing = ids.filter((id) => !requestTitleById[id]);
    if (missing.length === 0) return;

    const loadTitles = async () => {
      const entries = await Promise.all(
        missing.map(async (id) => {
          try {
            const r = await API.get(`/requests/${id}`);
            return [id, r?.data?.title || `Request #${id}`];
          } catch {
            return [id, `Request #${id}`];
          }
        })
      );

      setRequestTitleById((prev) => {
        const next = { ...prev };
        for (const [id, title] of entries) next[id] = title;
        return next;
      });
    };

    loadTitles();
    // eslint-disable-next-line
  }, [dmThreads]);

  const toggleThread = (threadKey) => {
    setExpandedThreads((prev) => ({ ...prev, [threadKey]: !prev[threadKey] }));
  };

  const openReplyForThread = (thread) => {
    if (!thread) return;

    const participants = thread.participants || [];
    const otherUsername = participants.find((u) => u && u !== username);

    if (!otherUsername) {
      toast.error("Could not determine who to reply to.");
      return;
    }

    const last = thread.messages?.[thread.messages.length - 1];
    const otherRole =
      last?.dm?.from === otherUsername
        ? last?.dm?.fromRole
        : last?.dm?.to === otherUsername
        ? last?.dm?.toRole
        : null;

    setReplyTarget({
      otherUsername,
      otherRole,
      reqId: thread.reqId || "",
      threadKey: thread.key,
    });

    setReplyText("");
    setReplyOpen(true);
  };

  const sendReply = async () => {
    if (!replyTarget?.otherUsername) {
      toast.error("No recipient found for reply.");
      return;
    }
    if (!replyText.trim()) {
      toast.error("Write a message.");
      return;
    }

    try {
      await API.post(
        "/notifications/direct-message",
        {
          threadKey: replyTarget.threadKey,
          requestId: String(replyTarget.reqId || ""),
          senderUsername: username,
          senderRole: role,
          recipientUsername: replyTarget.otherUsername,
          recipientRole: replyTarget.otherRole || "PROJECT_MANAGER",
          message: replyText.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Message sent.");
      setReplyText("");
      loadNotifications();
    } catch (err) {
      console.error("Failed to send reply", err?.response || err);
      toast.error("Failed to send reply.");
    }
  };

  const renderSystemCard = (n) => (
    <div
      key={n.id}
      className={`p-4 rounded-2xl border shadow-sm backdrop-blur-md transition 
        ${
          n.read
            ? "bg-white/40 border-white/50 text-slate-600"
            : "bg-white/70 border-white/80 shadow-lg text-slate-900"
        }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col">
          <p className="font-semibold">System Notification</p>
          <p className="mt-2">{n.message}</p>
          <p className="text-xs text-slate-500 mt-2">
            {n.sentAt ? new Date(n.sentAt).toLocaleString() : ""}
          </p>
        </div>

        {!n.read ? (
          <button
            onClick={() => markRead(n.id)}
            className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-full shadow hover:bg-blue-700 transition whitespace-nowrap"
            type="button"
          >
            Mark as Read
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium whitespace-nowrap">
            <FiCheckCircle /> Read
          </span>
        )}
      </div>
    </div>
  );

  const getThreadUnreadCount = (thread) => {
    return (thread?.messages || []).filter(
      (m) => m?.dm?.from !== username && !m.read
    ).length;
  };
  const threadHasUnread = (thread) => getThreadUnreadCount(thread) > 0;

  const renderThread = (thread) => {
    const reqTitle =
      requestTitleById[thread.reqId] || `Request #${thread.reqId || "—"}`;

    const other =
      (thread.participants || []).find((u) => u && u !== username) || "-";
    const me = username || "-";

    const expanded = !!expandedThreads[thread.key];

    return (
      <div
        key={thread.key}
        className="bg-white/70 border border-white/80 shadow-lg rounded-2xl"
      >
        {/* ✅ Sticky thread header (only matters when expanded) */}
        <div
          className={`p-4 ${expanded ? "sticky top-0 z-10 bg-white/90 backdrop-blur-md rounded-t-2xl border-b border-white/70" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-900">{reqTitle}</p>

                {threadHasUnread(thread) && (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow" />
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                      {getThreadUnreadCount(thread)}
                    </span>
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 mt-0.5">
                Conversation: <span className="font-medium">{me}</span> ↔{" "}
                <span className="font-medium">{other}</span>
              </p>

              <p className="text-xs text-slate-500 mt-1">
                Request ID: {thread.reqId}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleThread(thread.key)}
                className="px-4 py-2 rounded-full text-xs font-semibold bg-white/80 border border-slate-200 hover:bg-white transition flex items-center gap-2"
                type="button"
              >
                {expanded ? <FiChevronDown /> : <FiChevronRight />}
                {expanded ? "Collapse" : "Expand"}
              </button>

              <button
                onClick={() => openReplyForThread(thread)}
                className="bg-indigo-600 text-white text-xs font-medium px-4 py-2 rounded-full shadow hover:bg-indigo-700 transition whitespace-nowrap"
                type="button"
              >
                Reply
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Scrollable message area when expanded */}
        {expanded && (
          <div className="px-4 pb-4">
            <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto pr-2">
              {thread.messages.map((m) => {
                const isMine = m.dm?.from === username;

                return (
                  <div
                    key={m.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] border rounded-2xl p-3 shadow-sm ${
                        isMine
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-900 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <p className="text-[11px] opacity-90">
                            {isMine ? "You" : m.dm?.from || "-"}
                          </p>

                          <p className="mt-1 whitespace-pre-wrap">
                            {m.dm?.text || ""}
                          </p>

                          <p
                            className={`text-[11px] mt-2 ${
                              isMine ? "text-white/80" : "text-slate-500"
                            }`}
                          >
                            {m.sentAt ? new Date(m.sentAt).toLocaleString() : ""}
                          </p>
                        </div>

                        {!isMine && !m.read ? (
                          <button
                            onClick={() => markRead(m.id)}
                            className="bg-blue-600 text-white text-[11px] font-medium px-3 py-1.5 rounded-full shadow hover:bg-blue-700 transition whitespace-nowrap"
                            type="button"
                          >
                            Mark as Read
                          </button>
                        ) : !isMine && m.read ? (
                          <span className="flex items-center gap-1 text-[11px] text-green-600 font-medium whitespace-nowrap">
                            <FiCheckCircle /> Read
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const itemsToShow = activeTab === "DM" ? dmThreads : systemItems;

  // ✅ Page count should not include outgoing DM
  const unreadCountAll = useMemo(() => {
    return (notifications || []).filter((n) => {
      if (n.read) return false;
      if (n.category === "DIRECT_MESSAGE") return n.recipientUsername === username;
      return true;
    }).length;
  }, [notifications, username]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* ✅ page does NOT scroll; list scrolls */}
      <div className="flex-1 h-screen bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300 p-6 overflow-hidden">
        <TopNav />

        <div className="h-full flex flex-col">
          {/* ✅ Sticky header area */}
          <div className="sticky top-0 z-20 pb-4">
            <div className="mt-4 mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <FiBell className="text-blue-600" /> Notifications
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  System alerts and Direct Messages are separated below.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white shadow hover:bg-blue-700 transition"
                  type="button"
                >
                  Mark ALL as Read ({unreadCountAll})
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setActiveTab("DM")}
                className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 ${
                  activeTab === "DM"
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-white/70 text-slate-700 border border-white/80"
                }`}
                type="button"
              >
                <FiMessageSquare />
                Direct Messages ({dmThreads.length})
              </button>

              {/* ✅ System tab with RED DOT + unread count */}
              <button
                onClick={() => setActiveTab("SYSTEM")}
                className={`relative px-4 py-2 rounded-full text-sm font-semibold ${
                  activeTab === "SYSTEM"
                    ? "bg-blue-600 text-white shadow"
                    : "bg-white/70 text-slate-700 border border-white/80"
                }`}
                type="button"
              >
                {hasUnreadSystem && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 shadow" />
                )}

                {systemUnreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                    {systemUnreadCount}
                  </span>
                )}

                System ({systemItems.length})
              </button>
            </div>
          </div>

          {/* ✅ Scrollable content area */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-4 max-w-4xl">
              {itemsToShow.length === 0 && (
                <p className="text-center text-slate-600 text-lg bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-white/70 shadow">
                  No {activeTab === "DM" ? "direct messages" : "system notifications"} found.
                </p>
              )}

              {activeTab === "DM"
                ? itemsToShow.map((t) => renderThread(t))
                : itemsToShow.map((n) => renderSystemCard(n))}
            </div>
          </div>
        </div>

        {replyOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40">
            <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
              <h3 className="text-lg font-semibold mb-2 text-slate-900">
                Reply Message
              </h3>

              <p className="text-xs text-slate-600 mb-2">
                To:{" "}
                <span className="font-semibold">{replyTarget?.otherUsername}</span>
              </p>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400"
                placeholder="Write your message..."
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setReplyOpen(false);
                    setReplyTarget(null);
                    setReplyText("");
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  type="button"
                >
                  Close
                </button>

                <button
                  onClick={sendReply}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  type="button"
                >
                  Send
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-2">
                Tip: You can keep sending messages without waiting for a reply.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3
