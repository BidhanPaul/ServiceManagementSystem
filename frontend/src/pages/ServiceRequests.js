<<<<<<< HEAD
import { FiClock, FiCheckCircle, FiBell } from "react-icons/fi";
import { memo, useMemo } from "react";

function formatDate(isoString) {
    if (!isoString) return "";
    const d = new Date(isoString);
    return d.toLocaleString();
=======
// src/pages/ServiceRequests.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

/**
 * Centralized defaults to reduce duplication and keep resets consistent.
 * (No behavior change—just cleaner state management.)
 */
const INITIAL_FORM = {
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
};

const emptyRoleRow = () => ({
    selectedContractRole: "",
    domain: "",
    roleName: "",
    technology: "",
    experienceLevel: "",
    manDays: "",
    onsiteDays: "",
});

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

    // Prevent toast spam
    const didToastProjectsLoaded = useRef(false);
    const didToastContractsLoaded = useRef(false);

    // Track if user edited title manually
    const titleTouchedRef = useRef(false);

    const [form, setForm] = useState(INITIAL_FORM);
    const [roles, setRoles] = useState([emptyRoleRow()]);

    // -------- limits --------
    const maxRoleRows = useMemo(() => {
        if (form.type === "MULTI") return 4;
        if (form.type === "TEAM") return Infinity;
        return 1;
    }, [form.type]);

    const canAddRole = roles.length < maxRoleRows;

    // --------------------------- LOAD DATA ---------------------------
    const loadRequests = useCallback(async () => {
        try {
            const res = await API.get("/requests");
            setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to load requests", err);
            toast.error("Failed to load requests.");
            setRequests([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadProjects = useCallback(async () => {
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
    }, []);

    const loadContracts = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        loadRequests();
        loadProjects();
        loadContracts();
    }, [loadRequests, loadProjects, loadContracts]);

    // --------------------------- HELPERS ---------------------------
    const numOrNull = (v) => (v === "" ? null : Number(v));

    // ✅ SR label helper (backend requestNumber preferred)
    const srLabel = (req) => {
        if (!req) return "-";
        const rn = req.requestNumber != null ? String(req.requestNumber).trim() : "";
        if (rn) return rn;
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
                (proj?.selectedSkills?.length
                    ? `Skills: ${proj.selectedSkills.join(", ")}`
                    : ""),
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
            const cr = availableRoles.find(
                (r) => String(r.role) === String(selectedRoleName)
            );

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
        titleTouchedRef.current = false;
        setEditingId(null);
        setSelectedProject(null);
        setSelectedContract(null);
        setAvailableRoles([]);
        setRoles([emptyRoleRow()]);
        setForm(INITIAL_FORM);
    };

    // --------------------------- EDIT (PREFILL) ---------------------------
    const startEdit = (req) => {
        if (req.status !== "DRAFT") {
            toast.info("Only DRAFT requests can be edited.");
            return;
        }

        setEditingId(req.id);

        // preselect contract in UI (loads roles dropdown)
        const contract = contracts.find(
            (c) => String(c.id) === String(req.contractId)
        );
        setSelectedContract(contract || null);
        setAvailableRoles(contract?.roles || []);

        // preselect project in UI
        const proj = projects.find(
            (p) =>
                String(p.projectId) === String(req.projectId) ||
                String(p.id) === String(req.projectId)
        );
        setSelectedProject(proj || null);

        titleTouchedRef.current = true;

        setForm({
            ...INITIAL_FORM,
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
            Array.isArray(req.roles) && req.roles.length > 0
                ? req.roles
                : [emptyRoleRow()];

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
        niceToHaveCriteria: [
            form.nice1,
            form.nice2,
            form.nice3,
            form.nice4,
            form.nice5,
        ].filter(Boolean),

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
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const projectLabel = (req) =>
        req.projectId ? `${req.projectId} – ${req.projectName || ""}` : "-";
    const contractLabel = (req) =>
        req.contractId ? `${req.contractSupplier || ""} – ${req.contractId}` : "-";

    // --------------------------- RENDER ---------------------------
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <div className="flex-1 bg-gradient-to-b from-blue-200 to-blue-400">
                <div className="p-4 sm:p-6">
                    <TopNav />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">
                            Service Requests
                        </h1>

                        {editingId && (
                            <div className="text-white/90 text-sm">
                                Editing Draft ID: <b>{editingId}</b>
                            </div>
                        )}
                    </div>

                    {/* CREATE / UPDATE FORM */}
                    <form
                        onSubmit={saveRequest}
                        className="bg-white/90 rounded-2xl shadow-lg p-4 sm:p-6 mb-8 space-y-5"
                    >
                        {/* TITLE + TYPE */}
                        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <label className="text-xs text-gray-600">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                    placeholder="Request title…"
                                    required
                                />
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Selecting a project auto-fills the title until you edit it.
                                </p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">Request Type</label>
                                <select
                                    name="type"
                                    value={form.type}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="SINGLE">Single</option>
                                    <option value="MULTI">Multi</option>
                                    <option value="TEAM">Team</option>
                                    <option value="WORK_CONTRACT">Work Contract</option>
                                </select>
                                <p className="text-[11px] text-gray-500 mt-1">
                                    Max role rows: {maxRoleRows === Infinity ? "Unlimited" : maxRoleRows}
                                </p>
                            </div>
                        </div>

                        {/* PROJECT / CONTRACT / DATES */}
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <label className="text-xs text-gray-600">Project</label>
                                <select
                                    value={selectedProject?.projectId || ""}
                                    onChange={handleProjectSelect}
                                    className="w-full border rounded-lg px-3 py-2"
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
                                <label className="text-xs text-gray-600">Contract</label>
                                <select
                                    value={form.contractId}
                                    onChange={handleContractSelect}
                                    className="w-full border rounded-lg px-3 py-2"
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
                                <label className="text-xs text-gray-600">Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={form.startDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">End Date</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={form.endDate}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* LOCATION / OFFERS / CYCLE */}
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                            <div>
                                <label className="text-xs text-gray-600">Performance Location</label>
                                <input
                                    type="text"
                                    name="performanceLocation"
                                    value={form.performanceLocation}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">Max Offers</label>
                                <input
                                    type="number"
                                    name="maxOffers"
                                    value={form.maxOffers}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">Max Accepted Offers</label>
                                <input
                                    type="number"
                                    name="maxAcceptedOffers"
                                    value={form.maxAcceptedOffers}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">Bidding Cycle</label>
                                <select
                                    name="biddingCycleDays"
                                    value={form.biddingCycleDays}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-2"
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
                                    <h2 className="text-sm font-semibold text-gray-700">Requested Roles</h2>
                                    <p className="text-xs text-gray-500">
                                        Add Role only for <b>Multi</b> or <b>Team</b>.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={addRoleRow}
                                    disabled={!(form.type === "MULTI" || form.type === "TEAM") || !canAddRole}
                                    className={`text-xs px-3 py-1.5 rounded-full ${(!(form.type === "MULTI" || form.type === "TEAM") || !canAddRole)
                                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-100 text-blue-700"
                                        }`}
                                >
                                    + Add Role ({roles.length}/{maxRoleRows === Infinity ? "∞" : maxRoleRows})
                                </button>
                            </div>

                            <div className="space-y-3">
                                {roles.map((r, index) => {
                                    const techOptions = getTechnologyOptionsForRow(r);

                                    return (
                                        <div key={index} className="bg-white rounded-xl border p-3">
                                            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-7">
                                                <div className="xl:col-span-2">
                                                    <label className="text-[11px] text-gray-500">Contract Role</label>
                                                    <select
                                                        value={r.selectedContractRole}
                                                        onChange={(e) => handleRoleContractSelect(index, e.target.value)}
                                                        className="w-full border rounded-lg px-2 py-2 text-sm"
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
                                                    <label className="text-[11px] text-gray-500">Domain</label>
                                                    <input
                                                        type="text"
                                                        value={r.domain}
                                                        onChange={(e) =>
                                                            handleRoleFieldChange(index, "domain", e.target.value)
                                                        }
                                                        className="w-full border rounded-lg px-2 py-2"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] text-gray-500">Role</label>
                                                    <input
                                                        type="text"
                                                        value={r.roleName}
                                                        onChange={(e) =>
                                                            handleRoleFieldChange(index, "roleName", e.target.value)
                                                        }
                                                        className="w-full border rounded-lg px-2 py-2"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] text-gray-500">Technology</label>
                                                    <select
                                                        value={r.technology}
                                                        onChange={(e) =>
                                                            handleRoleFieldChange(index, "technology", e.target.value)
                                                        }
                                                        className="w-full border rounded-lg px-2 py-2 text-sm"
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
                                                    <label className="text-[11px] text-gray-500">Experience</label>
                                                    <input
                                                        type="text"
                                                        value={r.experienceLevel}
                                                        onChange={(e) =>
                                                            handleRoleFieldChange(index, "experienceLevel", e.target.value)
                                                        }
                                                        className="w-full border rounded-lg px-2 py-2"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[11px] text-gray-500">Man Days</label>
                                                    <input
                                                        type="number"
                                                        value={r.manDays}
                                                        onChange={(e) =>
                                                            handleRoleFieldChange(index, "manDays", e.target.value)
                                                        }
                                                        className="w-full border rounded-lg px-2 py-2"
                                                    />
                                                </div>

                                                <div className="flex items-end gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[11px] text-gray-500">Onsite Days</label>
                                                        <input
                                                            type="number"
                                                            value={r.onsiteDays}
                                                            onChange={(e) =>
                                                                handleRoleFieldChange(index, "onsiteDays", e.target.value)
                                                            }
                                                            className="w-full border rounded-lg px-2 py-2"
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
                            <label className="text-xs text-gray-600">
                                Required Languages (comma separated)
                            </label>
                            <input
                                type="text"
                                name="requiredLanguagesInput"
                                value={form.requiredLanguagesInput}
                                onChange={handleChange}
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>

                        {/* CRITERIA */}
                        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                            <div>
                                <p className="text-xs text-gray-600 mb-1">Must-have criteria</p>
                                {[form.must1, form.must2, form.must3].map((value, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        name={`must${i + 1}`}
                                        value={value}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-2 mb-2"
                                    />
                                ))}
                            </div>

                            <div>
                                <p className="text-xs text-gray-600 mb-1">Nice-to-have criteria</p>
                                {[form.nice1, form.nice2, form.nice3, form.nice4, form.nice5].map(
                                    (value, i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            name={`nice${i + 1}`}
                                            value={value}
                                            onChange={handleChange}
                                            className="w-full border rounded-lg px-3 py-2 mb-2"
                                        />
                                    )
                                )}
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                            <div>
                                <label className="text-xs text-gray-600">Task Description</label>
                                <textarea
                                    name="taskDescription"
                                    value={form.taskDescription}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-gray-600">Further Information</label>
                                <textarea
                                    name="furtherInformation"
                                    value={form.furtherInformation}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300"
                                >
                                    Cancel Edit
                                </button>
                            )}

                            <button
                                type="submit"
                                className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                            >
                                {editingId ? "Update Draft" : "Create Request"}
                            </button>
                        </div>
                    </form>

                    {/* REQUEST LIST */}
                    {loading ? (
                        <p className="text-white/80">Loading...</p>
                    ) : (
                        <div className="bg-white/90 rounded-2xl shadow-lg p-4 overflow-x-auto">
                            <table className="min-w-[1000px] w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="py-2">Request No</th>
                                        <th className="py-2">Title</th>
                                        <th className="py-2">Type</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Project</th>
                                        <th className="py-2">Contract</th>
                                        <th className="py-2">#Roles</th>
                                        <th className="py-2 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {requests.map((r) => (
                                        <tr key={r.id} className="border-b last:border-0">
                                            <td className="py-2 font-semibold text-slate-800">
                                                {srLabel(r)}
                                            </td>

                                            <td className="py-2">{r.title}</td>
                                            <td className="py-2">{r.type}</td>
                                            <td className="py-2">
                                                <span
                                                    className={
                                                        "inline-flex px-2 py-0.5 rounded-full text-xs font-medium " +
                                                        statusBadgeClass(r.status)
                                                    }
                                                >
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="py-2">{projectLabel(r)}</td>
                                            <td className="py-2">{contractLabel(r)}</td>
                                            <td className="py-2">{r.roles?.length || 0}</td>

                                            <td className="py-2 text-right space-x-2 flex justify-end">
                                                <button
                                                    onClick={() => navigate(`/requests/${r.id}`)}
                                                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow"
                                                >
                                                    Details
                                                </button>

                                                {r.status === "DRAFT" && (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(r)}
                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-yellow-500 text-white hover:bg-yellow-600 shadow"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            onClick={() => deleteRequest(r.id)}
                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow"
                                                        >
                                                            Delete
                                                        </button>

                                                        <button
                                                            onClick={() => submitForReview(r.id)}
                                                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 shadow"
                                                        >
                                                            Submit
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}

                                    {requests.length === 0 && (
                                        <tr>
                                            <td className="text-center py-4 text-gray-500" colSpan={8}>
                                                No requests yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
>>>>>>> a754dd336a0bcf16b24b12d440f01f9c75f242e3
}

const EmptyState = memo(function EmptyState() {
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center gap-3 text-gray-600">
                <div className="bg-blue-100 p-3 rounded-full">
                    <FiBell className="text-blue-700 text-xl" />
                </div>
                <span className="text-gray-700 font-medium">
                    No notifications yet.
                </span>
            </div>
        </div>
    );
});

const NotificationItem = memo(function NotificationItem({
    notification,
    isLast,
    onMarkAsRead,
}) {
    const { id, message, sentAt, read } = notification;

    return (
        <div
            className={`mb-7 pl-4 relative transition-all ${isLast ? "mb-2" : ""
                }`}
        >
            {/* Timeline Dot */}
            <span
                className={`w-3.5 h-3.5 rounded-full absolute -left-[10px] top-1.5 border-2 ${read
                        ? "bg-white border-blue-300"
                        : "bg-blue-600 border-blue-700 shadow-md"
                    }`}
            />

            {/* Card Content */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 bg-white/70 rounded-xl shadow-sm border border-white/50">
                <div>
                    <p
                        className={`text-sm md:text-base font-medium ${read ? "text-gray-500" : "text-gray-800"
                            }`}
                    >
                        {message}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <FiClock className="text-gray-400" />
                        <span>{formatDate(sentAt)}</span>
                    </div>
                </div>

                {!read && (
                    <button
                        onClick={() => onMarkAsRead(id)}
                        className="
              flex items-center gap-2
              px-3 py-1.5 rounded-full text-xs font-semibold
              bg-blue-600 text-white
              hover:bg-blue-700 hover:shadow-md
              transition-all
            "
                    >
                        <FiCheckCircle className="text-sm" />
                        Mark as read
                    </button>
                )}
            </div>
        </div>
    );
});

const NotificationList = ({ notifications, onMarkAsRead }) => {
    const hasNotifications = useMemo(
        () => Array.isArray(notifications) && notifications.length > 0,
        [notifications]
    );

    if (!hasNotifications) {
        return <EmptyState />;
    }

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            {/* Title */}
            <div className="flex items-center gap-3 mb-5">
                <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                    <FiBell className="text-blue-700 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                    Admin Activity Timeline
                </h2>
            </div>

            {/* Timeline */}
            <div className="relative pl-6 border-l-2 border-blue-200">
                {notifications.map((n, idx) => (
                    <NotificationItem
                        key={n.id}
                        notification={n}
                        isLast={idx === notifications.length - 1}
                        onMarkAsRead={onMarkAsRead}
                    />
                ))}
            </div>
        </div>
    );
};

export default memo(NotificationList);
