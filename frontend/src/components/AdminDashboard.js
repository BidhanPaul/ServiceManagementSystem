// src/pages/Dashboard.js

import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import { useEffect, useState } from "react";
import API from "../api/api";

// IMPORT CHARTS
import RecentUsersTimeline from "../components/charts/RecentUsersTimeline";
import UserRolePieChart from "../components/charts/UserRolePieChart";

import { FiUser, FiShield, FiTool, FiUsers } from "react-icons/fi";

export default function Dashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleCounts, setRoleCounts] = useState({});

  const roleIcons = {
    ADMIN: <FiShield className="text-blue-600 text-3xl" />,
    PROJECT_MANAGER: <FiUsers className="text-blue-600 text-3xl" />,
    PROCUREMENT_OFFICER: <FiTool className="text-blue-600 text-3xl" />,
    SERVICE_PROVIDER: <FiUser className="text-blue-600 text-3xl" />,
  };

  const defaultIcon = <FiUser className="text-blue-600 text-3xl" />;

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const res = await API.get("/users");
      const users = res.data;

      setTotalUsers(users.length);

      const counts = {};
      users.forEach((u) => {
        counts[u.role] = (counts[u.role] || 0) + 1;
      });

      setRoleCounts(counts);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <TopNav />

          {/* Header */}
          <header className="mt-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              System overview, user role distribution, and recent signup
              activity.
            </p>
          </header>

          {/* ---------- STAT CARDS ---------- */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Users */}
            <div className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center rounded-2xl bg-blue-50 w-12 h-12">
                <FiUsers className="text-blue-600 text-2xl" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalUsers}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  All registered users in the system
                </p>
              </div>
            </div>

            {/* Dynamic Role Cards */}
            {Object.entries(roleCounts).map(([role, count]) => (
              <div
                key={role}
                className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center rounded-2xl bg-sky-50 w-12 h-12">
                  {roleIcons[role] || defaultIcon}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                    {role.replace("_", " ")}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {count}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Users with this role
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* ---------- CHARTS ROW ---------- */}
          {/* ---------- CHARTS ROW ---------- */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-[1fr]">
            {/* Pie Chart */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm p-4 md:p-5 h-[420px] flex flex-col">
              <h2 className="text-base font-semibold text-slate-900 mb-1">
                Employees by Role
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Visual distribution of user roles.
              </p>

              <div className="flex-1 flex items-center justify-center">
                <UserRolePieChart />
              </div>
            </div>

            {/* Recent Signups */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm p-4 md:p-5 h-[420px] flex flex-col">
              <h2 className="text-base font-semibold text-slate-900 mb-1">
                Recent Signups
              </h2>
              <p className="text-xs text-slate-500 mb-3">
                Latest registered users.
              </p>

              {/* Scrollable list inside fixed panel */}
              <div className="flex-1 overflow-y-auto pr-1">
                <RecentUsersTimeline />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
