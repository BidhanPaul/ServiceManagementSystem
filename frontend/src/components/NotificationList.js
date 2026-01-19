import { useMemo, useState } from "react";
import { FiClock, FiCheckCircle, FiBell } from "react-icons/fi";

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString();
}

export default function NotificationList({
  notifications,
  onMarkAsRead,
  title = "Notifications",
}) {
  const [tab, setTab] = useState("ALL"); // ALL | UNREAD | READ

  const counts = useMemo(() => {
    const all = notifications?.length || 0;
    const unread = (notifications || []).filter((n) => !n.read).length;
    const read = all - unread;
    return { all, unread, read };
  }, [notifications]);

  const filtered = useMemo(() => {
    const list = notifications || [];
    if (tab === "UNREAD") return list.filter((n) => !n.read);
    if (tab === "READ") return list.filter((n) => n.read);
    return list;
  }, [notifications, tab]);

  const TabButton = ({ value, label, count }) => {
    const active = tab === value;
    return (
      <button
        type="button"
        onClick={() => setTab(value)}
        className={
          "px-3 py-1.5 rounded-xl text-xs font-semibold border transition " +
          (active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white/60 text-slate-700 border-slate-200 hover:bg-white hover:text-slate-900")
        }
      >
        {label}
        <span
          className={
            "ml-2 inline-flex items-center justify-center min-w-[24px] px-2 h-5 rounded-full text-[11px] " +
            (active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700")
          }
        >
          {count}
        </span>
      </button>
    );
  };

  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="bg-slate-100 p-3 rounded-full ring-1 ring-slate-200">
            <FiBell className="text-slate-700 text-xl" />
          </div>
          <span className="text-slate-700 font-medium">
            No notifications yet.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-3 rounded-full ring-1 ring-slate-200">
            <FiBell className="text-slate-700 text-xl" />
          </div>
          <div className="leading-tight">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900">
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {counts.unread} unread • {counts.all} total
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <TabButton value="ALL" label="All" count={counts.all} />
          <TabButton value="UNREAD" label="Unread" count={counts.unread} />
          <TabButton value="READ" label="Read" count={counts.read} />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-5 border-l border-slate-200">
        {filtered.map((n, idx) => (
          <div
            key={n.id}
            className={`mb-5 pl-4 relative ${idx === filtered.length - 1 ? "mb-1" : ""}`}
          >
            {/* Dot */}
            <span
              className={
                "w-3 h-3 rounded-full absolute -left-[7px] top-2 border " +
                (n.read
                  ? "bg-white border-slate-300"
                  : "bg-blue-600 border-blue-700 shadow-[0_0_0_4px_rgba(37,99,235,0.15)]")
              }
            />

            {/* Card */}
            <div
              className={
                "p-3 rounded-xl border shadow-sm transition " +
                (n.read
                  ? "bg-white/70 border-slate-200"
                  : "bg-white border-blue-200")
              }
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={
                      "text-sm md:text-base font-medium break-words " +
                      (n.read ? "text-slate-600" : "text-slate-900")
                    }
                  >
                    {n.message}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <FiClock className="text-slate-400" />
                    <span>{formatDate(n.sentAt)}</span>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => onMarkAsRead(n.id)}
                    className="
                      inline-flex items-center gap-2
                      px-3 py-1.5 rounded-lg text-xs font-semibold
                      bg-blue-600 text-white
                      hover:bg-blue-700
                      transition
                      self-start
                    "
                    type="button"
                  >
                    <FiCheckCircle className="text-sm" />
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
