// src/pages/OrderDetails.js
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiExternalLink,
  FiCheckCircle,
  FiXCircle,
  FiStar,
  FiInfo,
  FiShield,
  FiEdit3,
  FiClock,
} from "react-icons/fi";

/* =========================
   UI: Star rating (pro-style)
   ========================= */
const StarRating = ({
  value,
  onChange,
  readonly = false,
  sizeClass = "text-xl",
  label,
}) => {
  const [hover, setHover] = useState(null);
  const display = hover ?? value ?? 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= display;
          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onMouseEnter={() => !readonly && setHover(star)}
              onMouseLeave={() => !readonly && setHover(null)}
              onClick={() => !readonly && onChange?.(star)}
              className={[
                sizeClass,
                "leading-none transition",
                active ? "text-amber-400" : "text-slate-300",
                !readonly ? "hover:scale-110" : "",
              ].join(" ")}
              title={`${star} star${star > 1 ? "s" : ""}`}
              aria-label={`${label || "rating"} ${star}`}
            >
              ★
            </button>
          );
        })}
      </div>

      {typeof value === "number" && (
        <span className="text-xs text-slate-500">{value}/5</span>
      )}
    </div>
  );
};

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ Normalize role (handles ROLE_PROJECT_MANAGER too)
  const rawRole = localStorage.getItem("role") || "";
  const role = rawRole.replace("ROLE_", "");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // RP reject order modal (existing)
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // PM feedback (existing) + ✅ enhanced fields (categories + anonymous + edit)
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // ✅ categories (Quality / Communication / Value)
  const [qualityRating, setQualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);

  // ✅ anonymous toggle
  const [anonymousFeedback, setAnonymousFeedback] = useState(false);

  // ✅ feedback edit mode
  const [editingFeedback, setEditingFeedback] = useState(false);

  // ✅ supplier average rating (across orders)
  const [supplierAvg, setSupplierAvg] = useState(null); // { avg, count }
  const [supplierAvgLoading, setSupplierAvgLoading] = useState(false);

  // ✅ Change request modals
  const [subOpen, setSubOpen] = useState(false);
  const [extOpen, setExtOpen] = useState(false);
  const [changeRejectOpen, setChangeRejectOpen] = useState(false);

  // substitution form
  const [newSpecialistName, setNewSpecialistName] = useState("");
  const [subReason, setSubReason] = useState("");

  // extension form
  const [newEndDate, setNewEndDate] = useState("");
  const [extraManDays, setExtraManDays] = useState(0);
  const [newContractValue, setNewContractValue] = useState("");
  const [extReason, setExtReason] = useState("");

  // change reject reason
  const [changeRejectReason, setChangeRejectReason] = useState("");

  const currentUsername = localStorage.getItem("username") || "";
  const myRole = localStorage.getItem("role") || "PROCUREMENT_OFFICER";

  // -------- helpers --------
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

  const fmtDateTime = (v) => {
    if (!v) return "-";
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return String(v);
      return d.toLocaleString();
    } catch {
      return String(v);
    }
  };

  const fmtMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    return `${n.toFixed(2)} €`;
  };

  const badgeClass = (status) => {
    switch (status) {
      case "PENDING_RP_APPROVAL":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-800 border border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const changeBadge = (s) => {
    switch (s) {
      case "PENDING":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-800 border border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  // ✅ show role/user who actually created the service request (fallback chain)
  const resolveCreator = (o) => {
    if (!o) return "-";
    return (
      o.createdByRole ||
      o.requestCreatedByRole ||
      o.requestedByRole ||
      o.requestedByUsername ||
      o.createdBy ||
      "System"
    );
  };

  const withinHours = (dateValue, hours) => {
    if (!dateValue) return false;
    const t = new Date(dateValue).getTime();
    if (!Number.isFinite(t)) return false;
    const diff = Date.now() - t;
    return diff >= 0 && diff <= hours * 60 * 60 * 1000;
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to load order details."));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  // ✅ When order loads, prefill feedback form fields (for edit mode) safely
  useEffect(() => {
    if (!order) return;

    // Only prefill when we enter edit mode later; however,
    // we set sensible defaults here from backend if present.
    const q =
      order.qualityRating ??
      order.feedbackQuality ??
      order.feedback?.quality ??
      5;
    const c =
      order.communicationRating ??
      order.feedbackCommunication ??
      order.feedback?.communication ??
      5;
    const v =
      order.valueRating ?? order.feedbackValue ?? order.feedback?.value ?? 5;

    // If backend stores category ratings, align defaults:
    setQualityRating(Number(q) || 5);
    setCommunicationRating(Number(c) || 5);
    setValueRating(Number(v) || 5);

    // Anonymous flag (if exists)
    const anon =
      order.feedbackAnonymous ??
      order.anonymousFeedback ??
      order.feedback?.anonymous ??
      false;
    setAnonymousFeedback(Boolean(anon));

    // Existing overall rating/comment (if exists)
    if (order.rating != null) setRating(Number(order.rating) || 5);
    if (order.feedbackComment != null) setComment(String(order.feedbackComment));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id]);

  // ✅ Load average supplier rating across orders (best-effort, non-breaking)
  useEffect(() => {
    const fetchSupplierAvg = async () => {
      if (!order?.supplierName && !order?.supplierId) {
        setSupplierAvg(null);
        return;
      }

      try {
        setSupplierAvgLoading(true);

        // Assumption: your backend already supports GET /orders (you use /orders page elsewhere)
        // We keep it best-effort: if endpoint isn't available, UI simply won't show the average.
        const res = await API.get("/orders");
        const all = Array.isArray(res.data) ? res.data : res.data?.content || [];

        const keyName = order?.supplierName ? String(order.supplierName) : null;
        const keyId = order?.supplierId ? String(order.supplierId) : null;

        const relevant = (all || []).filter((o) => {
          const sameName =
            keyName &&
            o?.supplierName &&
            String(o.supplierName).toLowerCase() === keyName.toLowerCase();
          const sameId =
            keyId && o?.supplierId && String(o.supplierId) === keyId;
          return Boolean(sameId || sameName);
        });

        const rated = relevant.filter((o) => o?.rating != null);
        const count = rated.length;
        if (!count) {
          setSupplierAvg({ avg: null, count: 0 });
          return;
        }

        const sum = rated.reduce((acc, o) => acc + Number(o.rating || 0), 0);
        const avg = sum / count;
        setSupplierAvg({ avg, count });
      } catch (e) {
        // non-blocking
        setSupplierAvg(null);
      } finally {
        setSupplierAvgLoading(false);
      }
    };

    fetchSupplierAvg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.supplierName, order?.supplierId]);

  // -------- existing order actions --------
  const approve = async () => {
    try {
      await API.post(`/orders/${id}/approve`);
      toast.success("Order approved.");
      load();
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to approve order."));
    }
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    try {
      await API.post(
        `/orders/${id}/reject`,
        { reason: rejectReason },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Order rejected.");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to reject order."));
    }
  };

  const submitFeedback = async () => {
    // Keep existing validation (rating must be 1-5)
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Overall rating must be 1–5.");
      return;
    }

    // ✅ categories validation
    const cats = [qualityRating, communicationRating, valueRating];
    if (cats.some((x) => !x || x < 1 || x > 5)) {
      toast.error("Category ratings must be 1–5.");
      return;
    }

    if (comment && comment.length > 1000) {
      toast.error("Comment is too long (max 1000 characters).");
      return;
    }

    try {
      // ✅ Do NOT remove existing logic: still send rating + comment exactly as before.
      // We add extra fields (backend can ignore if unknown).
      await API.post(
        `/orders/${id}/feedback`,
        {
          rating,
          comment,

          // added fields (safe extension)
          qualityRating,
          communicationRating,
          valueRating,
          anonymous: anonymousFeedback,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      toast.success(editingFeedback ? "Feedback updated." : "Feedback submitted.");
      setEditingFeedback(false);
      load();
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to submit feedback."));
    }
  };

  // -------- NEW: change request actions --------
  const submitSubstitution = async () => {
    if (!newSpecialistName.trim()) {
      toast.error("Please enter the new specialist name.");
      return;
    }
    if (!subReason.trim()) {
      toast.error("Please provide a reason for substitution.");
      return;
    }

    try {
      await API.post(
        `/orders/${id}/substitution`,
        { newSpecialistName, reason: subReason },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Substitution request submitted.");
      setSubOpen(false);
      setNewSpecialistName("");
      setSubReason("");
      load();
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to submit substitution request."));
    }
  };

  const submitExtension = async () => {
    if (!newEndDate) {
      toast.error("Please choose a new end date.");
      return;
    }
    const md = Number(extraManDays);
    if (!Number.isFinite(md) || md <= 0) {
      toast.error("Extra man-days must be > 0.");
      return;
    }
    const cv = Number(newContractValue);
    if (!Number.isFinite(cv) || cv <= 0) {
      toast.error("New contract value must be > 0.");
      return;
    }
    if (!extReason.trim()) {
      toast.error("Please provide a reason for extension.");
      return;
    }

    try {
      await API.post(
        `/orders/${id}/extension`,
        {
          newEndDate,
          extraManDays: md,
          newContractValue: cv,
          reason: extReason,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Extension request submitted.");
      setExtOpen(false);
      setNewEndDate("");
      setExtraManDays(0);
      setNewContractValue("");
      setExtReason("");
      load();
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to submit extension request."));
    }
  };

  const approveChange = async () => {
    try {
      await API.post(`/orders/${id}/change/approve`);
      toast.success("Change request approved.");
      load();
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to approve change request."));
    }
  };

  const submitRejectChange = async () => {
    if (!changeRejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    try {
      await API.post(
        `/orders/${id}/change/reject`,
        { reason: changeRejectReason },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Change request rejected.");
      setChangeRejectOpen(false);
      setChangeRejectReason("");
      load();
    } catch (e) {
      console.error(e);
      toast.error(errorMessage(e, "Failed to reject change request."));
    }
  };

  // -------- permissions --------
  const canRpAct =
    role === "RESOURCE_PLANNER" && order?.status === "PENDING_RP_APPROVAL";

  const canPmFeedback =
    role === "PROJECT_MANAGER" &&
    order?.status === "APPROVED" &&
    order?.rating == null;

  // ✅ feedback edit window (24h)
  const canPmEditFeedback =
    role === "PROJECT_MANAGER" &&
    order?.status === "APPROVED" &&
    order?.rating != null &&
    String(order?.feedbackCreatedBy || "") === String(currentUsername || "") &&
    withinHours(order?.feedbackCreatedAt, 24);

  // ✅ who can request substitution?
  // requirement: PM + Supplier Representative
  const canRequestSubstitution =
    (role === "PROJECT_MANAGER" || role === "SUPPLIER_REPRESENTATIVE") &&
    order?.status === "APPROVED";

  // ✅ who can request extension?
  // requirement: PM only
  const canRequestExtension =
    role === "PROJECT_MANAGER" && order?.status === "APPROVED";

  // ✅ RP approves/rejects change requests
  const changePending = order?.changeStatus === "PENDING";
  const canRpHandleChange = role === "RESOURCE_PLANNER" && changePending;

  const hasSelectedOffer = useMemo(() => {
    if (!order) return false;
    return (
      order.offerId != null ||
      order.materialNumber ||
      order.dailyRate != null ||
      order.travellingCost != null
    );
  }, [order]);

  // ✅ overall rating helper (optional: keep manual, but provide a “sync” button)
  const computedOverall = useMemo(() => {
    const avg = (Number(qualityRating) + Number(communicationRating) + Number(valueRating)) / 3;
    // nearest half-star not supported by component, so round to 1 decimal for label
    return Number.isFinite(avg) ? Math.round(avg * 10) / 10 : null;
  }, [qualityRating, communicationRating, valueRating]);

  const startEditFeedback = () => {
    // Prefill from existing order feedback
    setEditingFeedback(true);

    setRating(Number(order?.rating ?? 5) || 5);
    setComment(String(order?.feedbackComment ?? ""));

    setQualityRating(Number(order?.qualityRating ?? order?.feedbackQuality ?? 5) || 5);
    setCommunicationRating(
      Number(order?.communicationRating ?? order?.feedbackCommunication ?? 5) || 5
    );
    setValueRating(Number(order?.valueRating ?? order?.feedbackValue ?? 5) || 5);

    setAnonymousFeedback(Boolean(order?.feedbackAnonymous ?? false));
  };

  // -------- states --------
  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100 p-6">
          <TopNav />
          <p className="text-slate-700 mt-6">Loading…</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100 p-6">
          <TopNav />
          <div className="mt-6 bg-white/80 border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-slate-800 font-semibold">Order not found.</p>
            <button
              onClick={() => navigate("/orders")}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
              type="button"
            >
              <FiArrowLeft /> Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------- render --------
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100">
        <div className="p-4 sm:p-6">
          <TopNav />

          {/* Sticky header bar */}
          <div className="sticky top-[92px] z-20 mt-4">
            <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm px-4 sm:px-5 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Order #{order.id}
                    </h1>

                    <span
                      className={
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold " +
                        badgeClass(order.status)
                      }
                    >
                      {order.status}
                    </span>

                    {order.changeStatus && (
                      <span
                        className={
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold " +
                          changeBadge(order.changeStatus)
                        }
                      >
                        Change: {order.changeStatus}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 mt-1">
                    Request:{" "}
                    <span className="font-semibold">
                      {order.requestNumber || "-"}
                    </span>{" "}
                    • Request ID:{" "}
                    <span className="font-semibold">{order.requestId ?? "-"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {order?.requestId != null && (
                    <button
                      onClick={() => navigate(`/requests/${order.requestId}`)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition inline-flex items-center gap-2"
                      type="button"
                    >
                      <FiExternalLink /> Open Request
                    </button>
                  )}

                  <button
                    onClick={() => navigate("/orders")}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition inline-flex items-center gap-2"
                    type="button"
                  >
                    <FiArrowLeft /> Back
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="mt-5 grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* LEFT: Order details */}
            <div className="xl:col-span-8 bg-white/85 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <FiInfo className="text-slate-700" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Order Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-800">
                <p>
                  <span className="text-slate-500 font-semibold">Title:</span>{" "}
                  {order.title || "-"}
                </p>
                <p>
                  <span className="text-slate-500 font-semibold">Location:</span>{" "}
                  {order.location || "-"}
                </p>
                <p>
                  <span className="text-slate-500 font-semibold">Dates:</span>{" "}
                  {order.startDate || "-"} → {order.endDate || "-"}
                </p>
                <p>
                  <span className="text-slate-500 font-semibold">Role:</span>{" "}
                  {order.role || "-"}
                </p>

                <p>
                  <span className="text-slate-500 font-semibold">Man-days:</span>{" "}
                  {order.manDays ?? "-"}
                </p>
                <p>
                  <span className="text-slate-500 font-semibold">
                    Contract Value:
                  </span>{" "}
                  {fmtMoney(order.contractValue)}
                </p>

                <p>
                  <span className="text-slate-500 font-semibold">Supplier:</span>{" "}
                  {order.supplierName || "-"}
                </p>
                <p>
                  <span className="text-slate-500 font-semibold">
                    Supplier Rep:
                  </span>{" "}
                  {order.supplierRepresentative || "-"}
                </p>

                <p>
                  <span className="text-slate-500 font-semibold">Specialist:</span>{" "}
                  {order.specialistName || "-"}
                </p>

                {hasSelectedOffer && (
                  <>
                    <p>
                      <span className="text-slate-500 font-semibold">
                        Material #:
                      </span>{" "}
                      {order.materialNumber || "-"}
                    </p>
                    <p>
                      <span className="text-slate-500 font-semibold">
                        Daily Rate:
                      </span>{" "}
                      {order.dailyRate != null ? `${order.dailyRate} €` : "-"}
                    </p>
                    <p>
                      <span className="text-slate-500 font-semibold">
                        Travel Cost:
                      </span>{" "}
                      {order.travellingCost != null
                        ? `${order.travellingCost} €`
                        : "0 €"}
                    </p>
                    <p>
                      <span className="text-slate-500 font-semibold">
                        Relationship:
                      </span>{" "}
                      {order.contractualRelationship || "-"}
                    </p>
                    <p>
                      <span className="text-slate-500 font-semibold">
                        Subcontractor:
                      </span>{" "}
                      {order.subcontractorCompany || "-"}
                    </p>
                  </>
                )}
              </div>

              {/* ✅ NEW: Change Request summary */}
              {order.changeStatus && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <FiClock className="text-slate-700" />
                      <p className="text-sm font-semibold text-slate-900">
                        Order Change Request
                      </p>
                      <span
                        className={
                          "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold " +
                          changeBadge(order.changeStatus)
                        }
                      >
                        {order.changeStatus}
                      </span>
                    </div>

                    {canRpHandleChange && (
                      <div className="flex gap-2">
                        <button
                          onClick={approveChange}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition inline-flex items-center gap-2"
                          type="button"
                        >
                          <FiCheckCircle /> Approve Change
                        </button>
                        <button
                          onClick={() => {
                            setChangeRejectReason("");
                            setChangeRejectOpen(true);
                          }}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition inline-flex items-center gap-2"
                          type="button"
                        >
                          <FiXCircle /> Reject Change
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-700">
                    <p>
                      <span className="text-slate-500 font-semibold">Type:</span>{" "}
                      {order.changeType || "-"}
                    </p>
                    <p>
                      <span className="text-slate-500 font-semibold">
                        Requested by:
                      </span>{" "}
                      {order.changeRequestedBy || "-"} •{" "}
                      {fmtDateTime(order.changeRequestedAt)}
                    </p>

                    {order.changeType === "SUBSTITUTION" && (
                      <p className="md:col-span-2">
                        <span className="text-slate-500 font-semibold">
                          New specialist:
                        </span>{" "}
                        {order.newSpecialistName || "-"}
                      </p>
                    )}

                    {order.changeType === "EXTENSION" && (
                      <>
                        <p>
                          <span className="text-slate-500 font-semibold">
                            New end date:
                          </span>{" "}
                          {order.newEndDate || "-"}
                        </p>
                        <p>
                          <span className="text-slate-500 font-semibold">
                            Extra man-days:
                          </span>{" "}
                          {order.extraManDays ?? "-"}
                        </p>
                        <p className="md:col-span-2">
                          <span className="text-slate-500 font-semibold">
                            New contract value:
                          </span>{" "}
                          {fmtMoney(order.newContractValue)}
                        </p>
                      </>
                    )}

                    {order.changeReason && (
                      <p className="md:col-span-2">
                        <span className="text-slate-500 font-semibold">Reason:</span>{" "}
                        {order.changeReason}
                      </p>
                    )}

                    {order.changeRejectedReason && (
                      <p className="md:col-span-2 text-red-700">
                        <span className="font-semibold">Rejected reason:</span>{" "}
                        {order.changeRejectedReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Action + Audit + Feedback */}
            <div className="xl:col-span-4 space-y-4">
              {/* ✅ NEW: Change request action panel */}
              {(canRequestSubstitution || canRequestExtension) && (
                <div className="bg-white/85 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
                    <FiEdit3 className="text-slate-800" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Order Changes
                      </p>
                      <p className="text-xs text-slate-600">
                        Request a substitution or extension (after approval).
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <button
                      onClick={() => {
                        setNewSpecialistName("");
                        setSubReason("");
                        setSubOpen(true);
                      }}
                      disabled={changePending}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                        changePending
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                      type="button"
                      title={changePending ? "A change request is already pending." : ""}
                    >
                      <FiEdit3 /> Request Substitution
                    </button>

                    <button
                      onClick={() => {
                        setNewEndDate(order?.endDate || "");
                        setExtraManDays(0);
                        setNewContractValue(order?.contractValue ?? "");
                        setExtReason("");
                        setExtOpen(true);
                      }}
                      disabled={!canRequestExtension || changePending}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                        !canRequestExtension || changePending
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                      type="button"
                      title={
                        changePending
                          ? "A change request is already pending."
                          : !canRequestExtension
                          ? "Only Project Manager can request extension."
                          : ""
                      }
                    >
                      <FiClock /> Request Extension
                    </button>

                    <p className="text-[11px] text-slate-500 mt-2">
                      If a change is pending, you must wait for RP decision.
                    </p>
                  </div>
                </div>
              )}

              {/* RP APPROVAL PANEL (existing) */}
              {canRpAct && (
                <div className="bg-white/85 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
                    <FiShield className="text-slate-800" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        RP Approval Required
                      </p>
                      <p className="text-xs text-slate-600">
                        Review details and approve/reject.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <button
                      onClick={approve}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                      type="button"
                    >
                      <FiCheckCircle /> Approve Order
                    </button>

                    <button
                      onClick={() => {
                        setRejectReason("");
                        setRejectOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition"
                      type="button"
                    >
                      <FiXCircle /> Reject Order
                    </button>

                    <p className="text-[11px] text-slate-500 mt-2">
                      Approving confirms the service order. Rejecting requires a reason.
                    </p>
                  </div>
                </div>
              )}

              {/* Audit */}
              <div className="bg-white/85 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Audit
                </h3>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-700">Created:</span>{" "}
                    {fmtDateTime(order.createdAt)} •{" "}
                    <span className="font-semibold">{resolveCreator(order)}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Approved:</span>{" "}
                    {fmtDateTime(order.approvedAt)} • {order.approvedBy || "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Rejected:</span>{" "}
                    {fmtDateTime(order.rejectedAt)} • {order.rejectedBy || "-"}
                  </p>

                  {order.rejectionReason && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-semibold text-red-800">
                        Rejection reason
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {order.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback (professional) */}
              <div className="bg-white/85 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Feedback
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Professional review summary for this order.
                    </p>
                  </div>

                  {/* ✅ Edit window action (24h) */}
                  {canPmEditFeedback && !editingFeedback && (
                    <button
                      onClick={startEditFeedback}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
                      type="button"
                      title="You can edit your feedback within 24 hours."
                    >
                      <FiEdit3 /> Edit
                    </button>
                  )}
                </div>

                {/* Supplier average rating (across orders) */}
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-xs font-semibold text-slate-800">
                    Supplier Rating (overall)
                  </p>

                  {supplierAvgLoading ? (
                    <p className="text-xs text-slate-600 mt-1">Loading…</p>
                  ) : supplierAvg?.count ? (
                    <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <StarRating
                          value={Math.round((supplierAvg.avg || 0) * 10) / 10}
                          readonly
                          sizeClass="text-lg"
                          label="Supplier average"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          {Math.round((supplierAvg.avg || 0) * 10) / 10} / 5
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Based on {supplierAvg.count} rated order(s)
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 mt-1">
                      Not enough rated orders to calculate an average yet.
                    </p>
                  )}
                </div>

                {/* Existing feedback display */}
                {order.rating != null && !editingFeedback ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <FiStar className="text-amber-500" />
                      <div className="flex items-center gap-2">
                        <StarRating
                          value={Number(order.rating) || 0}
                          readonly
                          sizeClass="text-lg"
                          label="Overall"
                        />
                        <span className="text-sm font-semibold text-slate-700">
                          {order.rating} / 5
                        </span>
                      </div>
                    </div>

                    {/* Categories (if present) */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] font-semibold text-slate-600">
                          Quality
                        </p>
                        <div className="mt-1">
                          <StarRating
                            value={
                              Number(
                                order.qualityRating ??
                                  order.feedbackQuality ??
                                  order.feedback?.quality
                              ) || 0
                            }
                            readonly
                            sizeClass="text-base"
                            label="Quality"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] font-semibold text-slate-600">
                          Communication
                        </p>
                        <div className="mt-1">
                          <StarRating
                            value={
                              Number(
                                order.communicationRating ??
                                  order.feedbackCommunication ??
                                  order.feedback?.communication
                              ) || 0
                            }
                            readonly
                            sizeClass="text-base"
                            label="Communication"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[11px] font-semibold text-slate-600">
                          Value
                        </p>
                        <div className="mt-1">
                          <StarRating
                            value={
                              Number(
                                order.valueRating ??
                                  order.feedbackValue ??
                                  order.feedback?.value
                              ) || 0
                            }
                            readonly
                            sizeClass="text-base"
                            label="Value"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                      {order.feedbackComment || "No written feedback provided."}
                    </p>

                    <p className="mt-3 text-xs text-slate-500">
                      Provided by{" "}
                      <span className="font-semibold">
                        {order.feedbackAnonymous ? "Anonymous" : order.feedbackCreatedBy || "-"}
                      </span>{" "}
                      on {fmtDateTime(order.feedbackCreatedAt)}
                      {canPmEditFeedback && (
                        <span className="ml-2 text-[11px] text-slate-500">
                          • Editable within 24 hours
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  !editingFeedback && (
                    <p className="text-sm text-slate-600 mt-3">No feedback yet.</p>
                  )
                )}

                {/* ✅ Professional feedback form (new OR edit) */}
                {(canPmFeedback || editingFeedback) && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">
                          {editingFeedback ? "Edit your feedback" : "Leave feedback"}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Rate key dimensions and optionally add a short comment.
                        </p>
                      </div>

                      {/* Quick sync overall */}
                      <button
                        type="button"
                        onClick={() => {
                          // sync overall rating to computed average of categories
                          if (computedOverall != null) {
                            const rounded = Math.round(computedOverall);
                            setRating(Math.min(5, Math.max(1, rounded)));
                          }
                        }}
                        className="px-3 py-2 rounded-xl text-[11px] font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 transition"
                        title="Set overall rating to the rounded average of category ratings."
                      >
                        Use avg ({computedOverall ?? "-"})
                      </button>
                    </div>

                    {/* Categories */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Quality
                        </p>
                        <div className="mt-1">
                          <StarRating
                            value={qualityRating}
                            onChange={setQualityRating}
                            label="Quality"
                            sizeClass="text-lg"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Delivery quality & technical fit.
                        </p>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Communication
                        </p>
                        <div className="mt-1">
                          <StarRating
                            value={communicationRating}
                            onChange={setCommunicationRating}
                            label="Communication"
                            sizeClass="text-lg"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Responsiveness and clarity.
                        </p>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Value
                        </p>
                        <div className="mt-1">
                          <StarRating
                            value={valueRating}
                            onChange={setValueRating}
                            label="Value"
                            sizeClass="text-lg"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Cost vs. benefit for the service.
                        </p>
                      </div>
                    </div>

                    {/* Overall */}
                    <div className="mt-3 bg-white rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-semibold text-slate-700">
                        Overall rating
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-3 flex-wrap">
                        <StarRating
                          value={rating}
                          onChange={setRating}
                          label="Overall"
                          sizeClass="text-lg"
                        />
                        <span className="text-[11px] text-slate-500">
                          Tip: click “Use avg” to sync overall.
                        </span>
                      </div>
                    </div>

                    {/* Anonymous toggle */}
                    <div className="mt-3 flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-3">
                      <input
                        id="anonFeedback"
                        type="checkbox"
                        checked={anonymousFeedback}
                        onChange={(e) => setAnonymousFeedback(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <label htmlFor="anonFeedback" className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          Submit anonymously
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Your name will be hidden in the feedback display.
                        </p>
                      </label>
                    </div>

                    {/* Comment */}
                    <div className="mt-3">
                      <label className="text-xs font-semibold text-slate-700">
                        Comment (optional)
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        placeholder="Describe quality of service, communication, and delivery..."
                      />
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Be specific and professional.</span>
                        <span>{(comment || "").length}/1000</span>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                      {editingFeedback && (
                        <button
                          type="button"
                          onClick={() => setEditingFeedback(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={submitFeedback}
                        className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
                        type="button"
                      >
                        {editingFeedback ? "Save Changes" : "Submit Feedback"}
                      </button>
                    </div>

                    {editingFeedback && (
                      <p className="mt-2 text-[11px] text-slate-500">
                        You can edit feedback only within 24 hours after submission.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ---- Modals ---- */}

          {/* Substitution modal */}
          {subOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Request Substitution
                </h3>

                <label className="text-xs font-semibold text-slate-600">
                  New Specialist Name
                </label>
                <input
                  value={newSpecialistName}
                  onChange={(e) => setNewSpecialistName(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="e.g. John Doe"
                />

                <label className="text-xs font-semibold text-slate-600">
                  Reason
                </label>
                <textarea
                  value={subReason}
                  onChange={(e) => setSubReason(e.target.value)}
                  rows={4}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  placeholder="Why substitution is required…"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSubOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitSubstitution}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700"
                    type="button"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Extension modal */}
          {extOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Request Extension
                </h3>

                <label className="text-xs font-semibold text-slate-600">
                  New End Date
                </label>
                <input
                  type="date"
                  value={newEndDate || ""}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />

                <label className="text-xs font-semibold text-slate-600">
                  Extra Man-days
                </label>
                <input
                  type="number"
                  value={extraManDays}
                  onChange={(e) => setExtraManDays(Number(e.target.value))}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  min={0}
                />

                <label className="text-xs font-semibold text-slate-600">
                  New Contract Value (€)
                </label>
                <input
                  type="number"
                  value={newContractValue}
                  onChange={(e) => setNewContractValue(e.target.value)}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  min={0}
                />

                <label className="text-xs font-semibold text-slate-600">
                  Reason
                </label>
                <textarea
                  value={extReason}
                  onChange={(e) => setExtReason(e.target.value)}
                  rows={4}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  placeholder="Why extension is required…"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setExtOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitExtension}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900 text-white hover:bg-slate-800"
                    type="button"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RP Reject Order modal */}
          {rejectOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Reject Order #{order.id}
                </h3>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  placeholder="Provide a clear reason..."
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

          {/* RP Reject Change modal */}
          {changeRejectOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-40 px-3">
              <div className="bg-white rounded-2xl shadow-xl p-4 md:p-5 w-full max-w-md border border-slate-100">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Reject Change Request
                </h3>

                <textarea
                  value={changeRejectReason}
                  onChange={(e) => setChangeRejectReason(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  placeholder="Provide a clear reason..."
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setChangeRejectOpen(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitRejectChange}
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
    </div>
  );
}
