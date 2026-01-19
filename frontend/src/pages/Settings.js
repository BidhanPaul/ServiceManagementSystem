// src/pages/Settings.js
import { useState } from "react";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { toast } from "react-toastify";
import { FiKey, FiUser, FiTrash2, FiHelpCircle, FiSend } from "react-icons/fi";

export default function Settings() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const [topic, setTopic] = useState("PASSWORD_RESET");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const sendToAdmin = async () => {
    if (!username) {
      toast.error("No user logged in.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write your message.");
      return;
    }

    setSending(true);
    try {
      // ✅ DM format so it shows in DM Threads (your Notifications.js parser)
      // We send to role ADMIN so ANY admin account receives it (no hardcoded username).
      const dmText = `Support Request (${topic}) from ${username} [${role}]: ${message}`;
      const dm = `DM:from=${username};to=ADMIN;req=SUPPORT; ${dmText}`;

      // ✅ send to all admins as a DM
      await API.post("/notifications/role/ADMIN", dm, {
        headers: { "Content-Type": "text/plain" },
      });

      // ✅ save copy to sender so it appears in sender thread too
      await API.post(`/notifications/user/${username}`, dm, {
        headers: { "Content-Type": "text/plain" },
      });

      toast.success("Sent to Admin.");
      setMessage("");
    } catch (err) {
      console.error("Failed to contact admin", err?.response || err);

      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unknown error";

      toast.error(`Failed to send (${status || "no status"}): ${msg}`);
    } finally {
      setSending(false);
    }
  };

  const TopicPill = ({ value, label, icon }) => {
    const active = topic === value;
    return (
      <button
        type="button"
        onClick={() => setTopic(value)}
        className={
          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition " +
          (active
            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
            : "bg-white/70 text-slate-700 border-slate-200 hover:bg-white hover:text-slate-900")
        }
      >
        <span
          className={
            "p-1.5 rounded-lg border " +
            (active
              ? "bg-white/10 border-white/20"
              : "bg-slate-50 border-slate-200")
          }
        >
          {icon}
        </span>
        {label}
      </button>
    );
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* ✅ more enterprise gradient */}
      <div className="flex-1 min-h-screen bg-gradient-to-b from-slate-50 via-sky-50 to-indigo-100">
        <div className="p-6">
          {/* ✅ sticky topbar */}
          <div className="sticky top-0 z-30">
            <TopNav />
          </div>

          <div className="max-w-3xl mt-4">
            {/* Header */}
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-sm px-5 py-4">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                Settings / Help
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Contact Admin for help (password reset, profile update, delete wrong request, etc.).
              </p>
            </div>

            {/* Card */}
            <div className="mt-5 bg-white/80 backdrop-blur-xl border border-white/70 shadow rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Contact Admin
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sends a Direct Message to all Admins and keeps a copy in your DM thread.
                  </p>
                </div>

                <button
                  onClick={sendToAdmin}
                  disabled={sending}
                  className={
                    "inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow transition " +
                    (sending
                      ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700")
                  }
                  type="button"
                >
                  <FiSend />
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>

              {/* From + Topic */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    From
                  </label>
                  <div className="mt-1 px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 text-sm text-slate-800">
                    {username} ({role})
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Topic
                  </label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <TopicPill
                      value="PASSWORD_RESET"
                      label="Password reset"
                      icon={<FiKey className="text-sm" />}
                    />
                    <TopicPill
                      value="UPDATE_PROFILE"
                      label="Update profile"
                      icon={<FiUser className="text-sm" />}
                    />
                    <TopicPill
                      value="DELETE_WRONG_REQUEST"
                      label="Delete request"
                      icon={<FiTrash2 className="text-sm" />}
                    />
                    <TopicPill
                      value="OTHER"
                      label="Other"
                      icon={<FiHelpCircle className="text-sm" />}
                    />
                  </div>

                  {/* keep value synced with your existing logic */}
                  <input type="hidden" value={topic} readOnly />
                </div>
              </div>

              {/* Message */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-600">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                  placeholder='Example: "Please delete request #20, created by mistake"'
                />
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                  <span>
                    Tip: include Request No / ID for faster resolution.
                  </span>
                  <span>{message.length} chars</span>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex justify-end mt-5">
                <button
                  onClick={sendToAdmin}
                  disabled={sending}
                  className={
                    "inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow transition " +
                    (sending
                      ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700")
                  }
                  type="button"
                >
                  <FiSend />
                  {sending ? "Sending..." : "Send to Admin"}
                </button>
              </div>
            </div>

            {/* Small footer note */}
            <p className="mt-3 text-xs text-slate-600">
              Your message will appear in <b>Notifications → Direct Messages</b>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
