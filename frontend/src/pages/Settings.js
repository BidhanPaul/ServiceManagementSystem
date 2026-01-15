// src/pages/Settings.js
import { useState } from "react";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

export default function Settings() {
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");

  const [topic, setTopic] = useState("PASSWORD_RESET");
  const [message, setMessage] = useState("");

  const sendToAdmin = async () => {
    if (!username) {
      toast.error("No user logged in.");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write your message.");
      return;
    }

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
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300 p-6">
        <TopNav />

        <div className="max-w-3xl mt-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Settings / Help
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Contact Admin for help (password reset, profile update, delete wrong request, etc.).
          </p>

          <div className="mt-6 bg-white/80 backdrop-blur-md border border-white/80 shadow rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Contact Admin
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  From
                </label>
                <div className="mt-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800">
                  {username} ({role})
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm"
                >
                  <option value="PASSWORD_RESET">Password change / reset</option>
                  <option value="UPDATE_PROFILE">Update my info</option>
                  <option value="DELETE_WRONG_REQUEST">Delete wrong request</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <label className="text-xs font-semibold text-slate-600">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder='Example: "Please delete request #20, created by mistake"'
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={sendToAdmin}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow hover:bg-indigo-700 transition"
                type="button"
              >
                Send to Admin
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3">
              This sends as a Direct Message thread to all Admins and keeps a copy in your DM thread.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
