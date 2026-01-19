// src/pages/Notifications.js
import { useEffect, useMemo, useRef, useState } from "react";
import API from "../api/api";
import MainLayout from "../layout/MainLayout";
import {
  FiBell,
  FiCheckCircle,
  FiMessageSquare,
  FiChevronRight,
  FiSearch,
  FiSend,
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

// ✅ Extract participants from threadKey
function extractUsersFromThreadKey(threadKey) {
  if (!threadKey || typeof threadKey !== "string") return [];

  const m1 = threadKey.match(/^REQ-(.*?):([^:]+)-([^:]+)$/);
  if (m1) return [m1[2], m1[3]].filter(Boolean);

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
    const threadKey = `REQ:${legacy.req}|U:${users[0] || "?"}|${
      users[1] || "?"
    }`;
    return { ...legacy, threadKey, fromRole: "", toRole: "", _source: "LEGACY" };
  }

  return null;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("DM");

  // Slack style
  const [selectedThreadKey, setSelectedThreadKey] = useState(null);
  const [threadQuery, setThreadQuery] = useState("");

  // ✅ Inline composer
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);

  const [requestTitleById, setRequestTitleById] = useState({});

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  // ✅ Auto-scroll anchor
  const messagesEndRef = useRef(null);

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
        if (n.category === "DIRECT_MESSAGE")
          return n.recipientUsername === username;
        return true;
      });

      if (unreadActionable.length === 0) {
        toast.info("No unread notifications.");
        return;
      }

      await Promise.all(
        unreadActionable.map((n) => API.post(`/notifications/${n.id}/read`))
      );

      const unreadIds = new Set(unreadActionable.map((n) => n.id));
      setNotifications((prev) =>
        prev.map((n) => (unreadIds.has(n.id) ? { ...n, read: true } : n))
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

  const systemUnreadCount = useMemo(
    () => (systemItems || []).filter((n) => !n.read).length,
    [systemItems]
  );

  const dmThreads = useMemo(() => {
    const map = new Map();

    for (const n of dmFlatItems) {
      const dm = normalizeDmNotification(n);
      if (!dm) continue;

      const key = dm.threadKey || "NO_THREAD";
      if (!map.has(key)) {
        map.set(key, {
          key,
          reqId: dm.req || "",
          participants: [],
          messages: [],
        });
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

  // auto-select first thread if none selected
  useEffect(() => {
    if (activeTab !== "DM") return;
    if (!dmThreads.length) {
      setSelectedThreadKey(null);
      return;
    }
    if (
      selectedThreadKey &&
      dmThreads.some((t) => t.key === selectedThreadKey)
    )
      return;
    setSelectedThreadKey(dmThreads[0].key);
    // eslint-disable-next-line
  }, [activeTab, dmThreads.map((t) => t.key).join("|")]);

  // load request titles for DM threads
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

  const getThreadUnreadCount = (thread) => {
    return (thread?.messages || []).filter(
      (m) => m?.dm?.from !== username && !m.read
    ).length;
  };

  const filteredThreads = useMemo(() => {
    const q = (threadQuery || "").trim().toLowerCase();
    if (!q) return dmThreads;

    return (dmThreads || []).filter((t) => {
      const title = (
        requestTitleById[t.reqId] || `Request #${t.reqId || ""}`
      ).toLowerCase();
      const participants = (t.participants || []).join(" ").toLowerCase();
      return (
        title.includes(q) ||
        participants.includes(q) ||
        String(t.reqId || "").includes(q)
      );
    });
  }, [dmThreads, threadQuery, requestTitleById]);

  const selectedThread = useMemo(() => {
    if (!selectedThreadKey) return null;
    return (dmThreads || []).find((t) => t.key === selectedThreadKey) || null;
  }, [dmThreads, selectedThreadKey]);

  // ✅ Auto-scroll when thread changes OR when message count changes
  useEffect(() => {
    if (!selectedThread) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // eslint-disable-next-line
  }, [
    selectedThreadKey,
    selectedThread ? selectedThread.messages.length : 0,
  ]);

  // Determine recipient for inline send
  const getReplyTargetFromThread = (thread) => {
    if (!thread) return null;

    const participants = thread.participants || [];
    const otherUsername = participants.find((u) => u && u !== username);
    if (!otherUsername) return null;

    const last = thread.messages?.[thread.messages.length - 1];
    const otherRole =
      last?.dm?.from === otherUsername
        ? last?.dm?.fromRole
        : last?.dm?.to === otherUsername
        ? last?.dm?.toRole
        : null;

    return {
      otherUsername,
      otherRole,
      reqId: thread.reqId || "",
      threadKey: thread.key,
    };
  };

  const sendInlineMessage = async () => {
    if (!selectedThread) {
      toast.error("Select a conversation first.");
      return;
    }
    if (!composerText.trim()) {
      toast.error("Write a message.");
      return;
    }

    const target = getReplyTargetFromThread(selectedThread);
    if (!target?.otherUsername) {
      toast.error("Could not determine who to reply to.");
      return;
    }

    try {
      setSending(true);
      await API.post(
        "/notifications/direct-message",
        {
          threadKey: target.threadKey,
          requestId: String(target.reqId || ""),
          senderUsername: username,
          senderRole: role,
          recipientUsername: target.otherUsername,
          recipientRole: target.otherRole || "PROJECT_MANAGER",
          message: composerText.trim(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      setComposerText("");
      toast.success("Message sent.");
      await loadNotifications();

      // ✅ ensure we land at bottom after refresh
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      console.error("Failed to send message", err?.response || err);
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const unreadCountAll = useMemo(() => {
    return (notifications || []).filter((n) => {
      if (n.read) return false;
      if (n.category === "DIRECT_MESSAGE")
        return n.recipientUsername === username;
      return true;
    }).length;
  }, [notifications, username]);

  const renderSystemCard = (n) => (
    <div
      key={n.id}
      className={
        "p-4 rounded-2xl border shadow-sm transition " +
        (n.read
          ? "bg-white/60 border-slate-200 text-slate-600"
          : "bg-white border-blue-200 text-slate-900")
      }
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">System Notification</p>
          <p className="mt-2 text-sm break-words">{n.message}</p>
          <p className="text-xs text-slate-500 mt-2">
            {n.sentAt ? new Date(n.sentAt).toLocaleString() : ""}
          </p>
        </div>

        {!n.read ? (
          <button
            onClick={() => markRead(n.id)}
            className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition whitespace-nowrap"
            type="button"
          >
            Mark as Read
          </button>
        ) : (
          <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold whitespace-nowrap">
            <FiCheckCircle /> Read
          </span>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="h-[calc(100vh-120px)] flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                <FiBell className="text-blue-600" /> Notifications
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Direct Messages and System notifications in one place.
              </p>
            </div>

            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white shadow hover:bg-blue-700 transition"
              type="button"
            >
              Mark ALL as Read ({unreadCountAll})
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setActiveTab("DM")}
              className={
                "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition " +
                (activeTab === "DM"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white/70 text-slate-700 border-slate-200 hover:bg-white")
              }
              type="button"
            >
              <FiMessageSquare />
              Direct Messages ({dmThreads.length})
            </button>

            <button
              onClick={() => setActiveTab("SYSTEM")}
              className={
                "relative px-4 py-2 rounded-xl text-sm font-semibold border transition " +
                (activeTab === "SYSTEM"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white/70 text-slate-700 border-slate-200 hover:bg-white")
              }
              type="button"
            >
              {systemUnreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
                  {systemUnreadCount}
                </span>
              )}
              System ({systemItems.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 mt-4">
          {activeTab === "SYSTEM" ? (
            <div className="h-full overflow-y-auto pr-1">
              <div className="space-y-4 max-w-4xl">
                {systemItems.length === 0 ? (
                  <div className="text-center text-slate-600 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
                    No system notifications found.
                  </div>
                ) : (
                  systemItems.map((n) => renderSystemCard(n))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Thread list */}
              <div className="lg:col-span-4 bg-white/70 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
                <div className="p-3 border-b border-slate-200 bg-white/70">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-900 text-white">
                      <FiSearch />
                    </div>
                    <input
                      value={threadQuery}
                      onChange={(e) => setThreadQuery(e.target.value)}
                      placeholder="Search threads (title / user / id)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300/60"
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  {filteredThreads.length === 0 ? (
                    <div className="p-4 text-sm text-slate-600">
                      No conversations match your search.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {filteredThreads.map((t) => {
                        const reqTitle =
                          requestTitleById[t.reqId] ||
                          `Request #${t.reqId || "—"}`;

                        const other =
                          (t.participants || []).find(
                            (u) => u && u !== username
                          ) || "-";

                        const last = t.messages?.[t.messages.length - 1];
                        const lastText = last?.dm?.text || "";
                        const unread = getThreadUnreadCount(t);

                        const selected = t.key === selectedThreadKey;

                        return (
                          <button
                            key={t.key}
                            onClick={() => {
                              setSelectedThreadKey(t.key);
                              setComposerText("");
                            }}
                            className={
                              "w-full text-left p-4 transition " +
                              (selected
                                ? "bg-slate-900 text-white"
                                : "hover:bg-slate-50 text-slate-900")
                            }
                            type="button"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className={
                                    "font-semibold text-sm break-words " +
                                    (selected
                                      ? "text-white"
                                      : "text-slate-900")
                                  }
                                >
                                  {reqTitle}
                                </p>
                                <p
                                  className={
                                    "text-xs mt-0.5 " +
                                    (selected
                                      ? "text-white/80"
                                      : "text-slate-600")
                                  }
                                >
                                  {other} • Request ID: {t.reqId || "—"}
                                </p>
                                <p
                                  className={
                                    "text-xs mt-1 truncate " +
                                    (selected
                                      ? "text-white/80"
                                      : "text-slate-500")
                                  }
                                >
                                  {lastText}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {unread > 0 && (
                                  <span
                                    className={
                                      "text-[11px] font-bold px-2 py-0.5 rounded-full " +
                                      (selected
                                        ? "bg-white text-slate-900"
                                        : "bg-blue-600 text-white")
                                    }
                                  >
                                    {unread}
                                  </span>
                                )}
                                <FiChevronRight
                                  className={
                                    selected
                                      ? "text-white/80"
                                      : "text-slate-400"
                                  }
                                />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Messages + Inline composer */}
              <div className="lg:col-span-8 bg-white/70 border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
                {!selectedThread ? (
                  <div className="p-6 text-slate-700">
                    Select a conversation to view messages.
                  </div>
                ) : (
                  <>
                    {/* Conversation header */}
                    <div className="p-4 border-b border-slate-200 bg-white/70">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-slate-900 break-words">
                          {requestTitleById[selectedThread.reqId] ||
                            `Request #${selectedThread.reqId || "—"}`}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Participants:{" "}
                          <span className="font-medium">
                            {(selectedThread.participants || []).join(" , ") ||
                              "-"}
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Request ID: {selectedThread.reqId || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Messages list */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                      {selectedThread.messages.map((m) => {
                        const isMine = m.dm?.from === username;

                        return (
                          <div
                            key={m.id}
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={
                                "max-w-[78%] border rounded-2xl p-3 shadow-sm " +
                                (isMine
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-900 border-slate-200")
                              }
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                  <p className="text-[11px] opacity-80">
                                    {isMine ? "You" : m.dm?.from || "-"}
                                  </p>

                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                                    {m.dm?.text || ""}
                                  </p>

                                  <p
                                    className={`text-[11px] mt-2 ${
                                      isMine
                                        ? "text-white/70"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {m.sentAt
                                      ? new Date(m.sentAt).toLocaleString()
                                      : ""}
                                  </p>
                                </div>

                                {!isMine && !m.read ? (
                                  <button
                                    onClick={() => markRead(m.id)}
                                    className="bg-blue-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-blue-700 transition whitespace-nowrap"
                                    type="button"
                                  >
                                    Mark as Read
                                  </button>
                                ) : !isMine && m.read ? (
                                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold whitespace-nowrap">
                                    <FiCheckCircle /> Read
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* ✅ scroll anchor */}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* ✅ Inline composer */}
                    <div className="p-3 border-t border-slate-200 bg-white/70">
                      <div className="flex items-end gap-2">
                        <textarea
                          value={composerText}
                          onChange={(e) => setComposerText(e.target.value)}
                          rows={2}
                          placeholder="Type a message… (Enter = send, Shift+Enter = new line)"
                          className="flex-1 resize-none bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/60"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (!sending) sendInlineMessage();
                            }
                          }}
                        />

                        <button
                          onClick={sendInlineMessage}
                          disabled={sending || !composerText.trim()}
                          className={
                            "px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2 transition " +
                            (sending || !composerText.trim()
                              ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow")
                          }
                          type="button"
                          title="Send"
                        >
                          <FiSend />
                          {sending ? "Sending..." : "Send"}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2">
                        No popup. This sends to the same threadKey.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
