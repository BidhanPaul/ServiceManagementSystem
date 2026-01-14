import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

export default function RequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ Procurement modals
    const [contactOpen, setContactOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState("");

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const role = localStorage.getItem("role"); // "PROCUREMENT_OFFICER", "PROJECT_MANAGER", etc.
    const currentUsername = localStorage.getItem("username");

    // ✅ KEEP YOUR EXISTING LOAD FUNCTION
    const load = async () => {
        try {
            const [reqRes, offersRes] = await Promise.all([
                API.get(`/requests/${id}`),
                API.get(`/requests/${id}/offers`),
            ]);
            setRequest(reqRes.data);
            setOffers(offersRes.data || []);
        } catch (err) {
            console.error("Failed to load request details", err);
            toast.error("Failed to load request details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line
    }, [id]);

    // ------------------- PM actions (offers) -------------------
    const selectPreferred = async (offerId) => {
        try {
            await API.put(`/requests/${id}/offers/${offerId}/select`);
            toast.success("Preferred offer set.");
            load();
        } catch (err) {
            console.error("Failed to select preferred offer", err);
            toast.error("Failed to set preferred offer.");
        }
    };

    const createOrder = async (offerId) => {
        try {
            await API.post(`/requests/offers/${offerId}/order`);
            toast.success("Service order created.");
            load();
        } catch (err) {
            console.error("Failed to create service order", err);
            toast.error("Failed to create service order.");
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
      await API.post(
        `/notifications/user/${request.requestedByUsername}`,
        `Message from Procurement Officer about request "${request.title}": ${contactMessage}`,
        { headers: { "Content-Type": "text/plain" } }
      );
      toast.success("Message sent to Project Manager.");
      setContactOpen(false);
      setContactMessage("");
    } catch (err) {
      console.error("Failed to contact PM", err);
      toast.error("Failed to send message to PM.");
    }
  };

  const approveRequest = async () => {
    try {
      await API.put(`/requests/${request.id}/approve`);
      toast.success("Request approved for bidding.");
      load();
    } catch (err) {
      console.error("Failed to approve request", err);
      toast.error("Failed to approve request.");
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
            toast.error("Failed to reject request.");
        }
    };

    // ✅ FIX: Reactivate uses load() (NOT loadRequest)
    const reactivateBidding = async () => {
        try {
            await API.put(`/requests/${id}/reactivate`);
            toast.success("Bidding reactivated.");
            load(); // ✅ was loadRequest() causing eslint error
        } catch (err) {
            console.error("Failed to reactivate bidding", err?.response || err);
            toast.error("Failed to reactivate bidding.");
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

    const roles = request?.roles || [];

    const totalManDays = useMemo(
        () => roles.reduce((sum, r) => sum + (Number(r.manDays) || 0), 0),
        [roles]
    );

    const totalOnsiteDays = useMemo(
        () => roles.reduce((sum, r) => sum + (Number(r.onsiteDays) || 0), 0),
        [roles]
    );

    const primaryRole = roles[0] || {};

    // ✅ Reactivate button condition (ONLY ONE PLACE)
    const canReactivate =
        role === "PROJECT_MANAGER" &&
        request?.status === "EXPIRED" &&
        request?.requestedByUsername === currentUsername;

    // ------------------- States -------------------
    if (loading) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6 pt-16 md:pt-6">
                    <TopNav />
                    <p className="text-white/80">Loading...</p>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="flex">
                <Sidebar />
                <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6 pt-16 md:pt-6">
                    <TopNav />
                    <p className="text-white">Request not found.</p>
                </div>
            </div>
        );
    }

    // ------------------- Render -------------------
    return (
        <div className="flex">
            <Sidebar />

            <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6 pt-16 md:pt-6">
                <TopNav />

                {/* Header + status + Procurement action bar */}
                <div className="mb-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">{request.title}</h1>
                            <p className="text-white/80 text-xs mt-1">
                                Request ID: {request.id} • Requested by:{" "}
                                {request.requestedByUsername || "-"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap justify-end">
                            <span
                                className={
                                    "text-sm px-3 py-1 rounded-full font-semibold " +
                                    statusBadgeClass(request.status)
                                }
                            >
                                {request.status}
                            </span>

                            {/* ✅ ONE proper Reactivate button (PM + owner + EXPIRED) */}
                            {canReactivate && (
                                <button
                                    onClick={reactivateBidding}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold shadow hover:bg-emerald-700 transition"
                                    type="button"
                                >
                                    Reactivate for Bidding
                                </button>
                            )}

                            {/* ✅ Procurement action buttons on view page */}
                            {role === "PROCUREMENT_OFFICER" && (
                                <>
                                    <button
                                        onClick={() => navigate("/")}
                                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/20 text-white hover:bg-white/30"
                                        type="button"
                                    >
                                        Back
                                    </button>

                                    <button
                                        onClick={openContactPm}
                                        disabled={!request.requestedByUsername}
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold ${request.requestedByUsername
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
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold ${canProcurementAct
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
                                        className={`px-3 py-2 rounded-lg text-xs font-semibold ${canProcurementAct
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
                        <p className="text-white/80 text-xs mt-2">
                            Procurement actions are enabled only when the request is{" "}
                            <b>IN_REVIEW</b>.
                        </p>
                    )}
                </div>

                {/* REQUEST INFORMATION */}
                <div className="bg-white/90 rounded-2xl shadow-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Request Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p>
                            <span className="font-semibold">Type:</span> {request.type}
                        </p>
                        <p>
                            <span className="font-semibold">Project:</span>{" "}
                            {request.projectId
                                ? `${request.projectId} – ${request.projectName || ""}`
                                : "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Contract:</span>{" "}
                            {request.contractId
                                ? `${request.contractSupplier || ""} – ${request.contractId}`
                                : "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Dates:</span>{" "}
                            {request.startDate || "-"} → {request.endDate || "-"}
                        </p>

                        <p>
                            <span className="font-semibold">Location:</span>{" "}
                            {request.performanceLocation || "-"}
                        </p>
                        <p>
                            <span className="font-semibold"># Roles:</span> {roles.length}
                        </p>

                        <p>
                            <span className="font-semibold">Man days / Onsite:</span>{" "}
                            {totalManDays} / {totalOnsiteDays}
                        </p>
                        <p>
                            <span className="font-semibold">Bidding cycle (days):</span>{" "}
                            {request.biddingCycleDays ?? "-"}{" "}
                            {request.biddingCycleDays === 0 ? "(Demo: 3 seconds)" : ""}
                        </p>

                        <p>
                            <span className="font-semibold">Primary Domain:</span>{" "}
                            {primaryRole.domain || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Primary Role:</span>{" "}
                            {primaryRole.roleName || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Primary Technology:</span>{" "}
                            {primaryRole.technology || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Primary Experience:</span>{" "}
                            {primaryRole.experienceLevel || "-"}
                        </p>
                    </div>

                    <div className="mt-4 text-sm space-y-2">
                        <p>
                            <span className="font-semibold">Required Languages:</span>{" "}
                            {(request.requiredLanguages || []).join(", ") || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Must-have:</span>{" "}
                            {(request.mustHaveCriteria || []).join(", ") || "-"}
                        </p>
                        <p>
                            <span className="font-semibold">Nice-to-have:</span>{" "}
                            {(request.niceToHaveCriteria || []).join(", ") || "-"}
                        </p>
                        {request.taskDescription && (
                            <p>
                                <span className="font-semibold">Task:</span>{" "}
                                {request.taskDescription}
                            </p>
                        )}
                        {request.furtherInformation && (
                            <p>
                                <span className="font-semibold">Further info:</span>{" "}
                                {request.furtherInformation}
                            </p>
                        )}
                    </div>

                    {/* Roles table */}
                    {roles.length > 0 && (
                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-[800px] w-full text-sm border rounded-xl overflow-hidden">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="text-left px-3 py-2">Domain</th>
                                        <th className="text-left px-3 py-2">Role</th>
                                        <th className="text-left px-3 py-2">Technology</th>
                                        <th className="text-left px-3 py-2">Experience</th>
                                        <th className="text-left px-3 py-2">Man Days</th>
                                        <th className="text-left px-3 py-2">Onsite Days</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {roles.map((r, idx) => (
                                        <tr key={idx} className="bg-white">
                                            <td className="px-3 py-2">{r.domain || "-"}</td>
                                            <td className="px-3 py-2">{r.roleName || "-"}</td>
                                            <td className="px-3 py-2">{r.technology || "-"}</td>
                                            <td className="px-3 py-2">{r.experienceLevel || "-"}</td>
                                            <td className="px-3 py-2">{r.manDays ?? "-"}</td>
                                            <td className="px-3 py-2">{r.onsiteDays ?? "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* OFFERS SECTION (PM functions) */}
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold text-white">Offers</h2>
                </div>

                <div className="bg-white/90 rounded-2xl shadow-lg p-6">
                    {offers.length === 0 && <p className="text-gray-500">No offers yet.</p>}

                    <div className="space-y-4">
                        {offers.map((o) => (
                            <div
                                key={o.id}
                                className="p-4 border border-gray-200 rounded-xl flex flex-col md:flex-row justify-between gap-4 hover:bg-gray-50 transition"
                            >
                                <div>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {o.specialistName}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Daily rate: {o.dailyRate} € — Total: {o.totalCost} €
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Supplier: {o.supplierName} ({o.contractualRelationship})
                                    </p>
                                </div>

                                {/* Keep PM buttons if you want them for PM only */}
                                {role === "PROJECT_MANAGER" && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => selectPreferred(o.id)}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow"
                                            type="button"
                                        >
                                            Set Preferred
                                        </button>
                                        <button
                                            onClick={() => createOrder(o.id)}
                                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                                            type="button"
                                        >
                                            Create Order
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ✅ Contact PM modal */}
                {contactOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40">
                        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                            <h3 className="text-lg font-semibold mb-2 text-slate-900">
                                Contact Project Manager
                            </h3>
                            <p className="text-xs text-slate-600 mb-2">
                                Request: <span className="font-semibold">{request.title}</span>
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
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitContactPm}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                                    type="button"
                                >
                                    Send message
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ✅ Reject modal */}
                {rejectOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40">
                        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                            <h3 className="text-lg font-semibold mb-2 text-slate-900">
                                Reject Service Request
                            </h3>
                            <p className="text-xs text-slate-600 mb-2">
                                Request: <span className="font-semibold">{request.title}</span>
                            </p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-red-400"
                                placeholder="Provide a clear reason for the rejection (PM will see this)."
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setRejectOpen(false)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReject}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700"
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
    );
}
