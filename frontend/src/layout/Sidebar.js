// src/layout/Sidebar.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiHome, FiUsers, FiBell, FiSettings, FiLogOut } from "react-icons/fi";
import { removeToken, getUserRole } from "../utils/auth";
import API from "../api/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const role = getUserRole();
<<<<<<< HEAD

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await API.get("/notifications/admin");
      const unread = response.data?.filter((n) => !n.read)?.length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };
=======
  const username = localStorage.getItem("username");

  const [unreadCount, setUnreadCount] = useState(0);
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  const isActive = (path) => window.location.pathname === path;

  // ✅ unread count = ONLY incoming unread:
  // - SYSTEM: normal notifications
  // - DIRECT_MESSAGE: only if I am the recipient
  const loadUnread = async () => {
    try {
      let endpoint = null;

      if (role === "ADMIN") {
        endpoint = "/notifications/admin";
      } else {
        if (!username) return;
        endpoint = `/notifications/user/${username}`;
      }

      const res = await API.get(endpoint);
      const data = res.data || [];

      const incomingUnread = data.filter((n) => {
        if (n.read) return false;

        // DM: count only if I am the recipient (incoming)
        if (n.category === "DIRECT_MESSAGE") {
          return n.recipientUsername === username;
        }

        // SYSTEM: count it (it is for me)
        return true;
      });

      setUnreadCount(incomingUnread.length);
    } catch (err) {
      console.error("Failed to load unread notifications", err);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [role, username]);

  const NavItem = ({ icon, label, path, showBadge }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition 
        ${
          isActive(path)
            ? "bg-white/30 text-white shadow-inner"
            : "text-white/80 hover:bg-white/20 hover:text-white"
        }`}
      type="button"
    >
      <span className="flex items-center gap-3">
        <span
          className={`p-2 rounded-lg ${
            isActive(path)
              ? "bg-white/40 text-blue-700"
              : "bg-white/10 text-white"
          }`}
        >
          {icon}
        </span>
        {label}
      </span>

<<<<<<< HEAD
      <div className="flex flex-col gap-4 text-sm font-medium">
        {/* Dashboard */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 hover:text-gray-200"
        >
          <FiHome /> Dashboard
        </button>

        {/* Manage Users — ONLY ADMIN */}
        {role === "ADMIN" && (
          <button
            onClick={() => navigate("/admin/users")}
            className="flex items-center gap-3 hover:text-gray-200"
          >
            <FiUsers /> Manage Users
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={() => navigate("/notifications")}
          className="flex items-center gap-3 hover:text-gray-200 relative"
        >
          <FiBell /> Notifications
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-3 hover:text-gray-200"
        >
          <FiSettings /> Settings
        </button>
      </div>

      {/* Logout Button */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-red-100 hover:text-red-300"
        >
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
=======
      {showBadge && unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
          {unreadCount}
        </span>
      )}
    </button>
  );

  return (
    <aside
      className="
        w-64 h-screen
        bg-gradient-to-b from-blue-600 to-sky-500
        text-white shadow-xl
        flex flex-col
        sticky top-0
        flex-shrink-0
      "
    >
      <div className="p-6 flex flex-col h-full">
        <div className="mb-4">
          <h1 className="text-lg font-bold">Service Portal</h1>
          <p className="text-xs text-white/80 mt-1">{role}</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-3 text-sm font-medium">
            <NavItem icon={<FiHome />} label="Dashboard" path="/" />

            {role === "ADMIN" && (
              <NavItem
                icon={<FiUsers />}
                label="Manage Users"
                path="/admin/users"
              />
            )}

            <NavItem
              icon={<FiBell />}
              label="Notifications"
              path="/notifications"
              showBadge={true}
            />

            <NavItem icon={<FiSettings />} label="Settings" path="/settings" />
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-white/20">
          <button
            onClick={logoutHandler}
            className="flex items-center gap-3 text-red-100 hover:text-red-300 transition px-3 py-2 rounded-xl hover:bg-white/10 w-full"
            type="button"
          >
            <FiLogOut className="text-lg" />
            Logout
          </button>
        </div>
      </div>
    </aside>
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3
  );
}
