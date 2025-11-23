// src/layout/Sidebar.js
import { FiHome, FiUsers, FiBell, FiSettings, FiLogOut } from "react-icons/fi";
import { removeToken, getUserRole } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";

export default function Sidebar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const role = getUserRole(); // get logged-in role

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await API.get("/notifications/admin");
      const unread = res.data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const logoutHandler = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div
      className="min-h-screen w-64 text-white p-6 flex flex-col gap-6"
      style={{ background: "linear-gradient(180deg, #4F7BFF, #65C7FF)" }}
    >
      <h1 className="text-xl font-bold mb-6">Admin Panel</h1>

      <div className="flex flex-col gap-4 text-sm font-medium">

        {/* Dashboard */}
        <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:text-gray-200">
          <FiHome /> Dashboard
        </button>

        {/* Manage Users — ONLY ADMIN */}
        {role === "ADMIN" && (
          <button onClick={() => navigate("/admin/users")} className="flex items-center gap-3 hover:text-gray-200">
            <FiUsers /> Manage Users
          </button>
        )}

        {/* Notifications */}
        <button onClick={() => navigate("/notifications")} className="flex items-center gap-3 hover:text-gray-200 relative">
          <FiBell /> Notifications

          {unreadCount > 0 && (
            <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button onClick={() => navigate("/settings")} className="flex items-center gap-3 hover:text-gray-200">
          <FiSettings /> Settings
        </button>
      </div>

      {/* Logout Bottom */}
      <div className="mt-auto">
        <button onClick={logoutHandler} className="flex items-center gap-3 text-red-100 hover:text-red-300">
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
  );
}
