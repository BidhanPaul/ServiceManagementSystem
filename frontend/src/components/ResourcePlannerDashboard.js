// src/components/ResourcePlannerDashboard.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

// Charts
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

const TAB = {
  DASHBOARD: "dashboard",
  REQUESTS: "requests",
};

export default function ResourcePlannerDashboard() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [offersByRequest, setOffersByRequest] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Tabs
  const [activeTab, setActiveTab] = useState(TAB.DASHBOARD);

  // ✅ Search (UI-only)
  const [searchQuery, setSearchQuery] = useState("");

  // DM modal
  const [dmOpen, setDmOpen] = useState(false);
  const [dmMessage, setDmMessage] = useState("");
  const [dmTargetRequest, setDmTargetRequest] = useState(null);

  const currentUsername = localStorage.getItem("username") || "";
  const myRole = localStorage.getItem("role") || "RESOURCE_PLANNER";

  // Prevent duplicate initial loads (React 18 StrictMode)
  const didInitRef = useRef(false);

  // ---------- Helpers ----------
  const srLabel = (req) => {
    if (!req) return "-";
    if (req.requestNumber && String(req.requestNumber).trim())
      return req.requestNumber;
    if (req.id == null) return "-";
    return `SR-${String(req.id).padStart(6, "0")}`;
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
      case "EVALUATION":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "ORDERED":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border border-red-200";
      case "EXPIRED":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  // ✅ UI-only display helper (does not change logic/data)
  const prettyStatus = (s) => {
    if (!s) return "-";
    return String(s)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  // ✅ Never-overlap status pill (same idea as Procurement dashboard)
  const StatusPill = ({ status }) => (
    <span
      title={status || ""}
      className={[
        "inline-flex items-center gap-1.5",
        "px-2.5 py-0.5 rounded-full text-[11px] font-medium",
        "max-w-full min-w-0 overflow-hidden whitespace-nowrap",
        statusBadgeClass(status),
      ].join(" ")}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
      <span className="min-w-0 truncate">{prettyStatus(status)}</span>
    </span>
  );

  // ---------- Load ----------
  const loadRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load requests", err);
      setRequests([]);
    }
  };

  const loadOffers = async (reqs) => {
    try {
      const list = await Promise.all(
        reqs.map((r) =>
          API.get(`/requests/${r.id}/offers`).then((res) => ({
            id: r.id,
            offers: res.data || [],
          }))
        )
      );
      const map = {};
      list.forEach((x) => (map[x.id] = x.offers));
      setOffersByRequest(map);
    } catch (err) {
      console.error("Failed to load offers", err);
      setOffersByRequest({});
    }
  };

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const init = async () => {
      setLoading(true);
      await loadRequests();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (requests.length) loadOffers(requests);
    else setOffersByRequest({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests.map((r) => r.id).join("|")]);

  // ---------- RP Focus List ----------
  const rpRequests = useMemo(() => {
    const allowed = new Set(["APPROVED_FOR_BIDDING", "BIDDING", "EVALUATION"]);
    return (requests || []).filter((r) => allowed.has(r.status));
  }, [requests]);

  const totalOffers = useMemo(() => {
    return Object.values(offersByRequest).reduce(
      (acc, arr) => acc + (arr ? arr.length : 0),
      0
    );
  }, [offersByRequest]);

  // ✅ Filtered RP list (UI-only, does not remove logic)
  const filteredRpRequests = useMemo(() => {
    if (!searchQuery.trim()) return rpRequests;
    const q = searchQuery.toLowerCase();

    return (rpRequests || []).filter((r) =>
      [
        r.title,
        r.status,
        r.requestedByUsername,
        srLabel(r),
        String(r.id ?? ""),
        r.biddingActive === true ? "active" : "inactive",
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rpRequests, searchQuery]);

  // ---------- Charts ----------
  const statusCounts = useMemo(() => {
    return (rpRequests || []).reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
  }, [rpRequests]);

  const pieData = useMemo(
    () => ({
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            "#60a5fa",
            "#a78bfa",
            "#818cf8",
            "#34d399",
            "#fb7185",
            "#94a3b8",
          ],
        },
      ],
    }),
    [statusCounts]
  );

  const barLabels = useMemo(
    () => rpRequests.slice(0, 10).map((r) => srLabel(r)),
    [rpRequests]
  );

  const barValues = useMemo(
    () =>
      rpRequests
        .slice(0, 10)
        .map((r) => (offersByRequest[r.id] || []).length),
    [rpRequests, offersByRequest]
  );

  const barData = useMemo(
    () => ({
      labels: barLabels,
      datasets: [{ label: "Offers", data: barValues, backgroundColor: "#6366f1" }],
    }),
    [barLabels, barValues]
  );

  // ---------- Actions ----------
  const pullOffers = async (requestId) => {
    try {
      await API.post(`/requests/${requestId}/pull-provider-offers`);
      toast.success("Provider offers pulled.");
      await loadRequests();
    } catch (err) {
      console.error("Pull provider offers failed", err?.response || err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to pull provider offers (check biddingActive / mock link)."
      );
    }
  };

  const openDm = (req) => {
    if (!req?.requestedByUsername) {
      toast.error("This request has no PM username.");
      return;
    }
    setDmTargetRequest(req);
    setDmMessage("");
    setDmOpen(true);
  };

  const sendDm = async () => {
    if (!dmTargetRequest?.requestedByUsername) {
      toast.error("No valid PM to message.");
      return;
    }
    if (!dmMessage.trim()) {
      toast.error("Please write a message.");
      return;
    }

    try {
      const recipientUsername = dmTargetRequest.requestedByUsername;
      const recipientRole = "PROJECT_MANAGER";

      const users = [currentUsername, recipientUsername].sort();
      const threadKey = `REQ-${dmTargetRequest.id}:${users[0]}-${users[1]}`;

      await API.post(
        "/notifications/direct-message",
        {
          threadKey,
          requestId: String(dmTargetRequest.id),
          senderUsername: currentUsername,
          senderRole: myRole,
          recipientUsername,
          recipientRole,
          message: `RP question about ${srLabel(dmTargetRequest)} "${dmTargetRequest.title}": ${dmMessage}`,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success("Message sent to PM (DM).");
      setDmOpen(false);
      setDmTargetRequest(null);
      setDmMessage("");
    } catch (err) {
      console.error("Failed to send DM", err?.response || err);
      toast.error("Failed to send DM.");
    }
  };

  // ---------- Tabs UI ----------
  const TabButton = ({ id, label, count }) => {
    const isActive = activeTab === id;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(id)}
        className={[
          "px-3.5 py-2 rounded-xl text-sm font-semibold transition ring-1",
          isActive
            ? "bg-slate-900 text-white ring-slate-900"
            : "bg-white/80 text-slate-700 ring-slate-200 hover:bg-white",
        ].join(" ")}
      >
        <span className="mr-2">{label}</span>
        {typeof count === "number" && (
          <span
            className={[
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
              isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",
            ].join(" ")}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  // ---------- Render ----------
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="lg:flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex-1 bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
        {/* ✅ prevent “page-level” horizontal scrolling from wide tables */}
        <div className="w-full overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-10">
            {/* ✅ Sticky TopNav */}
            <div className="sticky top-0 z-50">
              <TopNav />
            </div>

            <header className="mt-2 sm:mt-4 mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Resource Planner Panel
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  Monitor bidding, pull supplier offers and coordinate with PM
                  before final decision.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Signed in as{" "}
                <span className="font-medium text-slate-700">
                  {currentUsername || "RP"}
                </span>
              </div>
            </header>

            {/* ✅ Sticky Tabs + Search row */}
            <div className="sticky top-[88px] z-40 mb-4">
              <div className="bg-white/70 backdrop-blur rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <TabButton id={TAB.DASHBOARD} label="Dashboard" />
                    <TabButton
                      id={TAB.REQUESTS}
                      label="Requests"
                      count={rpRequests.length}
                    />
                  </div>

                  {/* Search (most useful on Requests tab, but available always) */}
                  <div className="flex items-center gap-2 w-full md:w-[420px]">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search SR, title, status, PM..."
                        className="w-full rounded-xl border border-slate-200 bg-white/90 pl-10 pr-10 py-2 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400"
                      />
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                      </svg>

                      {searchQuery.trim() && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs
                                     text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Clear search"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="hidden lg:block text-xs text-slate-500 whitespace-nowrap">
                      Sticky tabs for faster navigation.
                    </p>
                  </div>
                </div>

                {activeTab === TAB.REQUESTS && searchQuery.trim() && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {filteredRpRequests.length}
                    </span>{" "}
                    result(s) for{" "}
                    <span className="font-semibold text-slate-700">
                      “{searchQuery.trim()}”
                    </span>
                    .
                  </div>
                )}
              </div>
            </div>

            {/* ===== TAB: DASHBOARD ===== */}
            {activeTab === TAB.DASHBOARD && (
              <>
                {/* Overview cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      RP Requests
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {rpRequests.length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Approved/Bidding/Evaluation
                    </p>
                  </div>

                  <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Total Offers
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {totalOffers}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Offers loaded from backend
                    </p>
                  </div>

                  <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Approved For Bidding
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {
                        rpRequests.filter(
                          (r) => r.status === "APPROVED_FOR_BIDDING"
                        ).length
                      }
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Needs offers pulled
                    </p>
                  </div>

                  <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Evaluation
                    </p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">
                      {rpRequests.filter((r) => r.status === "EVALUATION").length}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Preferred offer selected
                    </p>
                  </div>
                </section>

                {/* Charts */}
                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 overflow-hidden">
                    <h2 className="text-sm font-semibold text-slate-900 mb-1">
                      RP Requests by Status
                    </h2>
                    <p className="text-xs text-slate-500 mb-2">
                      Only relevant statuses for RP view.
                    </p>
                    <div className="h-52 flex items-center justify-center">
                      <Pie data={pieData} />
                    </div>
                  </div>

                  <div className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 overflow-hidden">
                    <h2 className="text-sm font-semibold text-slate-900 mb-1">
                      Offers Count (Top 10)
                    </h2>
                    <p className="text-xs text-slate-500 mb-2">
                      How many offers exist per request.
                    </p>
                    <div className="h-52 flex items-center justify-center">
                      <Bar data={barData} />
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* ===== TAB: REQUESTS ===== */}
            {activeTab === TAB.REQUESTS && (
              <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pull provider offers, contact PM, and open request details
                      to evaluate.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <p className="text-sm text-slate-600">Loading…</p>
                ) : filteredRpRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                    {searchQuery.trim()
                      ? "No requests match your search."
                      : "No requests in APPROVED_FOR_BIDDING / BIDDING / EVALUATION right now."}
                  </p>
                ) : (
                  // ✅ allow scroll only when needed; prevent overlap always
                  <div className="w-full overflow-x-auto lg:overflow-x-hidden rounded-xl border border-slate-100 bg-white">
                    <table className="w-full text-sm table-fixed">
                      <thead className="bg-slate-50/80">
                        <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                          <th className="py-2.5 px-3 w-[40%]">Request</th>
                          <th className="py-2.5 px-3 w-[14%]">Status</th>
                          <th className="py-2.5 px-3 w-[14%]">PM</th>
                          <th className="py-2.5 px-3 w-[8%] text-center">Offers</th>
                          <th className="py-2.5 px-3 w-[10%]">Bidding</th>
                          <th className="py-2.5 px-3 w-[14%] text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredRpRequests.map((r) => {
                          const offers = offersByRequest[r.id] || [];
                          const biddingActive = r.biddingActive === true;

                          return (
                            <tr
                              key={r.id}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              {/* Request */}
                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <div className="min-w-0">
                                  <p className="font-medium text-slate-900 text-sm truncate">
                                    {r.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate">
                                    {srLabel(r)} • ID: {r.id}
                                  </p>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <StatusPill status={r.status} />
                              </td>

                              {/* PM */}
                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden">
                                <span className="block truncate">
                                  {r.requestedByUsername || "-"}
                                </span>
                              </td>

                              {/* Offers */}
                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 text-center">
                                {offers.length}
                              </td>

                              {/* Bidding */}
                              <td className="py-2.5 px-3 align-middle text-xs min-w-0 overflow-hidden">
                                <span
                                  className={
                                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border whitespace-nowrap " +
                                    (biddingActive
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-slate-50 text-slate-700 border-slate-200")
                                  }
                                >
                                  {biddingActive ? "Active" : "Inactive"}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <div className="flex justify-end gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => navigate(`/requests/${r.id}`)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 whitespace-nowrap"
                                    type="button"
                                  >
                                    View
                                  </button>

                                  <button
                                    onClick={() => openDm(r)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 whitespace-nowrap"
                                    type="button"
                                  >
                                    Contact PM
                                  </button>

                                  <button
                                    onClick={() => pullOffers(r.id)}
                                    disabled={!biddingActive}
                                    className={
                                      "px-2.5 py-1 text-xs rounded-md text-white whitespace-nowrap " +
                                      (biddingActive
                                        ? "bg-blue-600 hover:bg-blue-700"
                                        : "bg-gray-300 cursor-not-allowed")
                                    }
                                    type="button"
                                  >
                                    Pull Offers
                                  </button>
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

            {/* DM Modal */}
            {dmOpen && dmTargetRequest && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
                <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                  <h3 className="text-lg font-semibold mb-2 text-slate-900">
                    Contact Project Manager
                  </h3>
                  <p className="text-xs text-slate-600 mb-2 break-words">
                    Request:{" "}
                    <span className="font-semibold">
                      {srLabel(dmTargetRequest)} — {dmTargetRequest.title}
                    </span>
                  </p>
                  <textarea
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-400"
                    placeholder="Write a short message for the PM (e.g., clarify criteria, timeline, onsite days...)"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDmOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendDm}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                      type="button"
                    >
                      Send message
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
