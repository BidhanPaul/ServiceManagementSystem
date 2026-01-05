// src/components/ProcurementDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

const ProcurementDashboard = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offersByRequestId, setOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);

  // contact PM modal
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactTargetRequest, setContactTargetRequest] = useState(null);

  // reject modal
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTargetRequest, setRejectTargetRequest] = useState(null);

  const currentUsername = localStorage.getItem("username");

  // -------- LOAD DATA --------

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
    if (requests.length > 0) {
      loadOffersForRequests(requests);
    } else {
      setOffersByRequestId({});
    }
  }, [requests]);

  // -------- HELPERS --------

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

  const projectLabel = (req) => {
    if (!req.projectIds || req.projectIds.length === 0) return "-";
    const id = req.projectIds[0];
    const proj = projects.find((p) => p.id === id);
    if (!proj) return id;
    return `${proj.customer} – ${proj.name}`;
  };

  const contractLabel = (req) => {
    if (!req.contractIds || req.contractIds.length === 0) return "-";
    const id = req.contractIds[0];
    const c = contracts.find((x) => x.id === id);
    if (!c) return id;
    return `${c.supplier} – ${c.domain}`;
  };

  const pendingRequests = requests.filter((r) => r.status === "IN_REVIEW");

  const totalOffers = Object.values(offersByRequestId).reduce(
    (acc, arr) => acc + (arr ? arr.length : 0),
    0
  );

  // -------- ACTIONS --------

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
    if (!contactTargetRequest || !contactTargetRequest.requestedByUsername) {
      toast.error("No valid PM to contact.");
      return;
    }
    if (!contactMessage.trim()) {
      toast.error("Please write a message for the PM.");
      return;
    }

    try {
      await API.post(
        `/notifications/user/${contactTargetRequest.requestedByUsername}`,
        `Message from Procurement Officer about request "${contactTargetRequest.title}": ${contactMessage}`
      );

      toast.success("Message sent to Project Manager.");
      setContactOpen(false);
      setContactTargetRequest(null);
      setContactMessage("");
    } catch (err) {
      console.error("Failed to send PM message", err);
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
      await API.put(
        `/requests/${rejectTargetRequest.id}/reject`,
        rejectReason,
        {
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
      toast.success("Request rejected.");
      setRejectOpen(false);
      setRejectTargetRequest(null);
      setRejectReason("");
      loadRequests();
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
    } catch (err) {
      console.error("Failed to approve request", err);
      toast.error("Failed to approve request.");
    }
  };

  // -------- RENDER --------

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300">
        <div className="max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8">
          <TopNav />

          {/* Page header */}
          <header className="mt-4 mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Procurement Officer Panel
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Review, approve and oversee service requests and supplier
                offers.
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
            {/* Pending approvals */}
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Pending approvals
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingRequests.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Requests currently awaiting your decision
                </p>
              </div>
            </div>

            {/* All requests */}
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Service requests
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {requests.length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total requests in the system
                </p>
              </div>
            </div>

            {/* Projects */}
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

            {/* Offers */}
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Supplier offers
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalOffers}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Offers received across all requests
                </p>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-600 text-sm">Loading dashboard data…</p>
            </div>
          ) : (
            <>
              {/* Requests waiting for approval */}
              <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Requests Waiting for Approval
                    </h2>
                    <p className="text-xs text-slate-500">
                      These requests have been submitted by Project Managers and
                      require Procurement approval.
                    </p>
                  </div>
                  {pendingRequests.length > 0 && (
                    <span className="hidden md:inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-medium">
                      {pendingRequests.length} pending
                    </span>
                  )}
                </div>

                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                    No requests currently waiting for your approval.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/80">
                        <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                          <th className="py-2.5 px-3">Title</th>
                          <th className="py-2.5 px-3">Project</th>
                          <th className="py-2.5 px-3">Contract</th>
                          <th className="py-2.5 px-3">Requested By</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {pendingRequests.map((r) => (
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
                                  {r.type} • {r.roles?.length || 0} role(s)
                                </span>
                              </div>
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
                            <td className="py-2.5 px-3 align-middle">
                              <div className="flex justify-end flex-wrap gap-1.5">
                                <button
                                  onClick={() => navigate(`/requests/${r.id}`)}
                                  className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => openContactPm(r)}
                                  className="px-2.5 py-1 text-xs rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                                >
                                  Contact PM
                                </button>
                                <button
                                  onClick={() => approveRequest(r)}
                                  className="px-2.5 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => openReject(r)}
                                  className="px-2.5 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
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

              {/* All Requests */}
              <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      All Service Requests
                    </h2>
                    <p className="text-xs text-slate-500">
                      Overview of all requests across projects and contracts.
                    </p>
                  </div>
                </div>
                {requests.length === 0 ? (
                  <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                    No service requests in the system.
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

              {/* Offers per request */}
              <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-slate-900">
                      Offers per Request
                    </h2>
                    <p className="text-xs text-slate-500">
                      Quick view of how many supplier offers each request has.
                    </p>
                  </div>
                </div>

                {requests.length === 0 ? (
                  <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                    No requests → no offers yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {requests.map((req) => {
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
                            <span className="inline-flex items-center rounded-full bg-white text-slate-700 border border-slate-200 px-2.5 py-1 text-[11px] font-medium">
                              {offers.length} offer(s)
                            </span>
                          </div>
                          {offers.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No offers submitted yet.
                            </p>
                          ) : (
                            <ul className="text-xs text-slate-700 list-disc ml-4 space-y-0.5">
                              {offers.map((o) => (
                                <li key={o.id}>
                                  <span className="font-medium">
                                    {o.specialistName || "Unnamed"}
                                  </span>{" "}
                                  – {o.supplierName} ({o.dailyRate} €/day)
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Contact PM modal */}
          {contactOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40">
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
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitContactPm}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Send message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reject modal */}
          {rejectOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40">
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
                  placeholder="Provide a clear reason for the rejection (this will be visible to the Project Manager)."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setRejectOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReject}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
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
