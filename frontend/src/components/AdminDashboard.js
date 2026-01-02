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

      <div className="flex-1 p-6 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400">

        <TopNav />

        <h2 className="text-3xl font-bold text-blue-600 mb-6">Dashboard</h2>

        {/* ------ CARDS ------ */}
        {/* CARD ROW - 5 in one line scrollable */}
<div className="flex gap-6 overflow-x-auto pb-4 w-full">

  {/* Total Users */}
  <div className="min-w-[260px] p-8 rounded-2xl shadow-xl bg-white/40 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center">
    <h3 className="text-gray-700 font-semibold text-lg md:text-xl">Total Users</h3>
    <p className="text-6xl font-extrabold text-blue-700 mt-3">{totalUsers}</p>
  </div>

  {/* Dynamic Role Cards */}
  {Object.entries(roleCounts).map(([role, count]) => (
    <div key={role}
      className="min-w-[260px] p-8 rounded-2xl shadow-xl bg-white/40 backdrop-blur-md border border-white/40 flex flex-col items-center justify-center"
    >
      <div className="mb-4">{roleIcons[role] || defaultIcon}</div>
      <h3 className="text-gray-700 font-semibold text-lg md:text-xl">{role.replace("_"," ")}</h3>
      <p className="text-6xl font-extrabold text-blue-700 mt-3">{count}</p>
    </div>
  ))}

</div>


        {/* ------ CHART ROW ------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Pie Chart */}
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/40">
            <h2 className="font-semibold text-gray-800 mb-4">Users by Role</h2>
            <UserRolePieChart />
          </div>

          {/* Timeline */}
          <div className="bg-white/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/40">
            <h2 className="font-semibold text-gray-800 mb-4">Recent Signups</h2>
            <RecentUsersTimeline />
          </div>

        </div>
      </div>
    </div>
  );
}
