// src/pages/RequestDetails.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

export default function RequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const offersRef = useRef(null);

    const [request, setRequest] = useState(null);
    const [offers, setOffers] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ MAIN tabs: "details" | "offers"
    const [mainTab, setMainTab] = useState("details");

    // ✅ Tabs inside offers: "offers" | "evaluation"
    const [activeTab, setActiveTab] = useState("offers");

    // ✅ Prevent double compute clicks
    const [computing, setComputing] = useState(false);

    // ✅ Procurement modals
    const [contactOpen, setContactOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState("");
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const rawRole = localStorage.getItem("role") || "";
    const role = rawRole.replace("ROLE_", "").trim();
    const currentUsername = (localStorage.getItem("username") || "").trim();

    const errorMessage = (err, fallback = "Request failed.") => {
        const d = err?.response?.data;
        if (!d) return fallback;
        if (typeof d === "string") return d;
        if (d.message) return String(d.message);
        try {
            return JSON.stringify(d);
        } catch {
            return fallback;
        }
    };

    const srLabel = (req) => {
        if (!req) return "-";
        if (req.requestNumber && String(req.requestNumber).trim()) return req.requestNumber;
        if (req.id == null) return "-";
        return `SR-${String(req.id).padStart(6, "0")}`;
    };

    const load = async () => {
        try {
            setLoading(true);

            const [reqRes, offersRes] = await Promise.all([
                API.get(`/requests/${id}`),
                API.get(`/requests/${id}/offers`),
            ]);

            const req = reqRes.data || null;
            setRequest(req);
            setOffers(offersRes.data || []);

            // Evaluation is optional
            try {
                const evalRes = await API.get(`/requests/${id}/offers/evaluation`);
                const evals = evalRes.data || [];
                setEvaluations(evals);
            } catch {
                setEvaluations([]);
            }
        } catch (err) {
            console.error("Failed to load request details", err);
            toast.error(errorMessage(err, "Failed to load request details."));
            setRequest(null);
            setOffers([]);
            setEvaluations([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [id]);

    // ✅ handle URL tabs: ?tab=details | offers | evaluation
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = (params.get("tab") || "details").toLowerCase();

        if (tab === "offers") {
            setMainTab("offers");
            setActiveTab("offers");
            setTimeout(() => {
                offersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 150);
            return;
        }

        if (tab === "evaluation") {
            setMainTab("offers");
            setActiveTab("evaluation");
            setTimeout(() => {
                offersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 150);
            return;
        }

        setMainTab("details");
    }, [location.search]);

    // ------------------- PM actions -------------------
    const selectPreferred = async (offerId) => {
        try {
            await API.put(`/requests/${id}/offers/${offerId}/select`);
            toast.success("Preferred offer set (PM recommendation).");
            load();
        } catch (err) {
            console.error("Failed to select preferred offer", err);
            toast.error(errorMessage(err, "Failed to set preferred offer."));
        }
    };

    // ------------------- RP actions -------------------
    const finalApprove = async (offerId) => {
        try {
            const res = await API.post(`/requests/offers/${offerId}/order`);
            toast.success("Service order created.");

            if (res?.data?.id) {
                navigate(`/orders/${res.data.id}`);
                return;
            }
            load();
        } catch (err) {
            console.error("Create order failed", err?.response || err);
            toast.error(errorMessage(err, "Failed to create order."));
        }
    };

    const pullProviderOffers = async () => {
        if (!request?.id) return;
        try {
            await API.post(`/requests/${request.id}/pull-provider-offers`);
            toast.success("Provider offers pulled.");
            load();
        } catch (err) {
            console.error(err);
            toast.error(errorMessage(err, "Failed to pull provider offers."));
        }
    };

    const computeScores = async () => {
        if (!request?.id) return;

        // safe: no offers => do not compute
        if (offers.length === 0) {
            toast.info("No offers to evaluate yet.");
            setMainTab("offers");
            setActiveTab("offers");
            navigate(`/requests/${id}?tab=offers`);
            return;
        }

        // already computed
        if (evaluations.length > 0) {
            toast.info("Evaluation already computed.");
            setMainTab("offers");
            setActiveTab("evaluation");
            navigate(`/requests/${id}?tab=evaluation`);
            return;
        }

        if (computing) return;

        try {
            setComputing(true);
            await API.post(`/requests/${request.id}/offers/evaluation/compute`);
            toast.success("Scores computed.");
            await load();
            setMainTab("offers");
            setActiveTab("evaluation");
            navigate(`/requests/${id}?tab=evaluation`);
        } catch (err) {
            console.error(err);
            toast.error(errorMessage(err, "Failed to compute scores."));
        } finally {
            setComputing(false);
        }
    };

    // ------------------- Procurement actions -------------------
    const canProcurementAct =
        role === "PROCUREMENT_OFFICER" && request?.status === "IN_REVIEW";

    const openContactPm = () => {
        if (!request?.requestedByUsername) {
            toast.error("This request has no Project Manager username.");
            return;
        }
        setContactMessage("");
        setContactOpen(true);
    };

    const submitContactPm = async () => {
        if (!request?.requestedByUsername) {
            toast.error("This request has no Project Manager username.");
            return;
        }
        if (!contactMessage.trim()) {
            toast.error("Please write a message.");
            return;
        }

        try {
            const senderUsername = (localStorage.getItem("username") || "").trim();
            const senderRole = role;
            const recipientUsername = request.requestedByUsername;
            const recipientRole = "PROJECT_MANAGER";

            const users = [senderUsername, recipientUsername].sort();
            const threadKey = `REQ-${request.id}:${users[0]}-${users[1]}`;

            await API.post(
                "/notifications/direct-message",
                {
                    threadKey,
                    requestId: String(request.id),
                    senderUsername,
                    senderRole,
                    recipientUsername,
                    recipientRole,
                    message: `About ${srLabel(request)} "${request.title}": ${contactMessage}`,
                },
                { headers: { "Content-Type": "application/json" } }
            );

            toast.success("Message sent to Project Manager (DM).");
            setContactOpen(false);
            setContactMessage("");
        } catch (err) {
            console.error("Failed to contact PM (DM)", err?.response || err);
            toast.error(errorMessage(err, "Failed to send DM to PM."));
        }
    };

    const approveRequest = async () => {
        try {
            await API.put(`/requests/${request.id}/approve`);
            toast.success("Request approved for bidding.");
            load();
        } catch (err) {
            console.error("Failed to approve request", err);
            toast.error(errorMessage(err, "Failed to approve request."));
        }
    };

    const openReject = () => {
        setRejectReason("");
        setRejectOpen(true);
    };

    const submitReject = async () => {
        if (!rejectReason.trim()) {
            toast.error("Please provide a rejection reason.");
            return;
        }

        try {
            await API.put(`/requests/${request.id}/reject`, rejectReason, {
                headers: { "Content-Type": "text/plain" },
            });
            toast.success("Request rejected.");
            setRejectOpen(false);
            setRejectReason("");
            load();
        } catch (err) {
            console.error("Failed to reject request", err);
            toast.error(errorMessage(err, "Failed to reject request."));
        }
    };

    const reactivateBidding = async () => {
        try {
            await API.put(`/requests/${id}/reactivate`);
            toast.success("Bidding reactivated.");
            load();
        } catch (err) {
            console.error("Failed to reactivate bidding", err?.response || err);
            toast.error(errorMessage(err, "Failed to reactivate bidding."));
        }
    };

    // ------------------- UI helpers -------------------
    const statusBadgeClass = (status) => {
        switch (status) {
            case "DRAFT":
                return "bg-gray-200 text-gray-700";
            case "IN_REVIEW":
                return "bg-yellow-100 text-yellow-800";
            case "APPROVED_FOR_BIDDING":
                return "bg-blue-100 text-blue-800";
            case "BIDDING":
                return "bg-purple-100 text-purple-800";
            case "EVALUATION":
                return "bg-indigo-100 text-indigo-800";
            case "ORDERED":
                return "bg-emerald-100 text-emerald-800";
            case "REJECTED":
                return "bg-red-100 text-red-800";
            case "EXPIRED":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const fmtDate = (v) => (v ? String(v) : "-");
    const fmtMoney = (v) => {
        const n = Number(v);
        if (!Number.isFinite(n)) return "-";
        return `${n.toFixed(2)} €`;
    };

    const roles = request?.roles || [];

    const totalManDays = useMemo(
        () => roles.reduce((sum, r) => sum + (Number(r.manDays) || 0), 0),
        [roles]
    );

    const totalOnsiteDays = useMemo(
        () => roles.reduce((sum, r) => sum + (Number(r.onsiteDays) || 0), 0),
        [roles]
    );

    const canReactivate =
        role === "PROJECT_MANAGER" &&
        request?.status === "EXPIRED" &&
        request?.requestedByUsername === currentUsername;

    const isPreferred = (offerId) =>
        request?.preferredOfferId != null &&
        String(request.preferredOfferId) === String(offerId);

    const rpCanFinalApprove =
        role === "RESOURCE_PLANNER" &&
        request?.status !== "ORDERED" &&
        request?.preferredOfferId != null;

    // ✅ FIX: RP bar should stay visible in EVALUATION too
    const showRpBar =
        role === "RESOURCE_PLANNER" &&
        (request?.status === "APPROVED_FOR_BIDDING" ||
            request?.status === "BIDDING" ||
            request?.status === "EVALUATION");

    // ------------------- states -------------------
    if (loading) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 via-blue-300 to-blue-500 p-6 pt-16 md:pt-6">
                    <TopNav />
                    <p className="text-white/90 drop-shadow-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 via-blue-300 to-blue-500 p-6 pt-16 md:pt-6">
                    <TopNav />
                    <p className="text-white drop-shadow-sm">
                        Request not found or access denied.
                    </p>
                </div>
            </div>
        );
    }

    // ------------------- render -------------------
    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 via-blue-300 to-blue-500 p-6 pt-16 md:pt-6">
                <TopNav />

                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-3xl font-bold text-white drop-shadow-sm break-words">
                                {request.title}
                            </h1>
                            <p className="text-white/90 text-xs mt-1 drop-shadow-sm">
                                Request No: {srLabel(request)} • Internal ID: {request.id} •
                                Requested by: {request.requestedByUsername || "-"}
                            </p>
                            <p className="text-white/80 text-xs mt-1 drop-shadow-sm">
                                Total man-days: <b>{totalManDays}</b> • Total onsite days:{" "}
                                <b>{totalOnsiteDays}</b>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span
                                className={
                                    "text-sm px-3 py-1 rounded-full font-semibold shadow-sm ring-1 ring-black/5 " +
                                    statusBadgeClass(request.status)
                                }
                            >
                                {request.status}
                            </span>

                            {canReactivate && (
                                <button
                                    onClick={reactivateBidding}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow hover:bg-emerald-700 transition ring-1 ring-white/20"
                                    type="button"
                                >
                                    Reactivate for Bidding
                                </button>
                            )}

                            {role === "PROCUREMENT_OFFICER" && (
                                <>
                                    <button
                                        onClick={() => navigate("/")}
                                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/20 text-white hover:bg-white/30 ring-1 ring-white/30"
                                        type="button"
                                    >
                                        Back
                                    </button>

                                    <button
                                        onClick={openContactPm}
                                        disabled={!request.requestedByUsername}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold ring-1 ring-black/5 ${request.requestedByUsername
                                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                            }`}
                                        type="button"
                                    >
                                        Contact PM
                                    </button>

                                    <button
                                        onClick={approveRequest}
                                        disabled={!canProcurementAct}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold ring-1 ring-black/5 ${canProcurementAct
                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                            }`}
                                        type="button"
                                    >
                                        Approve
                                    </button>

                                    <button
                                        onClick={openReject}
                                        disabled={!canProcurementAct}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold ring-1 ring-black/5 ${canProcurementAct
                                                ? "bg-red-600 text-white hover:bg-red-700"
                                                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                            }`}
                                        type="button"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {role === "PROCUREMENT_OFFICER" && !canProcurementAct && (
                        <p className="text-white/90 text-xs mt-2 drop-shadow-sm">
                            Procurement actions are enabled only when the request is{" "}
                            <b>IN_REVIEW</b>.
                        </p>
                    )}
                </div>

                {/* ✅ MAIN NAV TABS */}
                <div className="mb-4">
                    <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-2 shadow-sm inline-flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setMainTab("details");
                                navigate(`/requests/${id}?tab=details`);
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold ring-1 ${mainTab === "details"
                                    ? "bg-white text-slate-900 ring-white/40"
                                    : "bg-white/20 text-white ring-white/25 hover:bg-white/30"
                                }`}
                        >
                            Request Details
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMainTab("offers");
                                setActiveTab("offers");
                                navigate(`/requests/${id}?tab=offers`);
                                setTimeout(() => {
                                    offersRef.current?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                                }, 150);
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold ring-1 ${mainTab === "offers"
                                    ? "bg-white text-slate-900 ring-white/40"
                                    : "bg-white/20 text-white ring-white/25 hover:bg-white/30"
                                }`}
                        >
                            Offers
                        </button>
                    </div>
                </div>

                {/* ✅ REQUEST DETAILS SECTION (NOW REAL UI, NOT EMPTY) */}
                {mainTab === "details" && (
                    <div className="bg-white/95 rounded-2xl shadow-lg ring-1 ring-black/5 p-6">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                            <h2 className="text-lg font-semibold text-slate-900">
                                Request Information
                            </h2>

                            <div className="flex flex-wrap gap-2">
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                    Type: {request.type || "-"}
                                </span>
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                    Contract: {request.contractSupplier || "-"}
                                </span>
                                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                                    Project: {request.projectId || "-"}
                                </span>
                            </div>
                        </div>

                        {/* Overview + Criteria */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Overview */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900 mb-3">
                                    Overview
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                                    <p>
                                        <span className="text-slate-500 font-semibold">Project:</span>{" "}
                                        {request.projectName
                                            ? `${request.projectId || "-"} – ${request.projectName}`
                                            : request.projectId || "-"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500 font-semibold">Contract:</span>{" "}
                                        {request.contractId
                                            ? `${request.contractSupplier || "-"} (${request.contractId})`
                                            : "-"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500 font-semibold">Start:</span>{" "}
                                        {fmtDate(request.startDate)}
                                    </p>
                                    <p>
                                        <span className="text-slate-500 font-semibold">End:</span>{" "}
                                        {fmtDate(request.endDate)}
                                    </p>

                                    <p>
                                        <span className="text-slate-500 font-semibold">Location:</span>{" "}
                                        {request.performanceLocation || "-"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500 font-semibold">Bidding cycle:</span>{" "}
                                        {request.biddingCycleDays ?? "-"} days
                                    </p>

                                    <p>
                                        <span className="text-slate-500 font-semibold">Max offers:</span>{" "}
                                        {request.maxOffers ?? "-"}
                                    </p>

                                    <p>
                                        <span className="text-slate-500 font-semibold">Max accepted:</span>{" "}
                                        {request.maxAcceptedOffers ?? "-"}
                                    </p>
                                </div>
                            </div>

                            {/* Criteria */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900 mb-3">
                                    Criteria
                                </p>

                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="text-slate-500 font-semibold text-xs mb-1">
                                            Required languages
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(request.requiredLanguages || []).length === 0 ? (
                                                <span className="text-slate-600 text-sm">-</span>
                                            ) : (
                                                request.requiredLanguages.map((l) => (
                                                    <span
                                                        key={l}
                                                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700"
                                                    >
                                                        {l}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-slate-500 font-semibold text-xs mb-1">
                                            Must-have
                                        </p>
                                        {(request.mustHaveCriteria || []).length === 0 ? (
                                            <p className="text-slate-600">-</p>
                                        ) : (
                                            <ul className="list-disc ml-5 text-slate-800">
                                                {request.mustHaveCriteria.map((c, i) => (
                                                    <li key={i}>{c}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-slate-500 font-semibold text-xs mb-1">
                                            Nice-to-have
                                        </p>
                                        {(request.niceToHaveCriteria || []).length === 0 ? (
                                            <p className="text-slate-600">-</p>
                                        ) : (
                                            <ul className="list-disc ml-5 text-slate-800">
                                                {request.niceToHaveCriteria.map((c, i) => (
                                                    <li key={i}>{c}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roles */}
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <p className="text-sm font-semibold text-slate-900">
                                    Requested Roles
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                                        Total man-days: {totalManDays}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                                        Total onsite: {totalOnsiteDays}
                                    </span>
                                </div>
                            </div>

                            {roles.length === 0 ? (
                                <p className="text-slate-600 mt-2">No roles defined.</p>
                            ) : (
                                <div className="mt-3 overflow-x-auto">
                                    <table className="min-w-[900px] w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="text-left px-3 py-2 font-semibold">Domain</th>
                                                <th className="text-left px-3 py-2 font-semibold">Role</th>
                                                <th className="text-left px-3 py-2 font-semibold">Technology</th>
                                                <th className="text-left px-3 py-2 font-semibold">Experience</th>
                                                <th className="text-right px-3 py-2 font-semibold">Man-days</th>
                                                <th className="text-right px-3 py-2 font-semibold">Onsite</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {roles.map((r, idx) => (
                                                <tr key={idx} className={idx % 2 ? "bg-white" : "bg-slate-50/40"}>
                                                    <td className="px-3 py-2">{r.domain || "-"}</td>
                                                    <td className="px-3 py-2">{r.roleName || "-"}</td>
                                                    <td className="px-3 py-2">{r.technology || "-"}</td>
                                                    <td className="px-3 py-2">{r.experienceLevel || "-"}</td>
                                                    <td className="px-3 py-2 text-right">{r.manDays ?? "-"}</td>
                                                    <td className="px-3 py-2 text-right">{r.onsiteDays ?? "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Descriptions */}
                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900 mb-2">
                                    Task Description
                                </p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {request.taskDescription || "-"}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900 mb-2">
                                    Further Information
                                </p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                    {request.furtherInformation || "-"}
                                </p>
                            </div>
                        </div>

                        {/* Optional commercial info if backend provides */}
                        {(request.contractValue != null || request.budget != null) && (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-sm font-semibold text-slate-900 mb-2">
                                    Commercial
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-800">
                                    {request.contractValue != null && (
                                        <p>
                                            <span className="text-slate-500 font-semibold">
                                                Contract value:
                                            </span>{" "}
                                            {fmtMoney(request.contractValue)}
                                        </p>
                                    )}
                                    {request.budget != null && (
                                        <p>
                                            <span className="text-slate-500 font-semibold">Budget:</span>{" "}
                                            {fmtMoney(request.budget)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ✅ OFFERS / EVALUATION SECTION */}
                {mainTab === "offers" && (
                    <>
                        <div ref={offersRef} className="mb-3">
                            <div className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-4 shadow-sm">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h2 className="text-lg font-semibold text-white drop-shadow-sm">
                                            Offers
                                        </h2>

                                        {/* Tabs */}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveTab("offers");
                                                    navigate(`/requests/${id}?tab=offers`);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ring-1 ${activeTab === "offers"
                                                        ? "bg-white text-slate-900 ring-white/40"
                                                        : "bg-white/20 text-white ring-white/25 hover:bg-white/30"
                                                    }`}
                                            >
                                                Offer Details
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (evaluations.length === 0) {
                                                        toast.info("No evaluation computed yet.");
                                                        return;
                                                    }
                                                    setActiveTab("evaluation");
                                                    navigate(`/requests/${id}?tab=evaluation`);
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ring-1 ${activeTab === "evaluation"
                                                        ? "bg-white text-slate-900 ring-white/40"
                                                        : "bg-white/20 text-white ring-white/25 hover:bg-white/30"
                                                    }`}
                                                title={evaluations.length === 0 ? "Compute evaluation first" : ""}
                                            >
                                                Evaluation
                                            </button>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/25 text-white ring-1 ring-white/25">
                                            {offers.length} offers
                                        </span>

                                        {request?.preferredOfferId != null && (
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/25 text-white ring-1 ring-indigo-200/40">
                                                Preferred selected
                                            </span>
                                        )}

                                        <span
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ${evaluations.length > 0
                                                    ? "bg-emerald-500/25 text-white ring-emerald-200/40"
                                                    : "bg-amber-500/25 text-white ring-amber-200/40"
                                                }`}
                                        >
                                            {evaluations.length > 0 ? "Evaluation ready" : "No evaluation yet"}
                                        </span>
                                    </div>

                                    {/* RP action bar */}
                                    {showRpBar && (
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={pullProviderOffers}
                                                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow hover:bg-blue-700 transition ring-1 ring-white/20"
                                                type="button"
                                            >
                                                Pull Provider Offers
                                            </button>

                                            <button
                                                onClick={computeScores}
                                                disabled={computing || evaluations.length > 0}
                                                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow transition ring-1 ring-white/20 ${computing || evaluations.length > 0
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-emerald-600 hover:bg-emerald-700"
                                                    }`}
                                                type="button"
                                                title={evaluations.length > 0 ? "Already computed" : ""}
                                            >
                                                {evaluations.length > 0
                                                    ? "Computed"
                                                    : computing
                                                        ? "Computing..."
                                                        : "Compute Scores"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/95 rounded-2xl shadow-lg ring-1 ring-black/5 p-6">
                            {/* TAB: OFFERS CARDS */}
                            {activeTab === "offers" && (
                                <>
                                    {offers.length === 0 ? (
                                        <p className="text-slate-600">No offers yet.</p>
                                    ) : (
                                        <div className="mt-2 max-h-[70vh] overflow-y-auto pr-2 pb-10 scroll-pb-10 rounded-xl">
                                            <div className="space-y-4">
                                                {offers.map((o) => (
                                                    <div
                                                        key={o.id}
                                                        className={`p-4 border rounded-xl flex flex-col gap-3 transition ring-1 ring-black/5 ${isPreferred(o.id)
                                                                ? "border-indigo-300 bg-indigo-50/40"
                                                                : "border-slate-200 hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="text-lg font-semibold text-slate-900 break-words">
                                                                        {o.specialistName || "Unnamed Specialist"}
                                                                    </p>

                                                                    {isPreferred(o.id) && (
                                                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700">
                                                                            Preferred (PM)
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="text-xs text-slate-600 mt-0.5">
                                                                    Supplier:{" "}
                                                                    <span className="font-semibold">{o.supplierName || "-"}</span>
                                                                    {o.contractualRelationship ? ` (${o.contractualRelationship})` : ""}
                                                                </p>

                                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                                                                    <p>
                                                                        <span className="text-slate-500 font-semibold">Daily rate:</span>{" "}
                                                                        {o.dailyRate ?? "-"} €
                                                                    </p>
                                                                    <p>
                                                                        <span className="text-slate-500 font-semibold">
                                                                            Travelling cost:
                                                                        </span>{" "}
                                                                        {o.travellingCost ?? 0} €
                                                                    </p>
                                                                    <p>
                                                                        <span className="text-slate-500 font-semibold">Total cost:</span>{" "}
                                                                        <span className="font-semibold text-slate-900">
                                                                            {o.totalCost ?? "-"} €
                                                                        </span>
                                                                    </p>
                                                                    <p>
                                                                        <span className="text-slate-500 font-semibold">Material #:</span>{" "}
                                                                        {o.materialNumber || "-"}
                                                                    </p>
                                                                    <p>
                                                                        <span className="text-slate-500 font-semibold">Subcontractor:</span>{" "}
                                                                        {o.subcontractorCompany || "-"}
                                                                    </p>
                                                                    <p>
                                                                        <span className="text-slate-500 font-semibold">Rep:</span>{" "}
                                                                        {o.supplierRepresentative || "-"}
                                                                    </p>
                                                                </div>

                                                                {/* Colored indicators */}
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${o.matchMustHaveCriteria
                                                                                ? "bg-emerald-100 text-emerald-700"
                                                                                : "bg-red-100 text-red-700"
                                                                            }`}
                                                                    >
                                                                        Must-have: {o.matchMustHaveCriteria ? "Match" : "No"}
                                                                    </span>

                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${o.matchNiceToHaveCriteria
                                                                                ? "bg-blue-100 text-blue-700"
                                                                                : "bg-gray-100 text-gray-700"
                                                                            }`}
                                                                    >
                                                                        Nice-to-have: {o.matchNiceToHaveCriteria ? "Match" : "No"}
                                                                    </span>

                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${o.matchLanguageSkills
                                                                                ? "bg-purple-100 text-purple-700"
                                                                                : "bg-orange-100 text-orange-700"
                                                                            }`}
                                                                    >
                                                                        Language: {o.matchLanguageSkills ? "OK" : "No"}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* PM action */}
                                                            {role === "PROJECT_MANAGER" && (
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <button
                                                                        onClick={() => selectPreferred(o.id)}
                                                                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow ring-1 ring-white/20"
                                                                        type="button"
                                                                    >
                                                                        Set Preferred
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* RP action: create order on preferred only */}
                                                            {role === "RESOURCE_PLANNER" && (
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <button
                                                                        onClick={() => finalApprove(o.id)}
                                                                        disabled={!rpCanFinalApprove || !isPreferred(o.id)}
                                                                        className={`px-4 py-2 rounded-lg text-xs font-semibold shadow transition ring-1 ring-white/20 ${rpCanFinalApprove && isPreferred(o.id)
                                                                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                                                            }`}
                                                                        type="button"
                                                                        title={
                                                                            !request.preferredOfferId
                                                                                ? "PM must select preferred offer first"
                                                                                : !isPreferred(o.id)
                                                                                    ? "Only preferred offer can be ordered"
                                                                                    : ""
                                                                        }
                                                                    >
                                                                        Create Order (RP)
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* TAB: EVALUATION TABLE */}
                            {activeTab === "evaluation" && (
                                <>
                                    {evaluations.length === 0 ? (
                                        <p className="text-slate-600">No evaluation computed yet.</p>
                                    ) : (
                                        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto pr-2 pb-10 scroll-pb-10 rounded-xl">
                                            <table className="min-w-[1100px] w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                                                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700">
                                                    <tr>
                                                        <th className="text-left px-3 py-2 font-semibold">Rank</th>
                                                        <th className="text-left px-3 py-2 font-semibold">Supplier</th>
                                                        <th className="text-left px-3 py-2 font-semibold">Specialist</th>
                                                        <th className="text-left px-3 py-2 font-semibold">Contract</th>
                                                        <th className="text-right px-3 py-2 font-semibold">Daily €</th>
                                                        <th className="text-right px-3 py-2 font-semibold">Travel €</th>
                                                        <th className="text-right px-3 py-2 font-semibold">Total €</th>
                                                        <th className="text-center px-3 py-2 font-semibold">Must</th>
                                                        <th className="text-center px-3 py-2 font-semibold">Lang</th>
                                                        <th className="text-center px-3 py-2 font-semibold">Nice</th>
                                                        <th className="text-right px-3 py-2 font-semibold">Tech</th>
                                                        <th className="text-right px-3 py-2 font-semibold">Comm</th>
                                                        <th className="text-right px-3 py-2 font-semibold">Final</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {evaluations.map((e, idx) => (
                                                        <tr
                                                            key={e.offerId}
                                                            className={`${e.recommended
                                                                    ? "bg-emerald-50"
                                                                    : idx % 2
                                                                        ? "bg-white"
                                                                        : "bg-slate-50/40"
                                                                } hover:bg-blue-50/60`}
                                                        >
                                                            <td className="px-3 py-2 font-semibold">
                                                                {e.eligible ? `#${e.rank}` : "—"}
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-semibold text-slate-900">{e.supplierName}</span>
                                                                    {e.recommended && (
                                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                                            Recommended
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">{e.specialistName}</td>
                                                            <td className="px-3 py-2">{e.contractualRelationship || "-"}</td>
                                                            <td className="px-3 py-2 text-right">{e.dailyRate}</td>
                                                            <td className="px-3 py-2 text-right">{e.travellingCost}</td>
                                                            <td className="px-3 py-2 text-right font-semibold">{e.totalCost}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                {e.matchMustHaveCriteria ? "✅" : "❌"}
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                {e.matchLanguageSkills ? "✅" : "❌"}
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                {e.matchNiceToHaveCriteria ? "✅" : "❌"}
                                                            </td>
                                                            <td className="px-3 py-2 text-right">{e.techScore}</td>
                                                            <td className="px-3 py-2 text-right">{e.commercialScore}</td>
                                                            <td className="px-3 py-2 text-right font-bold">{e.finalScore}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}

                {/* ✅ Procurement Modals (included fully so file is complete) */}

                {/* Contact PM modal */}
                {contactOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
                        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                            <h3 className="text-lg font-semibold mb-2 text-slate-900">
                                Contact Project Manager
                            </h3>

                            <p className="text-xs text-slate-600 mb-2">
                                About {srLabel(request)} “{request.title}”
                            </p>

                            <textarea
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                                rows={5}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                placeholder="Write your message..."
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setContactOpen(false)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitContactPm}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                                    type="button"
                                >
                                    Send
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
                                Reject Request {srLabel(request)}
                            </h3>

                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={5}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                                placeholder="Provide a clear rejection reason..."
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setRejectOpen(false)}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReject}
                                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-600 text-white hover:bg-red-700"
                                    type="button"
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="h-6" />
            </div>
        </div>
    );
}
