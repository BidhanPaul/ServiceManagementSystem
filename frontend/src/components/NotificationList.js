// src/components/NotificationList.js
import { FiClock, FiCheckCircle, FiBell } from "react-icons/fi";

function formatDate(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString();
}

export default function NotificationList({ notifications, onMarkAsRead }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/40">
        <div className="flex items-center gap-3 text-gray-500">
          <FiBell />
          <span>No notifications yet.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/40">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <FiBell className="text-blue-500" />
        Admin Activity
      </h2>

      <div className="relative pl-4 border-l border-blue-100">
        {notifications.map((n, idx) => (
          <div
            key={n.id}
            className={`mb-5 pl-4 relative ${
              idx === notifications.length - 1 ? "pb-0" : "pb-3"
            }`}
          >
            {/* Dot in the timeline */}
            <span
              className={`w-3 h-3 rounded-full border-2 absolute -left-[9px] top-1 ${
                n.read
                  ? "bg-white border-blue-200"
                  : "bg-blue-500 border-blue-600"
              }`}
            />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p
                  className={`${
                    n.read ? "text-gray-500" : "text-gray-800"
                  } font-medium`}
                >
                  {n.message}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <FiClock />
                  <span>{formatDate(n.sentAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!n.read && (
                  <button
                    onClick={() => onMarkAsRead(n.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1 rounded-full
                               bg-blue-500 text-white hover:bg-blue-600 transition"
                  >
                    <FiCheckCircle />
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
