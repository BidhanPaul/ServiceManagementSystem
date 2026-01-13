// src/pages/Dashboard.js

import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

// IMPORT CHARTS
import RecentUsersTimeline from "../components/charts/RecentUsersTimeline";
import UserRolePieChart from "../components/charts/UserRolePieChart";

import { FiUser, FiShield, FiTool, FiUsers, FiTrash2, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleCounts, setRoleCounts] = useState({});

  // ✅ NEW: requests admin management
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL or status name
  const [search, setSearch] = useState("");

  const role = localStorage.getItem("role"); // should be "ADMIN" for this page
  const isAdmin = role === "ADMIN";

  const roleIcons = {
    ADMIN: <FiShield className="text-blue-600 text-3xl" />,
    PROJECT_MANAGER: <FiUsers className="text-blue-600 text-3xl" />,
    PROCUREMENT_OFFICER: <FiTool className="text-blue-600 text-3xl" />,
    SERVICE_PROVIDER: <FiUser className="text-blue-600 text-3xl" />,
  };

  const defaultIcon = <FiUser className="text-blue-600 text-3xl" />;

  useEffect(() => {
    loadCounts();
    if (isAdmin) loadRequests();
    // eslint-disable-next-line
  }, []);

  // ---------------- USERS COUNTS ----------------
  const loadCounts = async () => {
    try {
      const res = await API.get("/users");
      const users = res.data || [];

      setTotalUsers(users.length);

      const counts = {};
      users.forEach((u) => {
        counts[u.role] = (counts[u.role] || 0) + 1;
      });

      setRoleCounts(counts);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
      toast.error("Failed to load dashboard stats.");
    }
  };

  // ---------------- REQUESTS ADMIN MGMT ----------------
  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await API.get("/requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load requests", err);
      toast.error("Failed to load service requests.");
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const adminDeleteRequest = async (id, title) => {
    const ok = window.confirm(
      `Delete this service request?\n\nID: ${id}\nTitle: ${title}\n\nThis cannot be undone.`
    );
    if (!ok) return;

    try {
      await API.delete(`/requests/${id}/admin`);
      toast.success("Request deleted.");
      // refresh list
      loadRequests();
    } catch (err) {
      console.error("Admin delete failed", err?.response || err);
      const code = err?.response?.status;

      if (code === 401) toast.error("Unauthorized (JWT missing/expired).");
      else if (code === 403) toast.error("Forbidden (Admin only).");
      else toast.error("Failed to delete request.");
    }
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      case "IN_REVIEW":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "APPROVED_FOR_BIDDING":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "BIDDING":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "EXPIRED":
        return "bg-slate-50 text-slate-700 border border-slate-200";
      case "EVALUATION":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "ORDERED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "COMPLETED":
        return "bg-green-50 text-green-700 border border-green-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border border-red-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const allStatuses = useMemo(() => {
    const set = new Set((requests || []).map((r) => r.status).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return (requests || [])
      .filter((r) => {
        if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
        if (!q) return true;

        const hay = [
          r.id,
          r.title,
          r.status,
          r.type,
          r.requestedByUsername,
          r.projectId,
          r.projectName,
          r.contractId,
          r.contractSupplier,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(q);
      })
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [requests, statusFilter, search]);

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
              System overview, user role distribution, and recent signup activity.
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
            {Object.entries(roleCounts).map(([roleKey, count]) => (
              <div
                key={roleKey}
                className="bg-white/50 backdrop-blur-md rounded-2xl border border-white/70 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center rounded-2xl bg-sky-50 w-12 h-12">
                  {roleIcons[roleKey] || defaultIcon}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                    {roleKey.replace("_", " ")}
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
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-[1fr] mb-6">
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

          {/* ✅ NEW: ADMIN REQUEST DELETE SECTION (keeps everything else unchanged) */}
          {isAdmin && (
            <section className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/80 shadow-sm p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Manage Service Requests (Admin)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Admin can delete any request regardless of status.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white/90 focus:outline-none"
                    >
                      {allStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, ID, user, status..."
                    className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white/90 w-full sm:w-72 focus:outline-none"
                  />

                  <button
                    onClick={loadRequests}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700 transition-colors"
                    type="button"
                  >
                    <FiRefreshCw />
                    Refresh
                  </button>
                </div>
              </div>

              {loadingRequests ? (
                <p className="text-sm text-slate-600">Loading requests…</p>
              ) : filteredRequests.length === 0 ? (
                <p className="text-sm text-slate-600 bg-white/60 border border-white/80 rounded-2xl p-4">
                  No requests found.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white/70">
                  <table className="min-w-[1050px] w-full text-sm">
                    <thead className="bg-slate-50/80">
                      <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Requested By</th>
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Contract</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                            {r.id}
                          </td>

                          <td className="py-2.5 px-3 align-middle">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 text-sm">
                                {r.title || "-"}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Roles: {r.roles?.length || 0}
                              </span>
                            </div>
                          </td>

                          <td className="py-2.5 px-3 align-middle">
                            <span
                              className={
                                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium " +
                                statusBadgeClass(r.status)
                              }
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                              {r.status}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                            {r.type || "-"}
                          </td>

                          <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                            {r.requestedByUsername || "-"}
                          </td>

                          <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                            {r.projectId ? `${r.projectId} – ${r.projectName || ""}` : "-"}
                          </td>

                          <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                            {r.contractId ? `${r.contractSupplier || ""} – ${r.contractId}` : "-"}
                          </td>

                          <td className="py-2.5 px-3 align-middle">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => adminDeleteRequest(r.id, r.title || "")}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold shadow hover:bg-red-700 transition-colors"
                                type="button"
                              >
                                <FiTrash2 />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
