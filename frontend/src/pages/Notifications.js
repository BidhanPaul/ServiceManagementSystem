import { useEffect, useState } from "react";
import API from "../api/api";
import TopNav from "../components/TopNav";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await API.get("/notifications/admin");  // ⬅ RESTORED
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
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
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">

      <TopNav />

      <h1 className="text-3xl font-bold text-white mb-8">🔔 Notifications</h1>

      <div className="space-y-4">
        {notifications.length === 0 && (
          <p className="text-center text-gray-700 text-lg">No notifications</p>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-white/60 backdrop-blur-md border border-white/40 shadow-lg rounded-xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold text-gray-900">{n.message}</p>
              <p className="text-xs text-gray-600 mt-1">
                {new Date(n.sentAt).toLocaleString()}
              </p>
            </div>

            {!n.read && (
              <button
                className="bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow hover:bg-red-700"
                onClick={() => markRead(n.id)}
              >
                MARK READ
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
