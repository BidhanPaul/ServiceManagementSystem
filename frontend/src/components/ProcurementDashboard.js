// src/components/ProjectManagerDashboard.js
import React, { useEffect, useState } from "react";
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

  // Modal for viewing offers in detail
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerModalRequest, setOfferModalRequest] = useState(null);

  // ---------- LOAD DATA ----------
  const loadProjectsFromMock = async () => {
    try {
      const res = await fetch(
        "https://69233a5309df4a492324c022.mockapi.io/Projects"
      );
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load projects from mockapi", err);
    }
  };

  const loadContractsFromMock = async () => {
    try {
      const res = await fetch(
        "https://69233a5309df4a492324c022.mockapi.io/Contracts"
      );
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load contracts from mockapi", err);
    }
  };

  const loadRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load requests", err);
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
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadProjectsFromMock(),
        loadContractsFromMock(),
        loadRequests(),
      ]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!currentUsername) return;
    const myReqs = requests.filter(
      (r) => r.requestedByUsername === currentUsername
    );
    if (myReqs.length > 0) {
      loadOffersForMyRequests(myReqs);
    } else {
      setOffersByRequestId({});
    }
  }, [requests, currentUsername]);

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
    const ids = Array.isArray(req?.projectIds) ? req.projectIds : [];
    const id = ids[0];
    if (!id) return "-";

    const p = projects.find((x) => String(x.id) === String(id));
    return p ? `${p.customer} – ${p.name}` : id;
  };

  const contractLabel = (req) => {
    const ids = Array.isArray(req?.contractIds) ? req.contractIds : [];
    const id = ids[0];
    if (!id) return "-";

    const c = contracts.find((x) => String(x.id) === String(id));
    return c ? `${c.supplier} – ${c.domain}` : id;
  };

  const myRequests = currentUsername
    ? requests.filter((r) => r.requestedByUsername === currentUsername)
    : [];

  // ---------- SMALL ANALYTICS ----------
  const statusCounts = requests.reduce((acc, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = {
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
  };

  const barData = {
    labels: requests.map((r) => r.title),
    datasets: [
      {
        label: "Roles",
        data: requests.map((r) => r.roles?.length || 0),
        backgroundColor: "#6366f1",
      },
    ],
  };

  const openOffersModal = (req) => {
    setOfferModalRequest(req);
    setOfferModalOpen(true);
  };

  const closeOffersModal = () => {
    setOfferModalOpen(false);
    setOfferModalRequest(null);
  };

  // ---------- NO USER CASE ----------
  if (!currentUsername) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
            <TopNav />
            <div className="bg-white/90 rounded-2xl shadow-sm border border-red-100 p-6 mt-6">
              <h1 className="text-xl font-semibold text-red-600 mb-2">
                No Project Manager logged in
              </h1>
              <p className="text-sm text-slate-700">
                Please make sure you set{" "}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                  localStorage.setItem("username", "pm1")
                </code>{" "}
                or another Project Manager username.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- RENDER ----------
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <TopNav />

          {/* Header */}
          <header className="mt-4 mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Project Manager Panel
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Create and track service requests for your projects and monitor
                supplier offers.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-2 md:mt-0">
              <span className="hidden md:inline text-xs text-slate-500">
                Signed in as{" "}
                <span className="font-medium text-slate-700">
                  {currentUsername}
                </span>
              </span>
              <button
                onClick={() => navigate("/requests")}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-md hover:bg-blue-700 transition-colors"
              >
                + Create Service Request
              </button>
            </div>
          </header>

          {/* Overview cards with icons */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Projects */}
            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 7h18M3 12h18M3 17h18" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Projects (Mock API)
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {projects.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Available project references
                </p>
              </div>
            </div>

            {/* Contracts */}
            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Contracts (Mock API)
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {contracts.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Framework & preferred suppliers
                </p>
              </div>
            </div>

            {/* My Requests */}
            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  My Service Requests
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {myRequests.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Requests created under your username
                </p>
              </div>
            </div>

            {/* All Requests */}
            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M8 12h8M12 8v8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  All Service Requests
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {requests.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total requests across all PMs
                </p>
              </div>
            </div>
          </section>

          {/* Mini charts row */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-1">
                Requests by Status
              </h2>
              <p className="text-xs text-slate-500 mb-2">
                Distribution of all service requests across lifecycle statuses.
              </p>
              <div className="h-52 flex items-center justify-center">
                <Pie data={pieData} />
              </div>
            </div>

            <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-1">
                Roles Requested Per Request
              </h2>
              <p className="text-xs text-slate-500 mb-2">
                Number of roles included in each service request.
              </p>
              <div className="h-52 flex items-center justify-center">
                <Bar data={barData} />
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-600 text-sm">Loading dashboard data…</p>
            </div>
          ) : (
            <>
              {/* My Requests */}
              <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      My Service Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      These service requests were created by you.
                    </p>
                  </div>
                </div>

                {myRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                    You have not created any requests yet. Use the{" "}
                    <span className="font-medium">“Create Service Request”</span>{" "}
                    button above to start.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80">
                        <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                          <th className="py-2.5 px-3">Title</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Project</th>
                          <th className="py-2.5 px-3">Contract</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {myRequests.map((r) => {
                          const offers = offersByRequestId[r.id] || [];
                          return (
                            <tr
                              key={r.id}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="py-2.5 px-3 align-middle">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900 text-sm">
                                    {r.title}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {r.roles?.length || 0} role(s) •{" "}
                                    {offers.length} offer(s)
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
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
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                                {projectLabel(r)}
                              </td>
                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                                {contractLabel(r)}
                              </td>
                              <td className="py-2.5 px-3 align-middle">
                                <div className="flex justify-end flex-wrap gap-1.5">
                                  <button
                                    onClick={() =>
                                      navigate(`/requests/${r.id}`)
                                    }
                                    className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                  >
                                    View
                                  </button>
                                  {offers.length > 0 && (
                                    <button
                                      onClick={() => openOffersModal(r)}
                                      className="px-2.5 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                    >
                                      View Offers
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

              {/* All Requests */}
              <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      All Service Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      Overview of service requests across all Project Managers.
                    </p>
                  </div>
                </div>

                {requests.length === 0 ? (
                  <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                    No service requests in the system yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80">
                        <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                          <th className="py-2.5 px-3">Title</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Project</th>
                          <th className="py-2.5 px-3">Contract</th>
                          <th className="py-2.5 px-3">Requested By</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {requests.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-slate-50/60 transition-colors"
                          >
                            <td className="py-2.5 px-3 align-middle">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900 text-sm">
                                  {r.title}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {r.roles?.length || 0} role(s)
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
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
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                              {projectLabel(r)}
                            </td>
                            <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                              {contractLabel(r)}
                            </td>
                            <td className="py-2.5 px-3 align-middle text-xs text-slate-700">
                              {r.requestedByUsername || "-"}
                            </td>
                            <td className="py-2.5 px-3 align-middle">
                              <div className="flex justify-end">
                                <button
                                  onClick={() => navigate(`/requests/${r.id}`)}
                                  className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
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

              {/* Offers for my requests (compact overview, like before) */}
              <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Offers for My Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      Quick view of offers that suppliers have submitted for
                      your service requests.
                    </p>
                  </div>
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
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">
                                {req.title}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {projectLabel(req)} • {contractLabel(req)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
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
                            </div>
                          </div>

                          {offers.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No offers received yet.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {offers.map((o) => (
                                <div
                                  key={o.id}
                                  className="flex justify-between text-xs border-t border-slate-200 pt-1 mt-1"
                                >
                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {o.specialistName || "Unnamed Specialist"}
                                    </p>
                                    <p className="text-slate-500">
                                      Supplier: {o.supplierName} (
                                      {o.contractualRelationship})
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-slate-600">
                                      Daily rate: {o.dailyRate} €
                                    </p>
                                    <p className="font-semibold text-slate-900">
                                      Total: {o.totalCost} €
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Offers modal */}
          {offerModalOpen && offerModalRequest && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-lg border border-slate-100">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Offers for "{offerModalRequest.title}"
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  Project: {projectLabel(offerModalRequest)} • Contract:{" "}
                  {contractLabel(offerModalRequest)}
                </p>

                {(() => {
                  const offers =
                    offersByRequestId[offerModalRequest.id] || [];
                  if (offers.length === 0) {
                    return (
                      <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-3 py-4 text-center">
                        No offers have been submitted yet for this request.
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {offers.map((o) => (
                        <div
                          key={o.id}
                          className="border border-slate-200 rounded-xl p-2.5 text-xs flex justify-between gap-3"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">
                              {o.specialistName || "Unnamed Specialist"}
                            </p>
                            <p className="text-slate-600">
                              Supplier: {o.supplierName} (
                              {o.contractualRelationship})
                            </p>
                            {o.notes && (
                              <p className="text-slate-500 mt-0.5">
                                Notes: {o.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-slate-700">
                              Daily rate:{" "}
                              <span className="font-semibold">
                                {o.dailyRate} €
                              </span>
                            </p>
                            <p className="text-slate-900 font-semibold">
                              Total: {o.totalCost} €
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={closeOffersModal}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;

//changes in ProcureDashboard file
