import { FiClock, FiCheckCircle, FiBell } from "react-icons/fi";
import { memo, useMemo } from "react";

function formatDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleString();
}

const EmptyState = memo(function EmptyState() {
    return (
<<<<<<< HEAD
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center gap-3 text-gray-600">
                <div className="bg-blue-100 p-3 rounded-full">
                    <FiBell className="text-blue-700 text-xl" />
                </div>
                <span className="text-gray-700 font-medium">
                    No notifications yet.
                </span>
            </div>
=======
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="bg-blue-100 p-3 rounded-full">
            <FiBell className="text-blue-700 text-xl" />
          </div>
          <span className="text-gray-700 font-medium">No notifications yet.</span>
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3
        </div>
    );
});

<<<<<<< HEAD
const NotificationItem = memo(function NotificationItem({
    notification,
    isLast,
    onMarkAsRead,
}) {
    const { id, message, sentAt, read } = notification;

    return (
        <div
            className={`mb-7 pl-4 relative transition-all ${isLast ? "mb-2" : ""
                }`}
        >
            {/* Timeline Dot */}
            <span
                className={`w-3.5 h-3.5 rounded-full absolute -left-[10px] top-1.5 border-2 ${read
                        ? "bg-white border-blue-300"
                        : "bg-blue-600 border-blue-700 shadow-md"
                    }`}
=======
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
      {/* Title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-blue-100 p-3 rounded-full shadow-sm">
          <FiBell className="text-blue-700 text-xl" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          Admin Activity Timeline
        </h2>
      </div>

      {/* Timeline */}
      <div className="relative pl-6 border-l-2 border-blue-200">
        {notifications.map((n, idx) => (
          <div
            key={n.id}
            className={`mb-7 pl-4 relative transition-all ${
              idx === notifications.length - 1 ? "mb-2" : ""
            }`}
          >
            {/* Timeline Dot (Unread = RED, Read = light) */}
            <span
              className={`w-3.5 h-3.5 rounded-full absolute -left-[10px] top-1.5 border-2 ${
                n.read
                  ? "bg-white border-blue-300"
                  : "bg-red-500 border-red-600 shadow-[0_0_0_4px_rgba(239,68,68,0.20)]"
              }`}
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3
            />

            {/* Card Content */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-white/70 rounded-xl shadow-sm border border-white/50">
<<<<<<< HEAD
                <div>
                    <p
                        className={`text-sm md:text-base font-medium ${read ? "text-gray-500" : "text-gray-800"
                            }`}
                    >
                        {message}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <FiClock className="text-gray-400" />
                        <span>{formatDate(sentAt)}</span>
                    </div>
=======
              <div>
                <p
                  className={`text-sm md:text-base font-medium ${
                    n.read ? "text-gray-500" : "text-gray-800"
                  }`}
                >
                  {n.message}
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <FiClock className="text-gray-400" />
                  <span>{formatDate(n.sentAt)}</span>
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3
                </div>

<<<<<<< HEAD
                {!read && (
                    <button
                        onClick={() => onMarkAsRead(id)}
                        className="
              flex items-center gap-2
              px-3 py-1.5 rounded-full text-xs font-semibold
              bg-blue-600 text-white
              hover:bg-blue-700 hover:shadow-md
              transition-all
            "
                    >
                        <FiCheckCircle className="text-sm" />
                        Mark as read
                    </button>
                )}
=======
              {/* Button */}
              {!n.read && (
                <button
                  onClick={() => onMarkAsRead(n.id)}
                  className="
                    flex items-center gap-2
                    px-3 py-1.5 rounded-full text-xs font-semibold
                    bg-blue-600 text-white
                    hover:bg-blue-700 hover:shadow-md
                    transition-all
                  "
                  type="button"
                >
                  <FiCheckCircle className="text-sm" />
                  Mark as read
                </button>
              )}
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3
            </div>
        </div>
    );
});

const NotificationList = ({ notifications, onMarkAsRead }) => {
    const hasNotifications = useMemo(
        () => Array.isArray(notifications) && notifications.length > 0,
        [notifications]
    );

    if (!hasNotifications) {
        return <EmptyState />;
    }

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            {/* Title */}
            <div className="flex items-center gap-3 mb-5">
                <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                    <FiBell className="text-blue-700 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                    Admin Activity Timeline
                </h2>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 border-l-2 border-blue-200">
                {notifications.map((n, idx) => (
                    <NotificationItem
                        key={n.id}
                        notification={n}
                        isLast={idx === notifications.length - 1}
                        onMarkAsRead={onMarkAsRead}
                    />
                ))}
            </div>
        </div>
    );
};

export default memo(NotificationList);
