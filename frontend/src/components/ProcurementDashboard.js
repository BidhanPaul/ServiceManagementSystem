// src/components/ProcurementDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

const TAB = {
  PENDING: "pending",
  ALL: "all",
};

const ProcurementDashboard = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offersByRequestId, setOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Tabs (so no long scrolling)
  const [activeTab, setActiveTab] = useState(TAB.PENDING);

  // ✅ Search (UI only; no logic removed)
  const [searchQuery, setSearchQuery] = useState("");

  // contact PM modal
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactTargetRequest, setContactTargetRequest] = useState(null);

  // reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetRequest, setRejectTargetRequest] = useState(null);

  const currentUsername = localStorage.getItem("username") || "";
  const myRole = localStorage.getItem("role") || "PROCUREMENT_OFFICER";

  // ---------------- LOAD DATA ----------------

  const loadProjects = async () => {
    try {
      const res = await API.get("/external/projects");
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load projects (external)", err);
      setProjects([]);
    }
  };

  const loadContracts = async () => {
    try {
      const res = await API.get("/external/contracts");
      setContracts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load contracts (external)", err);
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

  const loadOffersForRequests = async (reqs) => {
    try {
      const promises = reqs.map((r) =>
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
      console.error("Failed to load offers for requests", err);
      setOffersByRequestId({});
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadProjects(), loadContracts(), loadRequests()]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (requests.length > 0) loadOffersForRequests(requests);
    else setOffersByRequestId({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests]);

  // ---------------- HELPERS ----------------

  const statusBadgeClass = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-700 border border-gray-200";
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

  // ✅ UI-only display helper (does not change logic/data)
  const prettyStatus = (s) => {
    if (!s) return "-";
    return String(s)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  // ✅ Never-overlap status pill
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

  const projectLabel = (req) => {
    const id = req?.projectId;
    if (!id) return "-";

    const p = projects.find(
      (x) => String(x.projectId) === String(id) || String(x.id) === String(id)
    );

    const name =
      req?.projectName ||
      p?.projectDescription ||
      p?.projectId ||
      p?.name ||
      "";

    return name ? `${id} – ${name}` : String(id);
  };

  const contractLabel = (req) => {
    const id = req?.contractId;
    if (!id) return "-";

    const c = contracts.find((x) => String(x.id) === String(id));
    const supplier = req?.contractSupplier || c?.supplier || "";
    const domain = c?.domain || "";

    if (supplier && domain) return `${supplier} – ${domain}`;
    if (supplier) return `${supplier} – ${id}`;
    return String(id);
  };

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "IN_REVIEW"),
    [requests]
  );

  const totalOffers = useMemo(
    () =>
      Object.values(offersByRequestId).reduce(
        (acc, arr) => acc + (arr ? arr.length : 0),
        0
      ),
    [offersByRequestId]
  );

  // ✅ FILTERED LISTS (UI only; keeps all logic intact)
  const filteredPendingRequests = useMemo(() => {
    if (!searchQuery.trim()) return pendingRequests;
    const q = searchQuery.toLowerCase();

    return pendingRequests.filter((r) =>
      [
        r.title,
        r.status,
        r.type,
        r.requestedByUsername,
        projectLabel(r),
        contractLabel(r),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [pendingRequests, searchQuery]); // projectLabel/contractLabel use state, but UI-only safe

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();

    return requests.filter((r) =>
      [
        r.title,
        r.status,
        r.type,
        r.requestedByUsername,
        projectLabel(r),
        contractLabel(r),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [requests, searchQuery]);

  // If user is on Pending tab but there are none, auto-switch to All tab
  useEffect(() => {
    if (!loading && activeTab === TAB.PENDING && pendingRequests.length === 0) {
      setActiveTab(TAB.ALL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pendingRequests.length]);

  // ---------------- ACTIONS ----------------

  const openContactPm = (req) => {
    if (!req.requestedByUsername) {
      toast.error("This request has no assigned Project Manager.");
      return;
    }
    setContactTargetRequest(req);
    setContactMessage("");
    setContactOpen(true);
  };

  const submitContactPm = async () => {
    if (!contactTargetRequest?.requestedByUsername) {
      toast.error("No valid PM to contact.");
      return;
    }
    if (!contactMessage.trim()) {
      toast.error("Please write a message for the PM.");
      return;
    }

    const pm = contactTargetRequest.requestedByUsername;
    const from = currentUsername;
    const reqId = contactTargetRequest.id;

    try {
      await API.post(
        `/notifications/user/${pm}`,
        `DM:from=${from};to=${pm};req=${reqId}; ${contactMessage}`,
        { headers: { "Content-Type": "text/plain" } }
      );

      toast.success("Message sent to Project Manager.");
      setContactOpen(false);
      setContactTargetRequest(null);
      setContactMessage("");
    } catch (err) {
      console.error("Failed to send PM message", err?.response || err);
      toast.error("Failed to send message to PM.");
    }
  };

  const openReject = (req) => {
    setRejectTargetRequest(req);
    setRejectReason("");
    setRejectOpen(true);
  };

  const submitReject = async () => {
    if (!rejectTargetRequest) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    try {
      await API.put(`/requests/${rejectTargetRequest.id}/reject`, rejectReason, {
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
      });
      toast.success("Request rejected.");
      setRejectOpen(false);
      setRejectTargetRequest(null);
      setRejectReason("");
      loadRequests();
      setActiveTab(TAB.PENDING);
    } catch (err) {
      console.error("Failed to reject request", err);
      toast.error("Failed to reject request.");
    }
  };

  const approveRequest = async (req) => {
    try {
      await API.put(`/requests/${req.id}/approve`);
      toast.success("Request approved for bidding.");
      loadRequests();
      setActiveTab(TAB.PENDING);
    } catch (err) {
      console.error("Failed to approve request", err);
      toast.error("Failed to approve request.");
    }
  };

  // ---------------- SMALL UI: Tabs ----------------
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
        <span
          className={[
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
            isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",
          ].join(" ")}
        >
          {count}
        </span>
      </button>
    );
  };

  // ---------------- RENDER ----------------
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8 pb-10">
          {/* ✅ Sticky TopNav */}
          <div className="sticky top-0 z-50">
            <TopNav />
          </div>

          <header className="mt-4 mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Procurement Officer Panel
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Review, approve and oversee service requests and supplier offers.
              </p>
            </div>
            <div className="mt-2 md:mt-0 text-xs text-slate-500">
              Signed in as{" "}
              <span className="font-medium text-slate-700">
                {currentUsername || "Procurement Officer"}
              </span>
            </div>
          </header>

          {/* Overview cards */}
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-700">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 6v6l3 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="9" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Pending approvals
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingRequests.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Awaiting your decision
                </p>
              </div>
            </div>

            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 rounded-2xl bg-sky-50 text-sky-700">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    d="M8 12h8M12 8v8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Service requests
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {requests.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total requests in system
                </p>
              </div>
            </div>

            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Projects (External)
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {projects.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Available project references
                </p>
              </div>
            </div>

            <div className="bg-white/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Supplier offers
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalOffers}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Offers received across requests
                </p>
              </div>
            </div>
          </section>

          {/* ✅ Sticky Tabs + Search row */}
          <div className="sticky top-[88px] z-40 mb-4">
            <div className="bg-white/70 backdrop-blur rounded-2xl p-3 border border-slate-100 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  <TabButton
                    id={TAB.PENDING}
                    label="Pending approvals"
                    count={pendingRequests.length}
                  />
                  <TabButton
                    id={TAB.ALL}
                    label="All requests"
                    count={requests.length}
                  />
                </div>

                {/* Search */}
                <div className="flex items-center gap-2 w-full md:w-[420px]">
                  <div className="relative w-full">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, project, contract, status..."
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
                      <path
                        d="M21 21l-4.3-4.3"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Clear button */}
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
                </div>
              </div>

              {/* Optional: results hint (small + helpful) */}
              {searchQuery.trim() && (
                <div className="mt-2 text-[11px] text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {activeTab === TAB.PENDING
                      ? filteredPendingRequests.length
                      : filteredRequests.length}
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-600 text-sm">Loading dashboard data…</p>
            </div>
          ) : (
            <>
              {/* ===== TAB CONTENT ===== */}

              {activeTab === TAB.PENDING && (
                <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0">
                      <h2 className="text-base md:text-lg font-semibold text-slate-900">
                        Requests Waiting for Approval
                      </h2>
                      <p className="text-xs text-slate-500">
                        Submitted by Project Managers, waiting for your approval.
                      </p>
                    </div>
                    {pendingRequests.length > 0 && (
                      <span className="hidden md:inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-medium">
                        {pendingRequests.length} pending
                      </span>
                    )}
                  </div>

                  {filteredPendingRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                      {searchQuery.trim()
                        ? "No requests match your search."
                        : "No requests currently waiting for your approval."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto lg:overflow-x-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-sm table-fixed">
                        <thead className="bg-slate-50/80">
                          <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="py-2.5 px-3 w-[34%]">Title</th>
                            <th className="py-2.5 px-3 w-[28%]">Project</th>
                            <th className="py-2.5 px-3 w-[20%] hidden lg:table-cell">
                              Contract
                            </th>
                            <th className="py-2.5 px-3 w-[12%] hidden xl:table-cell">
                              Requested By
                            </th>
                            <th className="py-2.5 px-3 w-[12%]">Status</th>
                            <th className="py-2.5 px-3 w-[14%] text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredPendingRequests.map((r) => (
                            <tr
                              key={r.id}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-slate-900 text-sm truncate">
                                    {r.title}
                                  </span>
                                  <span className="text-[11px] text-slate-500 truncate">
                                    {r.type} • {r.roles?.length || 0} role(s)
                                  </span>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden">
                                <span className="block truncate">
                                  {projectLabel(r)}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden hidden lg:table-cell">
                                <span className="block truncate">
                                  {contractLabel(r)}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden hidden xl:table-cell">
                                <span className="block truncate">
                                  {r.requestedByUsername || "-"}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <StatusPill status={r.status} />
                              </td>

                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <div className="flex justify-end flex-wrap gap-1.5">
                                  <button
                                    onClick={() => navigate(`/requests/${r.id}`)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                    type="button"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => openContactPm(r)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                    type="button"
                                  >
                                    Contact PM
                                  </button>
                                  <button
                                    onClick={() => approveRequest(r)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                    type="button"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => openReject(r)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                                    type="button"
                                  >
                                    Reject
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

              {activeTab === TAB.ALL && (
                <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0">
                      <h2 className="text-base md:text-lg font-semibold text-slate-900">
                        All Service Requests
                      </h2>
                      <p className="text-xs text-slate-500">
                        Overview across all projects and contracts.
                      </p>
                    </div>
                  </div>

                  {filteredRequests.length === 0 ? (
                    <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                      {searchQuery.trim()
                        ? "No requests match your search."
                        : "No service requests in the system."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto lg:overflow-x-hidden rounded-xl border border-slate-100">
                      <table className="w-full text-sm table-fixed">
                        <thead className="bg-slate-50/80">
                          <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                            <th className="py-2.5 px-3 w-[34%]">Title</th>
                            <th className="py-2.5 px-3 w-[10%] hidden lg:table-cell">
                              Type
                            </th>
                            <th className="py-2.5 px-3 w-[12%]">Status</th>
                            <th className="py-2.5 px-3 w-[26%]">Project</th>
                            <th className="py-2.5 px-3 w-[18%] hidden xl:table-cell">
                              Contract
                            </th>
                            <th className="py-2.5 px-3 w-[14%] hidden xl:table-cell">
                              Requested By
                            </th>
                            <th className="py-2.5 px-3 w-[10%] text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100 bg-white">
                          {filteredRequests.map((r) => (
                            <tr
                              key={r.id}
                              className="hover:bg-slate-50/60 transition-colors"
                            >
                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium text-slate-900 text-sm truncate">
                                    {r.title}
                                  </span>
                                  <span className="text-[11px] text-slate-500 truncate">
                                    {r.roles?.length || 0} role(s)
                                  </span>
                                </div>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden hidden lg:table-cell">
                                <span className="block truncate">{r.type}</span>
                              </td>

                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <StatusPill status={r.status} />
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden">
                                <span className="block truncate">
                                  {projectLabel(r)}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden hidden xl:table-cell">
                                <span className="block truncate">
                                  {contractLabel(r)}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden hidden xl:table-cell">
                                <span className="block truncate">
                                  {r.requestedByUsername || "-"}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => navigate(`/requests/${r.id}`)}
                                    className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
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
            </>
          )}

          {/* Contact PM modal */}
          {contactOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Contact Project Manager
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  Request:{" "}
                  <span className="font-semibold">
                    {contactTargetRequest?.title}
                  </span>
                </p>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-sky-500/60 focus:border-sky-400"
                  placeholder="Write a short message / clarification for the Project Manager..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setContactOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitContactPm}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    type="button"
                  >
                    Send message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject modal */}
          {rejectOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Reject Service Request
                </h3>
                <p className="text-xs text-slate-600 mb-2">
                  Request:{" "}
                  <span className="font-semibold">
                    {rejectTargetRequest?.title}
                  </span>
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-400"
                  placeholder="Provide a clear reason for the rejection (visible to the Project Manager)."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setRejectOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReject}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    type="button"
                  >
                    Confirm rejection
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

export default ProcurementDashboard;
