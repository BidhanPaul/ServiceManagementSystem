// src/layout/Sidebar.js
import { FiHome, FiUsers, FiBell, FiSettings, FiLogOut } from "react-icons/fi";
import { removeToken, getUserRole } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const role = getUserRole();
  const username = localStorage.getItem("username");

  const [unreadCount, setUnreadCount] = useState(0);

  const logoutHandler = () => {
    removeToken();
    navigate("/login");
  };

  const isActive = (path) => window.location.pathname === path;

  // ✅ load unread notifications count (system + dm; separated in Notifications page)
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
      setUnreadCount(data.filter((n) => !n.read).length);
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
      {/* ✅ internal padding wrapper */}
      <div className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold">Service Portal</h1>
          <p className="text-xs text-white/80 mt-1">{role}</p>
        </div>

        {/* ✅ scrollable menu area (if sidebar grows) */}
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

        {/* Footer */}
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
  );
}
