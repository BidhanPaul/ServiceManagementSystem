// src/components/ProjectManagerDashboard.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav";
import API from "../api/api";

// === Charts ===
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const ProjectManagerDashboard = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offersByRequestId, setOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);

  const currentUsername = localStorage.getItem("username");

  // Prevent duplicate initial loads (React 18 StrictMode runs effects twice in dev)
  const didInitRef = useRef(false);

  // Tabs (UI only)
  const [activeTab, setActiveTab] = useState("overview");

  // ---------- LOAD DATA ----------
  const loadProjects = async () => {
    try {
      const res = await API.get("/external/projects");
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load projects from backend", err);
      setProjects([]);
    }
  };

  const loadContracts = async () => {
    try {
      const res = await API.get("/external/contracts");
      setContracts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load contracts from backend", err);
      setContracts([]);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load requests", err);
      setRequests([]);
    }
  };

  const loadOffersForMyRequests = async (myReqs) => {
    try {
      const promises = myReqs.map((r) =>
        API.get(`/requests/${r.id}/offers`).then((res) => ({
          requestId: r.id,
          offers: res.data || [],
        }))
      );

      const results = await Promise.all(promises);
      const map = {};
      results.forEach((entry) => {
        map[entry.requestId] = entry.offers;
      });
      setOffersByRequestId(map);
    } catch (err) {
      console.error("Failed to load offers for my requests", err);
      setOffersByRequestId({});
    }
  };

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const init = async () => {
      setLoading(true);
      await Promise.all([loadProjects(), loadContracts(), loadRequests()]);
      setLoading(false);
    };

    init();
  }, []);

  // Compute myRequests memoized
  const myRequests = useMemo(() => {
    if (!currentUsername) return [];
    return requests.filter((r) => r.requestedByUsername === currentUsername);
  }, [requests, currentUsername]);

  // Load offers whenever myRequests list changes
  useEffect(() => {
    if (!currentUsername) return;

    if (myRequests.length > 0) {
      loadOffersForMyRequests(myRequests);
    } else {
      setOffersByRequestId({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUsername, myRequests.map((r) => r.id).join("|")]);

  // ---------- HELPERS ----------
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
      case "ORDERED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const projectLabel = (req) => {
    if (req?.projectId) {
      return `${req.projectId} – ${req.projectName || ""}`;
    }
    return "-";
  };

  const contractLabel = (req) => {
    if (req?.contractId) {
      return `${req.contractSupplier || ""} – ${req.contractId}`;
    }
    return "-";
  };

  // ✅ NO POPUP: open full offers in RequestDetails
  const openOffersFullView = (req) => {
    if (!req?.id) return;
    navigate(`/requests/${req.id}?tab=offers`);
  };

  // ---------- SMALL ANALYTICS ----------
  const statusCounts = useMemo(() => {
    return (requests || []).reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {});
  }, [requests]);

  const barLabels = useMemo(() => {
    const latest = [...(requests || [])].slice(-12);
    return latest.map((r) => r.title);
  }, [requests]);

  const barValues = useMemo(() => {
    const latest = [...(requests || [])].slice(-12);
    return latest.map((r) => r.roles?.length || 0);
  }, [requests]);

  const pieData = useMemo(
    () => ({
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            "#60a5fa",
            "#34d399",
            "#6366f1",
            "#facc15",
            "#fb7185",
            "#94a3b8",
          ],
        },
      ],
    }),
    [statusCounts]
  );

  const barData = useMemo(
    () => ({
      labels: barLabels,
      datasets: [
        {
          label: "Roles",
          data: barValues,
          backgroundColor: "#6366f1",
        },
      ],
    }),
    [barLabels, barValues]
  );

  // ---------- NO USER CASE ----------
  if (!currentUsername) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen">
        <div className="lg:flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6">
            <div className="sticky top-0 z-40">
              <TopNav />
            </div>

            <div className="bg-white/90 rounded-2xl shadow-sm border border-red-100 p-6 mt-6">
              <h1 className="text-xl font-semibold text-red-600 mb-2">
                No Project Manager logged in
              </h1>
              <p className="text-sm text-slate-700">
                Please make sure your username exists in local storage.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Tabs UI ----------
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "my_requests", label: "My Requests" },
    { id: "all_requests", label: "All Requests" },
    { id: "offers", label: "Offers" },
  ];

  const tabBtnClass = (isActive) =>
    [
      "px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition",
      "ring-1 ring-slate-200",
      isActive
        ? "bg-slate-900 text-white"
        : "bg-white/80 text-slate-700 hover:bg-white",
    ].join(" ");

  // ---------- RENDER ----------
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="lg:flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-6 pb-10">
          {/* ✅ Sticky top nav */}
          <div className="sticky top-0 z-50">
            <TopNav />
          </div>

          {/* Header */}
          <header className="mt-3 mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Project Manager Panel
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Create and track service requests for your projects and monitor supplier offers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs text-slate-500">
                Signed in as{" "}
                <span className="font-medium text-slate-700">
                  {currentUsername}
                </span>
              </span>
              <button
                onClick={() => navigate("/requests")}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors"
                type="button"
              >
                + Create Service Request
              </button>
            </div>
          </header>

          {/* ✅ Sticky Tabs (stays visible while scrolling) */}
          <div className="sticky top-[88px] z-40 mb-6">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-2 border border-slate-100 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={tabBtnClass(activeTab === t.id)}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Projects
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {projects.length}
                </p>
              </div>
            </div>

            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Contracts
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {contracts.length}
                </p>
              </div>
            </div>

            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  My Requests
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {myRequests.length}
                </p>
              </div>
            </div>

            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12h8M12 8v8" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  All Requests
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {requests.length}
                </p>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-600 text-sm">Loading dashboard data…</p>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <>
                  <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 overflow-hidden">
                      <h2 className="text-sm font-semibold text-slate-900 mb-1">
                        Requests by Status
                      </h2>
                      <div className="h-52 flex items-center justify-center">
                        <Pie data={pieData} />
                      </div>
                    </div>

                    <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 overflow-hidden">
                      <h2 className="text-sm font-semibold text-slate-900 mb-1">
                        Roles Requested (Latest 12 Requests)
                      </h2>
                      <div className="h-52 flex items-center justify-center">
                        <Bar data={barData} />
                      </div>
                    </div>
                  </section>

                  <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Quick Tips
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Tabs are sticky now — you can switch sections without scrolling back up.
                    </p>
                  </div>
                </>
              )}

              {/* MY REQUESTS TAB */}
              {activeTab === "my_requests" && (
                <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                  <div className="mb-3">
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      My Service Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      These service requests were created by you.
                    </p>
                  </div>

                  {myRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                      You have not created any requests yet.
                    </p>
                  ) : (
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      {/* ✅ table-fixed + truncate prevents wide columns */}
                      <table className="w-full text-sm table-fixed">
                        <thead className="bg-slate-50/80">
                          <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="py-2.5 px-3 w-[38%]">Title</th>
                            <th className="py-2.5 px-3 w-[12%]">Type</th>
                            <th className="py-2.5 px-3 w-[16%]">Status</th>
                            <th className="py-2.5 px-3 w-[18%]">Project</th>
                            <th className="py-2.5 px-3 w-[16%]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {myRequests.map((r) => {
                            const offers = offersByRequestId[r.id] || [];
                            return (
                              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-2.5 px-3 align-middle">
                                  <div className="min-w-0">
                                    <div className="font-medium text-slate-900 truncate">
                                      {r.title}
                                    </div>
                                    <div className="text-[11px] text-slate-500 truncate">
                                      {offers.length} offer(s) • {r.roles?.length || 0} role(s)
                                    </div>
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 align-middle text-xs text-slate-700 truncate">
                                  {r.type}
                                </td>

                                <td className="py-2.5 px-3 align-middle">
                                  <span
                                    className={
                                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium " +
                                      statusBadgeClass(r.status)
                                    }
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                    <span className="truncate">{r.status}</span>
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 align-middle text-xs text-slate-700 truncate">
                                  {projectLabel(r)}
                                </td>

                                <td className="py-2.5 px-3 align-middle">
                                  <div className="flex justify-end flex-wrap gap-1.5">
                                    <button
                                      onClick={() => navigate(`/requests/${r.id}`)}
                                      className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800"
                                      type="button"
                                    >
                                      View
                                    </button>
                                    {offers.length > 0 && (
                                      <button
                                        onClick={() => openOffersFullView(r)}
                                        className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                        type="button"
                                      >
                                        Offers
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}

              {/* ALL REQUESTS TAB */}
              {activeTab === "all_requests" && (
                <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                  <div className="mb-3">
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      All Service Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      Overview of service requests across all Project Managers.
                    </p>
                  </div>

                  {requests.length === 0 ? (
                    <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                      No service requests in the system yet.
                    </p>
                  ) : (
                    <div className="rounded-xl border border-slate-100 overflow-hidden">
                      {/* ✅ table-fixed, fewer columns -> less horizontal scroll */}
                      <table className="w-full text-sm table-fixed">
                        <thead className="bg-slate-50/80">
                          <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="py-2.5 px-3 w-[44%]">Title</th>
                            <th className="py-2.5 px-3 w-[14%]">Type</th>
                            <th className="py-2.5 px-3 w-[18%]">Status</th>
                            <th className="py-2.5 px-3 w-[14%]">Requested By</th>
                            <th className="py-2.5 px-3 w-[10%]">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {requests.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3 align-middle">
                                <div className="min-w-0">
                                  <div className="font-medium text-slate-900 truncate">{r.title}</div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {projectLabel(r)} • {contractLabel(r)}
                                  </div>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 truncate">
                                {r.type}
                              </td>

                              <td className="py-2.5 px-3 align-middle">
                                <span
                                  className={
                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium " +
                                    statusBadgeClass(r.status)
                                  }
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                  <span className="truncate">{r.status}</span>
                                </span>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 truncate">
                                {r.requestedByUsername || "-"}
                              </td>

                              <td className="py-2.5 px-3 align-middle">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => navigate(`/requests/${r.id}`)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800"
                                    type="button"
                                  >
                                    View
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

              {/* OFFERS TAB */}
              {activeTab === "offers" && (
                <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                  <div className="mb-3">
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Offers for My Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      Quick view of offers submitted for your service requests.
                    </p>
                  </div>

                  {myRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                      You have no requests, so there are no offers yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {myRequests.map((req) => {
                        const offers = offersByRequestId[req.id] || [];
                        return (
                          <div
                            key={req.id}
                            className="border border-slate-100 rounded-2xl p-3.5 bg-slate-50/60"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-1">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-sm truncate">
                                  {req.title}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {projectLabel(req)} • {contractLabel(req)}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={
                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium " +
                                    statusBadgeClass(req.status)
                                  }
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                  {req.status}
                                </span>

                                <span className="inline-flex items-center rounded-full bg-white text-slate-700 border border-slate-200 px-2.5 py-1 text-[11px] font-medium">
                                  {offers.length} offer(s)
                                </span>

                                {offers.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => openOffersFullView(req)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                  >
                                    Open Full Offers
                                  </button>
                                )}
                              </div>
                            </div>

                            {offers.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                No offers received yet.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {offers.slice(0, 3).map((o) => (
                                  <div
                                    key={o.id}
                                    className="border-t border-slate-200 pt-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-800 truncate">
                                        {o.specialistName || "Unnamed Specialist"}
                                      </p>
                                      <p className="text-slate-500 break-words">
                                        Supplier: {o.supplierName} ({o.contractualRelationship})
                                      </p>
                                      {o.notes && (
                                        <p className="text-slate-500 mt-0.5 break-words">
                                          Notes: {o.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="sm:text-right">
                                      <p className="text-slate-600">
                                        Daily rate: {o.dailyRate} €
                                      </p>
                                      <p className="font-semibold text-slate-900">
                                        Total: {o.totalCost} €
                                      </p>
                                    </div>
                                  </div>
                                ))}

                                {offers.length > 3 && (
                                  <p className="text-[11px] text-slate-500 pt-1">
                                    Showing 3 of {offers.length}. Use{" "}
                                    <span className="font-semibold">Open Full Offers</span> to view all.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;
