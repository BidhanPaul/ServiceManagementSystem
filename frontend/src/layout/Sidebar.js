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

  const NavItem = ({ icon, label, path, showBadge }) => {
    const active = isActive(path);

    return (
      <button
        onClick={() => navigate(path)}
        className={[
          "group flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition",
          "focus:outline-none focus:ring-2 focus:ring-blue-300/40",
          active
            ? "bg-white/10 text-white ring-1 ring-white/15 shadow-sm"
            : "text-slate-200/90 hover:bg-white/10 hover:text-white",
        ].join(" ")}
        type="button"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span
            className={[
              "p-2 rounded-lg transition",
              "ring-1 ring-white/10",
              active
                ? "bg-white/15 text-white"
                : "bg-white/5 text-slate-100 group-hover:bg-white/10",
            ].join(" ")}
          >
            {icon}
          </span>

          <span className="truncate">{label}</span>
        </span>

        {showBadge && unreadCount > 0 && (
          <span className="ml-3 inline-flex items-center justify-center min-w-[24px] h-5 px-2 rounded-full bg-rose-500 text-white text-[11px] font-bold shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  };

  const showOrders = role === "PROJECT_MANAGER" || role === "RESOURCE_PLANNER";

  return (
    <aside className="w-64 h-screen sticky top-0 flex-shrink-0">
      {/* Enterprise sidebar */}
      <div className="h-full bg-[#0B1F3B] text-white shadow-xl flex flex-col">
        {/* subtle right divider */}
        <div className="absolute top-0 right-0 h-full w-px bg-white/10" />

        <div className="p-5 flex flex-col h-full">
          {/* Brand */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center">
                <span className="text-sm font-bold tracking-wide">SP</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold leading-tight">
                  Service Portal
                </h1>
                <p className="text-[11px] text-slate-200/70 mt-0.5 truncate">
                  {role}
                </p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="mt-2">
              <p className="px-2 text-[11px] font-semibold tracking-wider text-slate-200/60 uppercase">
                Main
              </p>

              <div className="mt-2 flex flex-col gap-2 text-sm font-medium">
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
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              onClick={logoutHandler}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-200/90 hover:text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-blue-300/40"
              type="button"
            >
              <span className="p-2 rounded-lg bg-white/5 ring-1 ring-white/10">
                <FiLogOut className="text-lg" />
              </span>
              <span className="font-medium">Logout</span>
            </button>

            <p className="mt-3 text-[10px] text-slate-200/50 px-2">
              © {new Date().getFullYear()} Service Portal
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
