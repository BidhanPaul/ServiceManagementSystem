// src/pages/OrdersList.js
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiClipboard,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiChevronRight,
  FiDownload,
  FiArrowUp,
  FiArrowDown,
  FiSend,
  FiClock,
} from "react-icons/fi";

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // kept (backend statuses)
  const [activeTab, setActiveTab] = useState("ALL"); // upgraded (supports ACCEPTED + FEEDBACK)
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const navigate = useNavigate();

  // ✅ Normalize role (handles ROLE_PROJECT_MANAGER too)
  const rawRole = localStorage.getItem("role") || "";
  const role = rawRole.replace("ROLE_", "");

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get("/orders");
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  /**
   * ✅ Compatibility helper (non-breaking):
   * Some backends might return APPROVED early even before provider confirmation.
   * We keep this logic but upgrade display so user sees "Accepted + Submitted to Provider"
   * instead of a confusing "Provider Approved" too early.
   *
   * Provider confirmation should typically set approvedBy="PROVIDER_GROUP3".
   * If your backend uses a different value, adjust only here.
   */
  const isProviderConfirmed = (o) =>
    String(o?.approvedBy || "").toUpperCase() === "PROVIDER_GROUP3";

  const isAcceptedSubmitted = (o) => {
    if (!o) return false;
    // explicit waiting state
    if (o.status === "SUBMITTED_TO_PROVIDER") return true;
    // legacy early-approved-but-not-confirmed case
    if (o.status === "APPROVED" && !isProviderConfirmed(o)) return true;
    return false;
  };

  const isAcceptedConfirmed = (o) => {
    if (!o) return false;
    return o.status === "APPROVED" && isProviderConfirmed(o);
  };

  /**
   * ✅ effectiveStatus (kept conceptually):
   * Returns backend statuses (PENDING_RP_APPROVAL, SUBMITTED_TO_PROVIDER, APPROVED, REJECTED),
   * BUT if APPROVED is not provider-confirmed, we treat it as SUBMITTED_TO_PROVIDER for UI.
   */
  const effectiveStatus = (o) => {
    if (!o) return null;
    if (o.status === "APPROVED" && !isProviderConfirmed(o)) return "SUBMITTED_TO_PROVIDER";
    return o.status;
  };

  // ✅ Friendly label (display only)
  const statusLabel = (o) => {
    const st = effectiveStatus(o);
    switch (st) {
      case "PENDING_RP_APPROVAL":
        return "Pending RP Approval";
      case "SUBMITTED_TO_PROVIDER":
        // ✅ new UX: show BOTH semantics as requested
        return "Accepted • Submitted to Provider";
      case "APPROVED":
        return "Accepted • Provider Confirmed";
      case "REJECTED":
        return "Rejected";
      default:
        return st || "-";
    }
  };

  // ✅ Badge colors (display only)
  const badgeClass = (o) => {
    const st = effectiveStatus(o);
    switch (st) {
      case "PENDING_RP_APPROVAL":
        return "bg-amber-50 text-amber-800 border border-amber-200";
      case "SUBMITTED_TO_PROVIDER":
        return "bg-sky-50 text-sky-800 border border-sky-200";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-800 border border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-800 border border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200";
    }
  };

  const statusIcon = (o) => {
    const st = effectiveStatus(o);
    switch (st) {
      case "PENDING_RP_APPROVAL":
        return <FiAlertCircle className="text-amber-600" />;
      case "SUBMITTED_TO_PROVIDER":
        return <FiSend className="text-sky-700" />;
      case "APPROVED":
        return <FiCheckCircle className="text-emerald-600" />;
      case "REJECTED":
        return <FiXCircle className="text-red-600" />;
      default:
        return <FiClipboard className="text-slate-600" />;
    }
  };

  const fmtMoney = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return "-";
    return `${n.toFixed(2)} €`;
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

  const toTime = (v) => {
    if (!v) return 0;
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  // ✅ Auto-refresh while any order is waiting on provider (submitted/accepted-submitted)
  const anyWaiting = useMemo(() => {
    return (orders || []).some((o) => isAcceptedSubmitted(o));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  useEffect(() => {
    if (!anyWaiting) return;

    const t = setInterval(() => {
      load();
    }, 15000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anyWaiting]);

  // -------- summary cards --------
  const counts = useMemo(() => {
    const all = orders || [];

    const pending = all.filter((o) => effectiveStatus(o) === "PENDING_RP_APPROVAL").length;
    const submitted = all.filter((o) => isAcceptedSubmitted(o)).length;
    const confirmed = all.filter((o) => isAcceptedConfirmed(o)).length;

    // ✅ "Accepted" = Submitted + Confirmed (as requested)
    const accepted = submitted + confirmed;

    const rejected = all.filter((o) => effectiveStatus(o) === "REJECTED").length;
    const withFeedback = all.filter((o) => o.rating != null).length;

    return {
      total: all.length,
      pending,
      submitted,
      confirmed,
      accepted,
      rejected,
      withFeedback,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // -------- filtering / search + tabs + sort --------
  const filteredOrders = useMemo(() => {
    const text = (q || "").trim().toLowerCase();

    let list = [...(orders || [])];

    // ✅ dropdown filter uses backend statuses (kept)
    if (statusFilter !== "ALL") {
      list = list.filter((o) => effectiveStatus(o) === statusFilter);
    }

    // ✅ upgraded tab filter (does NOT break dropdown logic)
    if (activeTab !== "ALL" && activeTab !== "FEEDBACK") {
      if (activeTab === "ACCEPTED") {
        list = list.filter((o) => isAcceptedSubmitted(o) || isAcceptedConfirmed(o));
      } else if (activeTab === "SUBMITTED_TO_PROVIDER") {
        list = list.filter((o) => isAcceptedSubmitted(o));
      } else if (activeTab === "APPROVED") {
        list = list.filter((o) => isAcceptedConfirmed(o));
      } else {
        // pending / rejected (direct)
        list = list.filter((o) => effectiveStatus(o) === activeTab);
      }
    }

    if (text) {
      list = list.filter((o) => {
        const st = effectiveStatus(o);
        const haystack = [
          o.id,
          st,
          statusLabel(o),
          o.requestNumber,
          o.requestId,
          o.title,
          o.supplierName,
          o.specialistName,
        ]
          .map((x) => (x == null ? "" : String(x)))
          .join(" ")
          .toLowerCase();

        return haystack.includes(text);
      });
    }

    // ✅ FEEDBACK tab filter (works correctly; no empty-list bug)
    if (activeTab === "FEEDBACK") {
      list = list.filter((o) => o.rating != null);
    }

    // ✅ sort
    const dir = sortDir === "asc" ? 1 : -1;

    const statusSortKey = (o) => {
      // stable, user-meaningful ordering
      if (effectiveStatus(o) === "PENDING_RP_APPROVAL") return 1;
      if (isAcceptedSubmitted(o)) return 2;
      if (isAcceptedConfirmed(o)) return 3;
      if (effectiveStatus(o) === "REJECTED") return 4;
      return 9;
    };

    list.sort((a, b) => {
      if (sortKey === "createdAt") return (toTime(a.createdAt) - toTime(b.createdAt)) * dir;
      if (sortKey === "value") return ((Number(a.contractValue) || 0) - (Number(b.contractValue) || 0)) * dir;
      if (sortKey === "status") return (statusSortKey(a) - statusSortKey(b)) * dir;
      if (sortKey === "orderId") return ((Number(a.id) || 0) - (Number(b.id) || 0)) * dir;
      return 0;
    });

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, q, statusFilter, activeTab, sortKey, sortDir]);

  // -------- CSV export (client-side) --------
  const downloadCSV = () => {
    const rows = filteredOrders.map((o) => {
      const st = effectiveStatus(o);
      return {
        id: o.id ?? "",
        status: st ?? "",
        statusLabel: statusLabel(o) ?? "",
        requestNumber: o.requestNumber ?? "",
        requestId: o.requestId ?? "",
        title: o.title ?? "",
        supplierName: o.supplierName ?? "",
        specialistName: o.specialistName ?? "",
        contractValue: o.contractValue ?? "",
        createdAt: o.createdAt ?? "",
        rating: o.rating ?? "",
      };
    });

    const headers = Object.keys(rows[0] || { id: "" });

    const escape = (val) => {
      const s = val == null ? "" : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const SortBtn = ({ label, k }) => {
    const active = sortKey === k;
    return (
      <button
        onClick={() => {
          if (sortKey !== k) {
            setSortKey(k);
            setSortDir("desc");
          } else {
            setSortDir((d) => (d === "desc" ? "asc" : "desc"));
          }
        }}
        className={
          "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition " +
          (active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white")
        }
        type="button"
        title={`Sort by ${label}`}
      >
        {label}
        {active ? (sortDir === "desc" ? <FiArrowDown /> : <FiArrowUp />) : null}
      </button>
    );
  };

  const Tab = ({ label, value, count }) => {
    const active = activeTab === value;
    return (
      <button
        onClick={() => setActiveTab(value)}
        className={
          "px-4 py-2 rounded-full text-xs font-semibold border transition inline-flex items-center gap-2 " +
          (active
            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
            : "bg-white/70 text-slate-700 border-slate-200 hover:bg-white")
        }
        type="button"
      >
        {label}
        <span
          className={
            "px-2 py-0.5 rounded-full text-[11px] font-bold " +
            (active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700")
          }
        >
          {count}
        </span>
      </button>
    );
  };

  // ✅ small stat card (redesign only; no logic changes)
  const StatCard = ({ title, value, hint, icon }) => (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
        </div>
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100">
        <div className="p-4 sm:p-6">
          <TopNav />

          {/* Header + filters */}
          <div className="mt-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <FiClipboard className="text-slate-900" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Service Orders
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      PM sees only their own orders. Resource Planner sees all, including pending approvals.
                    </p>
                  </div>
                </div>

                {/* ✅ Info banner while waiting */}
                {anyWaiting && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-900">
                    <FiClock className="text-sky-700" />
                    Some accepted orders are submitted to provider and waiting for confirmation. This list refreshes automatically.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={downloadCSV}
                  className="px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-white transition inline-flex items-center gap-2"
                  type="button"
                  title="Download filtered orders as CSV"
                  disabled={filteredOrders.length === 0}
                >
                  <FiDownload />
                  Export CSV
                </button>

                <button
                  onClick={load}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition inline-flex items-center gap-2"
                  type="button"
                >
                  <FiRefreshCw />
                  Refresh
                </button>
              </div>
            </div>

            {/* Quick stats (upgrade/redesign) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
              <StatCard
                title="Total"
                value={counts.total}
                hint="All visible orders"
                icon={<FiClipboard className="text-slate-800" />}
              />
              <StatCard
                title="Pending"
                value={counts.pending}
                hint="Needs RP decision"
                icon={<FiAlertCircle className="text-amber-600" />}
              />
              <StatCard
                title="Accepted"
                value={counts.accepted}
                hint="Submitted + confirmed"
                icon={<FiCheckCircle className="text-emerald-600" />}
              />
              <StatCard
                title="Submitted"
                value={counts.submitted}
                hint="Waiting provider"
                icon={<FiSend className="text-sky-700" />}
              />
              <StatCard
                title="Rejected"
                value={counts.rejected}
                hint="Not proceeding"
                icon={<FiXCircle className="text-red-600" />}
              />
              <StatCard
                title="Feedback"
                value={counts.withFeedback}
                hint="Rated orders"
                icon={<FiCheckCircle className="text-slate-800" />}
              />
            </div>

            {/* Tabs (upgraded) */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Tab label="All" value="ALL" count={counts.total} />
              <Tab label="Pending" value="PENDING_RP_APPROVAL" count={counts.pending} />
              <Tab label="Accepted" value="ACCEPTED" count={counts.accepted} />
              <Tab label="Submitted" value="SUBMITTED_TO_PROVIDER" count={counts.submitted} />
              <Tab label="Confirmed" value="APPROVED" count={counts.confirmed} />
              <Tab label="Rejected" value="REJECTED" count={counts.rejected} />
              <Tab label="Feedback" value="FEEDBACK" count={counts.withFeedback} />
            </div>

            {/* Search + status dropdown + sort buttons */}
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">
                  Search
                </label>
                <div className="mt-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2">
                  <FiSearch className="text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm text-slate-800 placeholder-slate-400"
                    placeholder="Order #, request no, title, supplier, specialist…"
                  />
                  {q?.trim() && (
                    <button
                      onClick={() => setQ("")}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600">
                  Status (dropdown)
                </label>
                <div className="mt-1 flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2">
                  <FiFilter className="text-slate-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full outline-none bg-transparent text-sm text-slate-800"
                  >
                    <option value="ALL">All</option>
                    <option value="PENDING_RP_APPROVAL">Pending RP Approval</option>
                    <option value="SUBMITTED_TO_PROVIDER">Submitted to Provider</option>
                    <option value="APPROVED">Provider Confirmed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sort controls */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-600 mr-1">
                Sort:
              </span>
              <SortBtn label="Created" k="createdAt" />
              <SortBtn label="Value" k="value" />
              <SortBtn label="Status" k="status" />
              <SortBtn label="Order #" k="orderId" />
              <div className="ml-auto text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredOrders.length}
                </span>{" "}
                results
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 bg-white/85 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="p-6 text-slate-700">Loading…</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-10 text-center text-slate-600">
                No orders found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1250px] w-full text-sm">
                  <thead className="bg-slate-50/80">
                    <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Request</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4">Specialist</th>
                      <th className="py-3 px-4">Value</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4">Feedback</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    {filteredOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                        onClick={() => navigate(`/orders/${o.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") navigate(`/orders/${o.id}`);
                        }}
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          #{o.id}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={
                              "inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold " +
                              badgeClass(o)
                            }
                            title={statusLabel(o)}
                          >
                            {statusIcon(o)}
                            {statusLabel(o)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-xs text-slate-800">
                            {o.requestNumber || "-"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ID: {o.requestId ?? "-"}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-800">
                          {o.title || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          {o.supplierName || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-800">
                          {o.specialistName || "-"}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900">
                            {fmtMoney(o.contractValue)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-600">
                          {fmtDateTime(o.createdAt)}
                        </td>

                        <td className="py-3 px-4">
                          {o.rating != null ? (
                            <span className="text-emerald-700 font-semibold">
                              ⭐ {o.rating}/5
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">
                              {role === "PROJECT_MANAGER" ? "Not yet" : "-"}
                            </span>
                          )}
                        </td>

                        <td
                          className="py-3 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/orders/${o.id}`)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition"
                            type="button"
                          >
                            Open <FiChevronRight />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && (
            <p className="text-slate-500 text-xs mt-3">
              Tip: click a row to open details. Use tabs + search + sorting for faster review.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
