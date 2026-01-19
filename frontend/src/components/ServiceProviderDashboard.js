// src/components/ServiceProviderDashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

const TAB = {
  OPEN: "open",
  MY_BIDS: "my_bids",
};

const ServiceProviderDashboard = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [myOffersByRequestId, setMyOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);

  // Tabs + Search
  const [activeTab, setActiveTab] = useState(TAB.OPEN);
  const [searchQuery, setSearchQuery] = useState("");

  // Bid modal
  const [bidOpen, setBidOpen] = useState(false);
  const [bidTargetRequest, setBidTargetRequest] = useState(null);

  // Supplier info (try to read from localStorage; editable)
  const [supplierId, setSupplierId] = useState(
    localStorage.getItem("supplierId") || localStorage.getItem("supplier_id") || ""
  );
  const [supplierName, setSupplierName] = useState(
    localStorage.getItem("supplierName") ||
      localStorage.getItem("supplier_name") ||
      ""
  );

  // Offer form state (structured)
  const [currency, setCurrency] = useState("EUR");
  const [candidates, setCandidates] = useState([
    {
      specialistId: "",
      materialNumber: "",
      role: "",
      experienceLevel: "",
      technologyLevel: "",
      dailyRate: "",
      travelCostPerOnsiteDay: "",
      contractualRelationship: "Employee",
      subcontractorCompany: "",
    },
  ]);

  const [proposedStartDate, setProposedStartDate] = useState("");
  const [proposedEndDate, setProposedEndDate] = useState("");
  const [proposedOnsiteDays, setProposedOnsiteDays] = useState("");
  const [notes, setNotes] = useState("");

  const currentUsername = localStorage.getItem("username") || "";
  const myRole = localStorage.getItem("role") || "SERVICE_PROVIDER";

  // ---------- Helpers ----------
  const srLabel = (req) => {
    if (!req) return "-";
    if (req.requestNumber && String(req.requestNumber).trim())
      return String(req.requestNumber).trim();
    if (req.id == null) return "-";
    return `SR-${String(req.id).padStart(6, "0")}`;
  };

  const statusBadgeClass = (status) => {
    switch (status) {
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
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const prettyStatus = (s) => {
    if (!s) return "-";
    return String(s)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const StatusPill = ({ status }) => (
    <span
      title={status || ""}
      className={[
        "inline-flex items-center gap-1.5",
        "px-2.5 py-0.5 rounded-full text-[11px] font-medium",
        "max-w-full min-w-0 overflow-hidden whitespace-nowrap border",
        statusBadgeClass(status),
      ].join(" ")}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
      <span className="min-w-0 truncate">{prettyStatus(status)}</span>
    </span>
  );

  const toNumberOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  const toIntOrNull = (v) => {
    if (v === "" || v == null) return null;
    const n = parseInt(String(v), 10);
    return Number.isFinite(n) ? n : null;
  };

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

  // Load "my offer" per request: loads offers for each open request, then tries to match current user.
  const loadMyOffers = async (reqs) => {
    try {
      const entries = await Promise.all(
        reqs.map((r) =>
          API.get(`/requests/${r.id}/offers`).then((res) => ({
            requestId: r.id,
            offers: res.data || [],
          }))
        )
      );

      const map = {};
      entries.forEach(({ requestId, offers }) => {
        const mine =
          offers.find((o) => {
            const u =
              o.providerUsername ||
              o.supplierUsername ||
              o.createdByUsername ||
              o.username ||
              o.user ||
              o.supplierId ||
              "";
            // some APIs store supplierId instead of username – we allow both checks
            return (
              String(u) === String(currentUsername) ||
              (supplierId && String(u) === String(supplierId))
            );
          }) || null;

        map[requestId] = mine;
      });

      setMyOffersByRequestId(map);
    } catch (err) {
      console.error("Failed to load offers for requests", err);
      setMyOffersByRequestId({});
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadRequests();
      setLoading(false);
    };
    init();
    // eslint-disable-next-line
  }, []);

  // ---------- Derived lists ----------
  const openRequests = useMemo(() => {
    const allowed = new Set(["APPROVED_FOR_BIDDING", "BIDDING"]);
    return (requests || []).filter((r) => allowed.has(r.status));
  }, [requests]);

  useEffect(() => {
    if (openRequests.length) loadMyOffers(openRequests);
    else setMyOffersByRequestId({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequests.map((r) => r.id).join("|"), currentUsername, supplierId]);

  const myBidRequests = useMemo(() => {
    return openRequests.filter((r) => Boolean(myOffersByRequestId[r.id]));
  }, [openRequests, myOffersByRequestId]);

  const openCount = openRequests.length;
  const myBidsCount = myBidRequests.length;

  const filteredOpenRequests = useMemo(() => {
    if (!searchQuery.trim()) return openRequests;
    const q = searchQuery.toLowerCase();
    return openRequests.filter((r) =>
      [r.title, r.status, r.type, r.requestedByUsername, srLabel(r), String(r.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [openRequests, searchQuery]);

  const filteredMyBidRequests = useMemo(() => {
    if (!searchQuery.trim()) return myBidRequests;
    const q = searchQuery.toLowerCase();
    return myBidRequests.filter((r) =>
      [r.title, r.status, r.type, r.requestedByUsername, srLabel(r), String(r.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [myBidRequests, searchQuery]);

  // ---------- Actions ----------
  const resetBidForm = () => {
    setCurrency("EUR");
    setCandidates([
      {
        specialistId: "",
        materialNumber: "",
        role: "",
        experienceLevel: "",
        technologyLevel: "",
        dailyRate: "",
        travelCostPerOnsiteDay: "",
        contractualRelationship: "Employee",
        subcontractorCompany: "",
      },
    ]);
    setProposedStartDate("");
    setProposedEndDate("");
    setProposedOnsiteDays("");
    setNotes("");
  };

  const openBid = (req) => {
    setBidTargetRequest(req);
    resetBidForm();
    setBidOpen(true);
  };

  const addCandidate = () => {
    setCandidates((prev) => [
      ...prev,
      {
        specialistId: "",
        materialNumber: "",
        role: "",
        experienceLevel: "",
        technologyLevel: "",
        dailyRate: "",
        travelCostPerOnsiteDay: "",
        contractualRelationship: "Employee",
        subcontractorCompany: "",
      },
    ]);
  };

  const removeCandidate = (idx) => {
    setCandidates((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCandidate = (idx, key, value) => {
    setCandidates((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [key]: value } : c))
    );
  };

  const validateOffer = () => {
    if (!bidTargetRequest?.id) return "No request selected.";
    if (!supplierId.trim()) return "Supplier ID is required.";
    if (!supplierName.trim()) return "Supplier name is required.";
    if (!currency.trim()) return "Currency is required.";

    if (!proposedStartDate) return "Proposed start date is required.";
    if (!proposedEndDate) return "Proposed end date is required.";

    const onsite = toIntOrNull(proposedOnsiteDays);
    if (onsite == null || onsite < 0) return "Proposed onsite days must be a number.";

    if (!candidates.length) return "At least one candidate is required.";

    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (!String(c.role || "").trim()) return `Candidate #${i + 1}: role is required.`;
      if (!String(c.experienceLevel || "").trim())
        return `Candidate #${i + 1}: experience level is required.`;
      if (!String(c.technologyLevel || "").trim())
        return `Candidate #${i + 1}: technology level is required.`;

      const dr = toNumberOrNull(c.dailyRate);
      if (dr == null || dr <= 0) return `Candidate #${i + 1}: daily rate must be > 0.`;

      const tc = toNumberOrNull(c.travelCostPerOnsiteDay);
      if (tc == null || tc < 0)
        return `Candidate #${i + 1}: travel cost per onsite day must be >= 0.`;

      if (!String(c.contractualRelationship || "").trim())
        return `Candidate #${i + 1}: contractual relationship is required.`;

      if (
        String(c.contractualRelationship) === "Subcontractor" &&
        !String(c.subcontractorCompany || "").trim()
      ) {
        return `Candidate #${i + 1}: subcontractor company is required for Subcontractor.`;
      }
    }

    return null;
  };

  // Build payload exactly like your example structure
  const buildOfferPayload = () => {
    const requestIdStr = srLabel(bidTargetRequest);

    const normalizedCandidates = candidates.map((c) => ({
      specialistId: String(c.specialistId || "").trim() || null,
      materialNumber: String(c.materialNumber || "").trim() || null,
      role: String(c.role || "").trim(),
      experienceLevel: String(c.experienceLevel || "").trim(),
      technologyLevel: String(c.technologyLevel || "").trim(),
      dailyRate: toNumberOrNull(c.dailyRate),
      travelCostPerOnsiteDay: toNumberOrNull(c.travelCostPerOnsiteDay),
      contractualRelationship: String(c.contractualRelationship || "").trim(),
      subcontractorCompany:
        String(c.contractualRelationship) === "Subcontractor"
          ? String(c.subcontractorCompany || "").trim() || null
          : null,
    }));

    return {
      requestId: requestIdStr,
      supplierId: supplierId.trim(),
      supplierName: supplierName.trim(),
      response: {
        staffing: {
          currency: currency.trim(),
          candidates: normalizedCandidates,
        },
        delivery: {
          proposedStartDate,
          proposedEndDate,
          proposedOnsiteDays: toIntOrNull(proposedOnsiteDays) ?? 0,
        },
        notes: notes || "",
      },
      deltas: [],
    };
  };

  // Submit bid (endpoint may differ)
  // Tries:
  // 1) POST /requests/:id/offers
  // 2) POST /offers
  // 3) POST /bids
  const submitBid = async () => {
    const error = validateOffer();
    if (error) {
      toast.error(error);
      return;
    }

    const payload = buildOfferPayload();

    try {
      // Attempt common endpoints (keeps your logic resilient)
      try {
        await API.post(`/requests/${bidTargetRequest.id}/offers`, payload, {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e1) {
        try {
          await API.post(`/offers`, payload, {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e2) {
          await API.post(`/bids`, payload, {
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      toast.success("Bid submitted.");
      setBidOpen(false);
      setBidTargetRequest(null);

      // refresh
      setLoading(true);
      await loadRequests();
      setLoading(false);
    } catch (err) {
      console.error("Failed to submit bid", err?.response || err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to submit bid. Please verify the backend bid endpoint."
      );
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

      <div className="flex-1 bg-gradient-to-b from-emerald-100 via-green-100 to-emerald-300">
        <div className="w-full overflow-x-hidden">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 pb-10">
            {/* Sticky TopNav */}
            <div className="sticky top-0 z-50">
              <TopNav />
            </div>

            <header className="mt-2 sm:mt-4 mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Service Provider Panel
                </h1>
                <p className="text-sm text-slate-600 mt-1">
                  View open requests and submit your structured bid.
                </p>
              </div>

              <div className="text-xs text-slate-500">
                Signed in as{" "}
                <span className="font-medium text-slate-700">
                  {currentUsername || "Service Provider"}
                </span>
              </div>
            </header>

            {/* Overview cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Open Requests
                </p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">
                  {openCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Approved / Bidding
                </p>
              </div>

              <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  My Bids
                </p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">
                  {myBidsCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Requests I already bid on
                </p>
              </div>

              <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  My Offers Loaded
                </p>
                <p className="text-3xl font-bold text-emerald-700 mt-1">
                  {Object.values(myOffersByRequestId).filter(Boolean).length}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  From backend per request
                </p>
              </div>

              <div className="bg-white/90 shadow-sm rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Refresh
                </p>
                <button
                  type="button"
                  onClick={loadRequests}
                  className="mt-2 inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold
                             bg-emerald-600 text-white hover:bg-emerald-700 transition w-full"
                >
                  Reload Requests
                </button>
              </div>
            </section>

            {/* Sticky Tabs + Search row */}
            <div className="sticky top-[88px] z-40 mb-4">
              <div className="bg-white/70 backdrop-blur rounded-2xl p-3 border border-slate-100 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <TabButton id={TAB.OPEN} label="Open Requests" count={openCount} />
                    <TabButton id={TAB.MY_BIDS} label="My Bids" count={myBidsCount} />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-[420px]">
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search SR, title, status..."
                        className="w-full rounded-xl border border-slate-200 bg-white/90 pl-10 pr-10 py-2 text-sm
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
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
                      Search + sticky tabs.
                    </p>
                  </div>
                </div>

                {searchQuery.trim() && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                      {activeTab === TAB.OPEN
                        ? filteredOpenRequests.length
                        : filteredMyBidRequests.length}
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

            {/* CONTENT */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-slate-600 text-sm">Loading…</p>
              </div>
            ) : (
              <>
                {/* OPEN */}
                {activeTab === TAB.OPEN && (
                  <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0">
                        <h2 className="text-base md:text-lg font-semibold text-slate-900">
                          Open Requests
                        </h2>
                        <p className="text-xs text-slate-500">
                          Requests available for bidding.
                        </p>
                      </div>
                    </div>

                    {filteredOpenRequests.length === 0 ? (
                      <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                        {searchQuery.trim()
                          ? "No requests match your search."
                          : "No open requests right now."}
                      </p>
                    ) : (
                      <div className="w-full overflow-x-auto lg:overflow-x-hidden rounded-xl border border-slate-100 bg-white">
                        <table className="w-full text-sm table-fixed">
                          <thead className="bg-slate-50/80">
                            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                              <th className="py-2.5 px-3 w-[44%]">Request</th>
                              <th className="py-2.5 px-3 w-[14%]">Status</th>
                              <th className="py-2.5 px-3 w-[14%]">PM</th>
                              <th className="py-2.5 px-3 w-[10%]">Bidding</th>
                              <th className="py-2.5 px-3 w-[18%] text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredOpenRequests.map((r) => {
                              const biddingActive = r.biddingActive === true;
                              const myOffer = myOffersByRequestId[r.id] || null;

                              return (
                                <tr
                                  key={r.id}
                                  className="hover:bg-slate-50/60 transition-colors"
                                >
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

                                  <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                    <StatusPill status={r.status} />
                                  </td>

                                  <td className="py-2.5 px-3 align-middle text-xs text-slate-700 min-w-0 overflow-hidden">
                                    <span className="block truncate">
                                      {r.requestedByUsername || "-"}
                                    </span>
                                  </td>

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

                                    {myOffer && (
                                      <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
                                        You bid
                                      </div>
                                    )}
                                  </td>

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
                                        onClick={() => openBid(r)}
                                        disabled={!biddingActive}
                                        className={
                                          "px-2.5 py-1 text-xs rounded-md text-white whitespace-nowrap " +
                                          (biddingActive
                                            ? "bg-emerald-600 hover:bg-emerald-700"
                                            : "bg-gray-300 cursor-not-allowed")
                                        }
                                        type="button"
                                      >
                                        Bid
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

                {/* MY BIDS */}
                {activeTab === TAB.MY_BIDS && (
                  <section className="bg-white/95 rounded-2xl shadow-sm border border-slate-100 p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="min-w-0">
                        <h2 className="text-base md:text-lg font-semibold text-slate-900">
                          My Bids
                        </h2>
                        <p className="text-xs text-slate-500">
                          Requests where you already submitted an offer.
                        </p>
                      </div>
                    </div>

                    {filteredMyBidRequests.length === 0 ? (
                      <p className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
                        {searchQuery.trim()
                          ? "No bids match your search."
                          : "You haven’t bid on any requests yet."}
                      </p>
                    ) : (
                      <div className="w-full overflow-x-auto lg:overflow-x-hidden rounded-xl border border-slate-100 bg-white">
                        <table className="w-full text-sm table-fixed">
                          <thead className="bg-slate-50/80">
                            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                              <th className="py-2.5 px-3 w-[52%]">Request</th>
                              <th className="py-2.5 px-3 w-[18%]">Status</th>
                              <th className="py-2.5 px-3 w-[30%] text-right">
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredMyBidRequests.map((r) => (
                              <tr
                                key={r.id}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
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

                                <td className="py-2.5 px-3 align-middle min-w-0 overflow-hidden">
                                  <StatusPill status={r.status} />
                                </td>

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
                                      onClick={() => openBid(r)}
                                      className="px-2.5 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 whitespace-nowrap"
                                      type="button"
                                    >
                                      Update Bid
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

            {/* BID MODAL (structured like your JSON) */}
            {bidOpen && bidTargetRequest && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-slate-100 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 md:p-5 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Submit Bid
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 break-words">
                          Request:{" "}
                          <span className="font-semibold">
                            {srLabel(bidTargetRequest)} — {bidTargetRequest.title}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBidOpen(false)}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 md:p-5 max-h-[72vh] overflow-y-auto">
                    {/* Supplier + Currency */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Supplier ID
                        </label>
                        <input
                          value={supplierId}
                          onChange={(e) => setSupplierId(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                          placeholder="e.g. SUP-001"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Supplier Name
                        </label>
                        <input
                          value={supplierName}
                          onChange={(e) => setSupplierName(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm
                                     focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                          placeholder="e.g. Digital Solutions AG"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Currency
                        </label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
                                     focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                        >
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                    </div>

                    {/* Candidates */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          Staffing (Candidates)
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Add one or more candidates for this request.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={addCandidate}
                        className="rounded-xl px-3 py-2 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        + Add Candidate
                      </button>
                    </div>

                    <div className="space-y-3 mb-6">
                      {candidates.map((c, idx) => (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold text-slate-700">
                              Candidate #{idx + 1}
                            </p>

                            {candidates.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCandidate(idx)}
                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Specialist ID
                              </label>
                              <input
                                value={c.specialistId}
                                onChange={(e) =>
                                  updateCandidate(idx, "specialistId", e.target.value)
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                                placeholder="e.g. SP-101"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Material Number
                              </label>
                              <input
                                value={c.materialNumber}
                                onChange={(e) =>
                                  updateCandidate(idx, "materialNumber", e.target.value)
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                                placeholder="e.g. MAT-JAVA-001"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Role *
                              </label>
                              <input
                                value={c.role}
                                onChange={(e) => updateCandidate(idx, "role", e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                                placeholder="e.g. Java Developer"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Experience Level *
                              </label>
                              <input
                                value={c.experienceLevel}
                                onChange={(e) =>
                                  updateCandidate(idx, "experienceLevel", e.target.value)
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                                placeholder="e.g. Senior"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Technology Level *
                              </label>
                              <input
                                value={c.technologyLevel}
                                onChange={(e) =>
                                  updateCandidate(idx, "technologyLevel", e.target.value)
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                                placeholder="e.g. Advanced"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Daily Rate * ({currency})
                              </label>
                              <input
                                value={c.dailyRate}
                                onChange={(e) =>
                                  updateCandidate(idx, "dailyRate", e.target.value)
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                                placeholder="e.g. 680"
                                inputMode="decimal"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Travel Cost / Onsite Day * ({currency})
                              </label>
                              <input
                                value={c.travelCostPerOnsiteDay}
                                onChange={(e) =>
                                  updateCandidate(
                                    idx,
                                    "travelCostPerOnsiteDay",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                                placeholder="e.g. 40"
                                inputMode="decimal"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Contractual Relationship *
                              </label>
                              <select
                                value={c.contractualRelationship}
                                onChange={(e) =>
                                  updateCandidate(
                                    idx,
                                    "contractualRelationship",
                                    e.target.value
                                  )
                                }
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                              >
                                <option value="Employee">Employee</option>
                                <option value="Freelancer">Freelancer</option>
                                <option value="Subcontractor">Subcontractor</option>
                              </select>
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-slate-600 mb-1">
                                Subcontractor Company (only if Subcontractor)
                              </label>
                              <input
                                value={c.subcontractorCompany}
                                onChange={(e) =>
                                  updateCandidate(
                                    idx,
                                    "subcontractorCompany",
                                    e.target.value
                                  )
                                }
                                disabled={c.contractualRelationship !== "Subcontractor"}
                                className={
                                  "w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white " +
                                  (c.contractualRelationship !== "Subcontractor"
                                    ? "opacity-60 cursor-not-allowed"
                                    : "")
                                }
                                placeholder="e.g. DevHub Sp. z o.o."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Delivery
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Proposed schedule & onsite days.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Proposed Start Date *
                          </label>
                          <input
                            type="date"
                            value={proposedStartDate}
                            onChange={(e) => setProposedStartDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Proposed End Date *
                          </label>
                          <input
                            type="date"
                            value={proposedEndDate}
                            onChange={(e) => setProposedEndDate(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Proposed Onsite Days *
                          </label>
                          <input
                            value={proposedOnsiteDays}
                            onChange={(e) => setProposedOnsiteDays(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                            placeholder="e.g. 1"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-400"
                        placeholder='e.g. "Available immediately. Strong Spring Boot + REST APIs."'
                      />
                    </div>

                    {/* JSON preview (helpful + fun, still UI-only) */}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                        Preview payload (JSON)
                      </summary>
                      <pre className="mt-2 text-[11px] bg-slate-900 text-slate-100 rounded-xl p-3 overflow-x-auto">
                        {JSON.stringify(buildOfferPayload(), null, 2)}
                      </pre>
                    </details>
                  </div>

                  {/* Footer */}
                  <div className="p-4 md:p-5 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setBidOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={submitBid}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                      type="button"
                    >
                      Submit Bid
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* end modal */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDashboard;
