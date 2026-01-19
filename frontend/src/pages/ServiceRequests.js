// src/pages/ServiceRequests.js
import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const STORAGE_KEY = "SR_FORM_STATE_V1";

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Reference data
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);

  // EDIT MODE
  const [editingId, setEditingId] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("create"); // "create" | "list"

  // List controls
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Prevent toast spam
  const didToastProjectsLoaded = useRef(false);
  const didToastContractsLoaded = useRef(false);

  // Track if user edited title manually
  const titleTouchedRef = useRef(false);

  // Scroll to form on edit
  const formTopRef = useRef(null);

  // ✅ IMPORTANT: prevent overwriting localStorage before restore finishes
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState({
    title: "",
    // NOTE: if your backend uses other types, keep them; this matches your file
    type: "SINGLE",

    projectId: "",
    projectName: "",
    contractId: "",
    contractSupplier: "",

    startDate: "",
    endDate: "",
    performanceLocation: "",
    maxOffers: "",
    maxAcceptedOffers: "",

    biddingCycleDays: 7,

    requiredLanguagesInput: "",
    must1: "",
    must2: "",
    must3: "",
    nice1: "",
    nice2: "",
    nice3: "",
    nice4: "",
    nice5: "",
    taskDescription: "",
    furtherInformation: "",
  });

  const emptyRoleRow = () => ({
    selectedContractRole: "",
    domain: "",
    roleName: "",
    technology: "",
    experienceLevel: "",
    manDays: "",
    onsiteDays: "",
  });

  const [roles, setRoles] = useState([emptyRoleRow()]);

  // -------- limits --------
  const maxRoleRows = useMemo(() => {
    if (form.type === "MULTI") return 4;
    if (form.type === "TEAM") return Infinity;
    return 1;
  }, [form.type]);

  const canAddRole = roles.length < maxRoleRows;

  // --------------------------- LOAD DATA ---------------------------
  const loadRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load requests", err);
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await API.get("/external/projects");
      const data = res.data;
      setProjects(Array.isArray(data) ? data : []);

      if (!didToastProjectsLoaded.current) {
        toast.success("Projects loaded");
        didToastProjectsLoaded.current = true;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
      setProjects([]);
    }
  };

  const loadContracts = async () => {
    try {
      const res = await API.get("/external/contracts");
      const data = res.data;
      setContracts(Array.isArray(data) ? data : []);

      if (!didToastContractsLoaded.current) {
        toast.success("Contracts loaded");
        didToastContractsLoaded.current = true;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load contracts");
      setContracts([]);
    }
  };

  useEffect(() => {
    loadRequests();
    loadProjects();
    loadContracts();
  }, []);

  // ✅ Restore form state after refresh (RUN ONCE)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }

      const saved = JSON.parse(raw);

      // restore primitives
      if (saved?.form) setForm(saved.form);
      if (saved?.roles?.length) setRoles(saved.roles);

      // restore edit mode
      if (saved?.editingId) setEditingId(saved.editingId);
      else setEditingId(null);

      // restore tab
      if (saved?.activeTab) setActiveTab(saved.activeTab);

      // restore "title touched"
      titleTouchedRef.current = !!saved?.titleTouched;
    } catch (e) {
      console.warn("Failed to restore SR form state", e);
    } finally {
      // ✅ allow persisting only AFTER restore attempt is done
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ When projects/contracts arrive, re-link selectedProject/selectedContract from stored ids
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved?.selectedProjectId && projects.length) {
        const proj = projects.find(
          (p) =>
            String(p.projectId) === String(saved.selectedProjectId) ||
            String(p.id) === String(saved.selectedProjectId)
        );
        if (proj) setSelectedProject(proj);
      }

      if (saved?.selectedContractId && contracts.length) {
        const contract = contracts.find((c) => String(c.id) === String(saved.selectedContractId));
        if (contract) {
          setSelectedContract(contract);
          setAvailableRoles(contract?.roles || []);
        }
      }
    } catch {}
  }, [projects, contracts]);

  // ✅ Persist form on every change (works for create + edit) — AFTER HYDRATION
  useEffect(() => {
    if (!hydrated) return;

    try {
      const payload = {
        form,
        roles,
        editingId,
        activeTab,
        titleTouched: titleTouchedRef.current,
        selectedProjectId: selectedProject?.projectId || selectedProject?.id || "",
        selectedContractId: selectedContract?.id || "",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to persist SR form state", e);
    }
  }, [hydrated, form, roles, editingId, activeTab, selectedProject, selectedContract]);

  // --------------------------- HELPERS ---------------------------
  const numOrNull = (v) => (v === "" ? null : Number(v));

  // ✅ SR label helper (backend requestNumber preferred)
  const srLabel = (req) => {
    if (!req) return "-";
    if (req.requestNumber && String(req.requestNumber).trim()) return req.requestNumber;
    if (req.id == null) return "-";
    return `SR-${String(req.id).padStart(6, "0")}`;
  };

  const getTechnologyOptionsFromContractRole = (cr) => {
    if (!cr) return [];
    const candidates = [
      cr.technologies,
      cr.technologyOptions,
      cr.technologyLevels,
      cr.technology,
      cr.technologyLevel,
      cr.tech,
      cr.techStack,
    ];

    const out = [];
    for (const val of candidates) {
      if (!val) continue;
      if (Array.isArray(val)) val.forEach((x) => out.push(String(x).trim()));
      else out.push(String(val).trim());
    }
    return Array.from(new Set(out.filter(Boolean)));
  };

  const getContractRoleObj = (selectedContractRole) =>
    availableRoles.find((r) => String(r.role) === String(selectedContractRole));

  const getTechnologyOptionsForRow = (row) => {
    const cr = getContractRoleObj(row.selectedContractRole);
    return getTechnologyOptionsFromContractRole(cr);
  };

  // --------------------------- HANDLERS ---------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "title") titleTouchedRef.current = true;

    if (name === "type") {
      setForm((prev) => ({ ...prev, type: value }));

      setRoles((prev) => {
        const limit = value === "MULTI" ? 4 : value === "TEAM" ? Infinity : 1;
        if (prev.length <= limit) return prev;
        return prev.slice(0, limit);
      });

      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectSelect = (e) => {
    const selectedValue = e.target.value;

    const proj = projects.find(
      (p) =>
        String(p.projectId) === String(selectedValue) ||
        String(p.id) === String(selectedValue)
    );

    setSelectedProject(proj || null);

    setForm((prev) => ({
      ...prev,
      projectId: proj?.projectId || "",
      projectName: proj?.projectDescription || proj?.projectId || "",

      title: titleTouchedRef.current
        ? prev.title
        : proj?.projectDescription || proj?.projectId || "",

      startDate: proj?.projectStart || prev.startDate,
      endDate: proj?.projectEnd || prev.endDate,
      taskDescription: proj?.taskDescription || prev.taskDescription,

      furtherInformation:
        prev.furtherInformation ||
        (proj?.selectedSkills?.length ? `Skills: ${proj.selectedSkills.join(", ")}` : ""),
    }));
  };

  const handleContractSelect = (e) => {
    const contractId = e.target.value;
    const contract = contracts.find((c) => String(c.id) === String(contractId));

    setSelectedContract(contract || null);
    setAvailableRoles(contract?.roles || []);

    setForm((prev) => ({
      ...prev,
      contractId: contract?.id ? String(contract.id) : "",
      contractSupplier: contract?.supplier || "",
    }));
  };

  const handleRoleContractSelect = (index, selectedRoleName) => {
    if (!selectedContract) {
      toast.warning("Select a contract first.");
      return;
    }

    setRoles((prev) => {
      const updated = [...prev];
      const cr = availableRoles.find((r) => String(r.role) === String(selectedRoleName));

      const techOptions = getTechnologyOptionsFromContractRole(cr);
      const defaultTech = techOptions[0] || "";

      updated[index] = {
        ...updated[index],
        selectedContractRole: selectedRoleName,
        roleName: cr?.role || selectedRoleName || "",
        experienceLevel: cr?.experience || "",
        domain: selectedContract?.domain || "",
        technology: defaultTech,
      };

      return updated;
    });
  };

  const handleRoleFieldChange = (index, field, value) => {
    setRoles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addRoleRow = () => {
    if (!(form.type === "MULTI" || form.type === "TEAM")) {
      toast.info("Add Role is only available for Multi or Team requests.");
      return;
    }
    if (!canAddRole) return;
    setRoles((prev) => [...prev, emptyRoleRow()]);
  };

  const removeRoleRow = (index) => {
    if (roles.length === 1) return;
    setRoles((prev) => prev.filter((_, i) => i !== index));
  };

  // --------------------------- RESET FORM ---------------------------
  const resetForm = () => {
    localStorage.removeItem(STORAGE_KEY);
    titleTouchedRef.current = false;
    setEditingId(null);
    setSelectedProject(null);
    setSelectedContract(null);
    setAvailableRoles([]);
    setRoles([emptyRoleRow()]);
    setForm({
      title: "",
      type: "SINGLE",
      projectId: "",
      projectName: "",
      contractId: "",
      contractSupplier: "",
      startDate: "",
      endDate: "",
      performanceLocation: "",
      maxOffers: "",
      maxAcceptedOffers: "",
      biddingCycleDays: 7,
      requiredLanguagesInput: "",
      must1: "",
      must2: "",
      must3: "",
      nice1: "",
      nice2: "",
      nice3: "",
      nice4: "",
      nice5: "",
      taskDescription: "",
      furtherInformation: "",
    });
  };

  // --------------------------- EDIT (PREFILL) ---------------------------
  const startEdit = (req) => {
    if (req.status !== "DRAFT") {
      toast.info("Only DRAFT requests can be edited.");
      return;
    }

    setActiveTab("create");
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    setEditingId(req.id);

    const contract = contracts.find((c) => String(c.id) === String(req.contractId));
    setSelectedContract(contract || null);
    setAvailableRoles(contract?.roles || []);

    const proj = projects.find(
      (p) =>
        String(p.projectId) === String(req.projectId) ||
        String(p.id) === String(req.projectId)
    );
    setSelectedProject(proj || null);

    titleTouchedRef.current = true;

    setForm({
      title: req.title || "",
      type: req.type || "SINGLE",

      projectId: req.projectId || "",
      projectName: req.projectName || "",
      contractId: req.contractId ? String(req.contractId) : "",
      contractSupplier: req.contractSupplier || "",

      startDate: req.startDate || "",
      endDate: req.endDate || "",
      performanceLocation: req.performanceLocation || "",
      maxOffers: req.maxOffers ?? "",
      maxAcceptedOffers: req.maxAcceptedOffers ?? "",

      biddingCycleDays: req.biddingCycleDays ?? 7,

      requiredLanguagesInput: (req.requiredLanguages || []).join(", "),
      must1: req.mustHaveCriteria?.[0] || "",
      must2: req.mustHaveCriteria?.[1] || "",
      must3: req.mustHaveCriteria?.[2] || "",
      nice1: req.niceToHaveCriteria?.[0] || "",
      nice2: req.niceToHaveCriteria?.[1] || "",
      nice3: req.niceToHaveCriteria?.[2] || "",
      nice4: req.niceToHaveCriteria?.[3] || "",
      nice5: req.niceToHaveCriteria?.[4] || "",
      taskDescription: req.taskDescription || "",
      furtherInformation: req.furtherInformation || "",
    });

    const reqRoles =
      Array.isArray(req.roles) && req.roles.length > 0 ? req.roles : [emptyRoleRow()];

    setRoles(
      reqRoles.map((r) => ({
        selectedContractRole: r.roleName || "",
        domain: r.domain || "",
        roleName: r.roleName || "",
        technology: r.technology || "",
        experienceLevel: r.experienceLevel || "",
        manDays: r.manDays ?? "",
        onsiteDays: r.onsiteDays ?? "",
      }))
    );

    toast.info("Editing draft request...");
  };

  // --------------------------- CREATE / UPDATE ---------------------------
  const buildPayload = () => ({
    title: form.title,
    type: form.type,

    projectId: form.projectId || null,
    projectName: form.projectName || null,
    contractId: form.contractId || null,
    contractSupplier: form.contractSupplier || null,

    startDate: form.startDate || null,
    endDate: form.endDate || null,
    performanceLocation: form.performanceLocation || null,

    maxOffers: numOrNull(form.maxOffers),
    maxAcceptedOffers: numOrNull(form.maxAcceptedOffers),

    biddingCycleDays: Number(form.biddingCycleDays),

    taskDescription: form.taskDescription || "",
    furtherInformation: form.furtherInformation || "",

    requiredLanguages: (form.requiredLanguagesInput || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),

    mustHaveCriteria: [form.must1, form.must2, form.must3].filter(Boolean),
    niceToHaveCriteria: [form.nice1, form.nice2, form.nice3, form.nice4, form.nice5].filter(Boolean),

    roles: roles.map((r) => ({
      domain: r.domain || null,
      roleName: r.roleName || null,
      technology: r.technology || null,
      experienceLevel: r.experienceLevel || null,
      manDays: numOrNull(r.manDays),
      onsiteDays: numOrNull(r.onsiteDays),
    })),
  });

  const saveRequest = async (e) => {
    e.preventDefault();
    const payload = buildPayload();

    try {
      if (editingId) {
        await API.put(`/requests/${editingId}`, payload);
        toast.success("Draft updated successfully!");
      } else {
        await API.post("/requests", payload);
        toast.success("Request created successfully!");
      }

      await loadRequests();
      resetForm();
      setActiveTab("list");
    } catch (err) {
      console.error(err);
      toast.error(editingId ? "Failed to update draft." : "Failed to create request.");
    }
  };

  const submitForReview = async (id) => {
    try {
      await API.put(`/requests/${id}/submit`);
      toast.success("Request submitted for review!");
      loadRequests();
    } catch (err) {
      toast.error("Failed to submit request.");
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this draft request?")) return;
    try {
      await API.delete(`/requests/${id}`);
      toast.success("Request deleted.");
      loadRequests();
    } catch (err) {
      toast.error("Failed to delete request.");
    }
  };

  // --------------------------- UI Helpers ---------------------------
  const statusBadgeClass = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-slate-100 text-slate-700";
      case "IN_REVIEW":
        return "bg-amber-100 text-amber-800";
      case "APPROVED_FOR_BIDDING":
        return "bg-blue-100 text-blue-800";
      case "BIDDING":
        return "bg-purple-100 text-purple-800";
      case "ORDERED":
        return "bg-emerald-100 text-emerald-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const projectLabel = (req) => (req.projectId ? `${req.projectId} – ${req.projectName || ""}` : "-");
  const contractLabel = (req) => (req.contractId ? `${req.contractSupplier || ""} – ${req.contractId}` : "-");

  const filteredRequests = useMemo(() => {
    const list = requests || [];
    const q = query.trim().toLowerCase();

    return list.filter((r) => {
      const statusOk = statusFilter === "ALL" ? true : r.status === statusFilter;

      if (!q) return statusOk;

      const hay = [
        srLabel(r),
        r.title,
        r.type,
        r.status,
        String(r.projectId || ""),
        String(r.projectName || ""),
        String(r.contractId || ""),
        String(r.contractSupplier || ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return statusOk && hay.includes(q);
    });
  }, [requests, query, statusFilter]);

  const statusCounts = useMemo(() => {
    const map = {};
    (requests || []).forEach((r) => {
      map[r.status] = (map[r.status] || 0) + 1;
    });
    return map;
  }, [requests]);

  const TabBtn = ({ value, label, right }) => {
    const active = activeTab === value;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(value)}
        className={
          "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition " +
          (active
            ? "bg-slate-900 text-white border-slate-900"
            : "bg-white/70 text-slate-700 border-slate-200 hover:bg-white")
        }
      >
        {label}
        {right}
      </button>
    );
  };

  // --------------------------- RENDER ---------------------------
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100">
        <div className="p-4 sm:p-6">
          <TopNav />

          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Service Requests
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Create requests, edit drafts, submit for review, and track all statuses.
              </p>
            </div>

            {editingId && (
              <div className="text-slate-700 text-sm">
                Editing Draft ID: <b>{editingId}</b>
              </div>
            )}
          </div>

          {/* Sticky header + tabs */}
          <div className="sticky top-0 z-20 pt-2 pb-4 mb-4">
            <div className="bg-gradient-to-b from-slate-50/95 via-slate-50/85 to-transparent backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm px-3 py-3">
              <div className="flex items-center gap-2">
                <TabBtn value="create" label={editingId ? "Edit Draft" : "Create Request"} />
                <TabBtn
                  value="list"
                  label="Requests List"
                  right={
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {requests.length}
                    </span>
                  }
                />
              </div>

              {editingId && (
                <div className="mt-2 text-xs text-slate-600">
                  Editing Draft ID: <b className="text-slate-900">{editingId}</b>
                </div>
              )}
            </div>
          </div>

          {/* CREATE / UPDATE TAB */}
          {activeTab === "create" && (
            <>
              <div ref={formTopRef} />

              <form
                onSubmit={saveRequest}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 mb-8 space-y-5"
              >
                {/* TITLE + TYPE */}
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <label className="text-xs text-slate-600">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                      placeholder="Request title…"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Selecting a project auto-fills the title until you edit it.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Request Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    >
                      <option value="SINGLE">Single</option>
                      <option value="MULTI">Multi</option>
                      <option value="TEAM">Team</option>
                      <option value="WORK_CONTRACT">Work Contract</option>
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Max role rows: {maxRoleRows === Infinity ? "Unlimited" : maxRoleRows}
                    </p>
                  </div>
                </div>

                {/* PROJECT / CONTRACT / DATES */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="text-xs text-slate-600">Project</label>
                    {/* ✅ FIX: use form.projectId so it stays selected after refresh */}
                    <select
                      value={form.projectId || ""}
                      onChange={handleProjectSelect}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    >
                      <option value="">-- Select project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.projectId || p.id}>
                          {p.projectId} – {p.projectDescription}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Contract</label>
                    <select
                      value={form.contractId}
                      onChange={handleContractSelect}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    >
                      <option value="">-- Select contract --</option>
                      {contracts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.supplier} – {c.domain}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    />
                  </div>
                </div>

                {/* LOCATION / OFFERS / CYCLE */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="text-xs text-slate-600">Performance Location</label>
                    <input
                      type="text"
                      name="performanceLocation"
                      value={form.performanceLocation}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Max Offers</label>
                    <input
                      type="number"
                      name="maxOffers"
                      value={form.maxOffers}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Max Accepted Offers</label>
                    <input
                      type="number"
                      name="maxAcceptedOffers"
                      value={form.maxAcceptedOffers}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Bidding Cycle</label>
                    <select
                      name="biddingCycleDays"
                      value={form.biddingCycleDays}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    >
                      <option value={0}>0 Days (Test)</option>
                      <option value={1}>1 Day (Test)</option>
                      <option value={3}>3 Days</option>
                      <option value={7}>1 Week</option>
                      <option value={14}>2 Weeks</option>
                      <option value={21}>3 Weeks</option>
                      <option value={30}>1 Month</option>
                    </select>
                  </div>
                </div>

                {/* ROLES */}
                <div className="mt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800">Requested Roles</h2>
                      <p className="text-xs text-slate-500">
                        Add Role only for <b>Multi</b> or <b>Team</b>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addRoleRow}
                      disabled={!(form.type === "MULTI" || form.type === "TEAM") || !canAddRole}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        (!(form.type === "MULTI" || form.type === "TEAM") || !canAddRole)
                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                      }`}
                    >
                      + Add Role ({roles.length}/{maxRoleRows === Infinity ? "∞" : maxRoleRows})
                    </button>
                  </div>

                  <div className="space-y-3">
                    {roles.map((r, index) => {
                      const techOptions = getTechnologyOptionsForRow(r);

                      return (
                        <div key={index} className="bg-white rounded-2xl border border-slate-200 p-3">
                          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-7">
                            <div className="xl:col-span-2">
                              <label className="text-[11px] text-slate-500">Contract Role</label>
                              <select
                                value={r.selectedContractRole}
                                onChange={(e) => handleRoleContractSelect(index, e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                                disabled={!selectedContract}
                              >
                                <option value="">
                                  {selectedContract ? "-- select --" : "Select contract first"}
                                </option>

                                {availableRoles.map((cr) => (
                                  <option key={cr.role} value={cr.role}>
                                    {cr.role} ({cr.experience})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500">Domain</label>
                              <input
                                type="text"
                                value={r.domain}
                                onChange={(e) => handleRoleFieldChange(index, "domain", e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500">Role</label>
                              <input
                                type="text"
                                value={r.roleName}
                                onChange={(e) => handleRoleFieldChange(index, "roleName", e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500">Technology</label>
                              <select
                                value={r.technology}
                                onChange={(e) => handleRoleFieldChange(index, "technology", e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                                disabled={!r.selectedContractRole}
                              >
                                <option value="">
                                  {r.selectedContractRole ? "-- select --" : "Select role first"}
                                </option>
                                {techOptions.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500">Experience</label>
                              <input
                                type="text"
                                value={r.experienceLevel}
                                onChange={(e) => handleRoleFieldChange(index, "experienceLevel", e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                              />
                            </div>

                            <div>
                              <label className="text-[11px] text-slate-500">Man Days</label>
                              <input
                                type="number"
                                value={r.manDays}
                                onChange={(e) => handleRoleFieldChange(index, "manDays", e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                              />
                            </div>

                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="text-[11px] text-slate-500">Onsite Days</label>
                                <input
                                  type="number"
                                  value={r.onsiteDays}
                                  onChange={(e) => handleRoleFieldChange(index, "onsiteDays", e.target.value)}
                                  className="w-full border border-slate-200 rounded-xl px-2 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                                />
                              </div>

                              {roles.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRoleRow(index)}
                                  className="text-red-600 text-xs font-semibold px-2 py-2"
                                  title="Remove role"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LANGUAGES */}
                <div>
                  <label className="text-xs text-slate-600">Required Languages (comma separated)</label>
                  <input
                    type="text"
                    name="requiredLanguagesInput"
                    value={form.requiredLanguagesInput}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                  />
                </div>

                {/* CRITERIA */}
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Must-have criteria</p>
                    {[form.must1, form.must2, form.must3].map((value, i) => (
                      <input
                        key={i}
                        type="text"
                        name={`must${i + 1}`}
                        value={value}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                      />
                    ))}
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 mb-1">Nice-to-have criteria</p>
                    {[form.nice1, form.nice2, form.nice3, form.nice4, form.nice5].map((value, i) => (
                      <input
                        key={i}
                        type="text"
                        name={`nice${i + 1}`}
                        value={value}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                      />
                    ))}
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                  <div>
                    <label className="text-xs text-slate-600">Task Description</label>
                    <textarea
                      name="taskDescription"
                      value={form.taskDescription}
                      onChange={handleChange}
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Further Information</label>
                    <textarea
                      name="furtherInformation"
                      value={form.furtherInformation}
                      onChange={handleChange}
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    />
                  </div>
                </div>

                {/* ACTION BUTTONS */}
<div className="flex justify-end gap-2">
  {/* Always available */}
  <button
    type="button"
    onClick={resetForm}
    className="px-5 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 border border-slate-200"
  >
    Clear Draft
  </button>

  {/* Only shows if editing */}
  {editingId && (
    <button
      type="button"
      onClick={resetForm}
      className="px-5 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 border border-slate-200"
    >
      Cancel Edit
    </button>
  )}

  <button
    type="submit"
    className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
  >
    {editingId ? "Update Draft" : "Create Request"}
  </button>
</div>

              </form>
            </>
          )}

          {/* LIST TAB */}
          {activeTab === "list" && (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm ring-1 ring-slate-200 p-4">
              {/* List controls */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by SR, title, project, contract, status..."
                    className="w-full sm:w-[360px] border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-[220px] border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                  >
                    <option value="ALL">All statuses</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="IN_REVIEW">IN_REVIEW</option>
                    <option value="APPROVED_FOR_BIDDING">APPROVED_FOR_BIDDING</option>
                    <option value="BIDDING">BIDDING</option>
                    <option value="ORDERED">ORDERED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-slate-600">
                    Showing <b>{filteredRequests.length}</b> of <b>{requests.length}</b>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter("ALL");
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={() => loadRequests()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {/* Status summary chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {["DRAFT", "IN_REVIEW", "APPROVED_FOR_BIDDING", "BIDDING", "ORDERED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={
                      "text-xs font-semibold px-3 py-1.5 rounded-full border transition " +
                      (statusFilter === s
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50")
                    }
                    title="Filter"
                  >
                    {s}{" "}
                    <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {statusCounts[s] || 0}
                    </span>
                  </button>
                ))}
              </div>

              {/* Table */}
              {loading ? (
                <p className="text-slate-600">Loading...</p>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="min-w-[1000px] w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th className="py-2.5 px-3">Request No</th>
                        <th className="py-2.5 px-3">Title</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Contract</th>
                        <th className="py-2.5 px-3">#Roles</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRequests.map((r) => (
                        <tr key={r.id} className="hover:bg-sky-50/60 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {srLabel(r)}
                          </td>

                          <td className="py-2.5 px-3">{r.title}</td>
                          <td className="py-2.5 px-3">{r.type}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={
                                "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold " +
                                statusBadgeClass(r.status)
                              }
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">{projectLabel(r)}</td>
                          <td className="py-2.5 px-3">{contractLabel(r)}</td>
                          <td className="py-2.5 px-3">{r.roles?.length || 0}</td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              {/* ✅ FIX: Details opens request details tab */}
                              <button
                                onClick={() => navigate(`/requests/${r.id}?tab=details`)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow"
                              >
                                Details
                              </button>

                              {/* ✅ NEW: View Offers opens offers tab */}
                              <button
                                onClick={() => navigate(`/requests/${r.id}?tab=offers`)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow"
                              >
                                View Offers
                              </button>

                              {r.status === "DRAFT" && (
                                <>
                                  <button
                                    onClick={() => startEdit(r)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => deleteRequest(r.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow"
                                  >
                                    Delete
                                  </button>

                                  <button
                                    onClick={() => submitForReview(r.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow"
                                  >
                                    Submit
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredRequests.length === 0 && (
                        <tr>
                          <td className="text-center py-8 text-slate-500" colSpan={8}>
                            No requests match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
