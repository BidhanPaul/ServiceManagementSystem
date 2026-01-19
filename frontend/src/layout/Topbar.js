// src/layout/Sidebar.js
import {
  FiHome,
  FiUsers,
  FiBell,
  FiSettings,
  FiLogOut,
  FiClipboard,
} from "react-icons/fi";
import { removeToken, getUserRole } from "../utils/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/api";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getUserRole();
  const username = localStorage.getItem("username");

  const [unreadCount, setUnreadCount] = useState(0);

  const logoutHandler = () => {
    removeToken();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const loadUnread = async () => {
    try {
      const endpoint =
        role === "ADMIN"
          ? "/notifications/admin"
          : username
          ? `/notifications/user/${username}`
          : null;

      if (!endpoint) return;

      const res = await API.get(endpoint);
      const unread = (res.data || []).filter(
        (n) =>
          !n.read &&
          (n.category !== "DIRECT_MESSAGE" ||
            n.recipientUsername === username)
      );

      setUnreadCount(unread.length);
    } catch {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 15000);
    return () => clearInterval(t);
  }, [role, username]);

  const NavItem = ({ icon, label, path, showBadge }) => {
    const active = isActive(path);

    return (
      <button
        onClick={() => navigate(path)}
        className={`
          group flex items-center justify-between w-full px-3 py-2.5 rounded-xl
          transition focus:outline-none
          ${
            active
              ? "bg-blue-600/15 text-white ring-1 ring-blue-500/40"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }
        `}
      >
        <span className="flex items-center gap-3">
          <span
            className={`
              p-2 rounded-lg transition
              ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-slate-300 group-hover:bg-white/10"
              }
            `}
          >
            {icon}
          </span>
          {label}
        </span>

        {showBadge && unreadCount > 0 && (
          <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  };

  const showOrders =
    role === "PROJECT_MANAGER" || role === "RESOURCE_PLANNER";

  return (
    <aside className="w-64 h-screen sticky top-0 flex-shrink-0">
      <div className="h-full bg-slate-900 text-white shadow-xl flex flex-col">
        <div className="p-5 flex flex-col h-full">
          {/* Brand */}
          <div className="mb-6">
            <h1 className="text-lg font-semibold tracking-wide">
              Service Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1">{role}</p>
          </div>

          {/* Nav */}
          <div className="flex-1 space-y-2 text-sm font-medium">
            <NavItem icon={<FiHome />} label="Dashboard" path="/" />

            {showOrders && (
              <NavItem icon={<FiClipboard />} label="Orders" path="/orders" />
            )}

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
              showBadge
            />

            <NavItem icon={<FiSettings />} label="Settings" path="/settings" />
          </div>

          {/* Footer */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              onClick={logoutHandler}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition"
            >
              <span className="p-2 rounded-lg bg-white/5">
                <FiLogOut />
              </span>
              Logout
            </button>

            <p className="mt-3 text-[10px] text-slate-500">
              © {new Date().getFullYear()} Service Portal
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
