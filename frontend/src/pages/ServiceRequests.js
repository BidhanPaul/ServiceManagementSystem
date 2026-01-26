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

  // ✅ NEW: project-derived dropdown data (Group-1)
  const [projectMeta, setProjectMeta] = useState({
    locations: [],
    skills: [],
    roles: [],
    normalized: null,
  });

  // EDIT MODE
  const [editingId, setEditingId] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("create");

  // List controls
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const didToastProjectsLoaded = useRef(false);
  const didToastContractsLoaded = useRef(false);

  // Track if user edited title manually
  const titleTouchedRef = useRef(false);

  // Track if user edited roles manually (prevents overwriting)
  const rolesTouchedRef = useRef(false);

  // ✅ Track if user edited auto-filled fields manually (so project reselect can update correctly)
  const taskTouchedRef = useRef(false);
  const furtherTouchedRef = useRef(false);
  const startTouchedRef = useRef(false);
  const endTouchedRef = useRef(false);
  const locationTouchedRef = useRef(false);

  // ✅ Track if user edited domain manually (so contract reselect can update domain safely)
  const domainTouchedRef = useRef(false);

  // ✅ Track last auto-filled values so project reselect updates fields
  // only when the field is still "auto-filled" (or empty).
  const autoFillRef = useRef({
    title: "",
    startDate: "",
    endDate: "",
    performanceLocation: "",
    taskDescription: "",
    furtherInformation: "",
  });

  const shouldOverwrite = (currentValue, lastAutoValue) => {
    const cur = (currentValue ?? "").toString();
    const last = (lastAutoValue ?? "").toString();
    // overwrite if empty OR still equals previous auto-fill value
    return cur.trim() === "" || (last && cur === last);
  };

  const formTopRef = useRef(null);
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState({
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

  const emptyRoleRow = () => ({
    // keep old key name for backward compatibility w/ localStorage
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

  // --------------------------- SAFE UNWRAP + KEY HELPERS ---------------------------
  // ✅ Robust unwrap: handles many response shapes so dropdowns don't stay empty
  const unwrapArray = (body, keys = []) => {
    if (!body) return [];

    // direct array
    if (Array.isArray(body)) return body;

    // common shapes
    if (Array.isArray(body.data)) return body.data;
    if (Array.isArray(body?.data?.data)) return body.data.data;
    if (Array.isArray(body?.data?.items)) return body.data.items;

    // named keys
    for (const k of keys) {
      if (Array.isArray(body?.[k])) return body[k];
      if (Array.isArray(body?.data?.[k])) return body.data[k];
      if (Array.isArray(body?.data?.data?.[k])) return body.data.data[k];
    }

    // shallow search fallback
    const candidates = [body, body.data, body.data?.data].filter(Boolean);
    for (const obj of candidates) {
      if (obj && typeof obj === "object") {
        for (const v of Object.values(obj)) {
          if (Array.isArray(v)) return v;
        }
      }
    }

    return [];
  };

  // projects (Group-1) often: {projectId, id, projectDescription}
  const projectValueOf = (p, idx) => p?.projectId || p?.id || p?._id || String(idx);
  const projectLeftOf = (p, idx) => p?.projectId || p?.id || p?._id || String(idx);
  const projectRightOf = (p) =>
    p?.projectDescription || p?.projectName || p?.title || p?.name || "-";

  // contracts (Group-2) sample: {_id, contractType, workflow...provider.name}
  const contractValueOf = (c, idx) => c?.id || c?._id || c?.referenceNumber || String(idx);
  const contractSupplierOf = (c) =>
    c?.supplier ||
    c?.contractSupplier ||
    c?.supplierName ||
    c?.providerName ||
    c?.workflow?.coordinator?.selectedOffer?.provider?.name ||
    c?.title ||
    c?.referenceNumber ||
    "-";

  // ✅ contractType as Domain (safe)
  const contractDomainOf = (c) => c?.domain || c?.contractType || "-";

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

      // 🔎 Helpful debug if dropdown stays empty
      console.log("PROJECTS RAW RESPONSE:", res?.data);

      const data = unwrapArray(res?.data, ["projects", "items", "result"]);
      setProjects(data);

      if (!data.length) {
        toast.warning("Projects loaded but list is empty (check API response shape).");
      } else if (!didToastProjectsLoaded.current) {
        toast.success(`Projects loaded (${data.length})`);
        didToastProjectsLoaded.current = true;
      }
    } catch (err) {
      console.error("Failed to load projects", err);
      toast.error("Failed to load projects (check Network tab: status/URL/auth).");
      setProjects([]);
    }
  };

  const loadContracts = async () => {
    try {
      const res = await API.get("/external/contracts");

      console.log("CONTRACTS RAW RESPONSE:", res?.data);

      const data = unwrapArray(res?.data, ["contracts", "items", "result"]);
      setContracts(data);

      if (!data.length) {
        toast.warning("Contracts loaded but list is empty (check API response shape).");
      } else if (!didToastContractsLoaded.current) {
        toast.success(`Contracts loaded (${data.length})`);
        didToastContractsLoaded.current = true;
      }
    } catch (err) {
      console.error("Failed to load contracts", err);
      toast.error("Failed to load contracts (check Network tab: status/URL/auth).");
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

      if (saved?.form) setForm(saved.form);
      if (saved?.roles?.length) setRoles(saved.roles);

      if (saved?.editingId) setEditingId(saved.editingId);
      else setEditingId(null);

      if (saved?.activeTab) setActiveTab(saved.activeTab);

      titleTouchedRef.current = !!saved?.titleTouched;
      rolesTouchedRef.current = !!saved?.rolesTouched;

      taskTouchedRef.current = !!saved?.taskTouched;
      furtherTouchedRef.current = !!saved?.furtherTouched;
      startTouchedRef.current = !!saved?.startTouched;
      endTouchedRef.current = !!saved?.endTouched;
      locationTouchedRef.current = !!saved?.locationTouched;
      domainTouchedRef.current = !!saved?.domainTouched;

      // restore last autofill snapshot if present
      if (saved?.autoFill) {
        autoFillRef.current = {
          title: saved?.autoFill?.title || "",
          startDate: saved?.autoFill?.startDate || "",
          endDate: saved?.autoFill?.endDate || "",
          performanceLocation: saved?.autoFill?.performanceLocation || "",
          taskDescription: saved?.autoFill?.taskDescription || "",
          furtherInformation: saved?.autoFill?.furtherInformation || "",
        };
      }
    } catch (e) {
      console.warn("Failed to restore SR form state", e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // ✅ When projects/contracts arrive, re-link selectedProject/selectedContract from stored ids
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved?.selectedProjectId && projects.length) {
        const proj = projects.find(
          (p, idx) =>
            String(p.projectId) === String(saved.selectedProjectId) ||
            String(p.id) === String(saved.selectedProjectId) ||
            String(p._id) === String(saved.selectedProjectId) ||
            String(projectValueOf(p, idx)) === String(saved.selectedProjectId)
        );
        if (proj) setSelectedProject(proj);
      }

      if (saved?.selectedContractId && contracts.length) {
        const contract = contracts.find(
          (c, idx) =>
            String(c.id) === String(saved.selectedContractId) ||
            String(c._id) === String(saved.selectedContractId) ||
            String(c.referenceNumber) === String(saved.selectedContractId) ||
            String(contractValueOf(c, idx)) === String(saved.selectedContractId)
        );
        if (contract) setSelectedContract(contract);
      }
    } catch {}
  }, [projects, contracts]);

  // ✅ Persist form on every change — AFTER HYDRATION
  useEffect(() => {
    if (!hydrated) return;

    try {
      const payload = {
        form,
        roles,
        editingId,
        activeTab,
        titleTouched: titleTouchedRef.current,
        rolesTouched: rolesTouchedRef.current,

        taskTouched: taskTouchedRef.current,
        furtherTouched: furtherTouchedRef.current,
        startTouched: startTouchedRef.current,
        endTouched: endTouchedRef.current,
        locationTouched: locationTouchedRef.current,
        domainTouched: domainTouchedRef.current,

        selectedProjectId:
          selectedProject?.projectId || selectedProject?.id || selectedProject?._id || "",
        selectedContractId:
          selectedContract?.id || selectedContract?._id || selectedContract?.referenceNumber || "",
        autoFill: autoFillRef.current, // ✅ persist autofill snapshot
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Failed to persist SR form state", e);
    }
  }, [hydrated, form, roles, editingId, activeTab, selectedProject, selectedContract]);

  // --------------------------- HELPERS ---------------------------
  const numOrNull = (v) => (v === "" ? null : Number(v));

  const srLabel = (req) => {
    if (!req) return "-";
    if (req.requestNumber && String(req.requestNumber).trim()) return req.requestNumber;
    if (req.id == null) return "-";
    return `SR-${String(req.id).padStart(6, "0")}`;
  };

  // ✅ Group-1 role list
  const projectRoles = projectMeta.roles || [];

  const getProjectRoleObj = (selectedRoleName) =>
    projectRoles.find((r) => String(r.roleName) === String(selectedRoleName));

  const techOptionsFromProjectRole = (roleObj) => {
    if (!roleObj) return [];
    const comps = Array.isArray(roleObj.competencies) ? roleObj.competencies : [];
    const skills = Array.isArray(projectMeta.skills) ? projectMeta.skills : [];
    return Array.from(
      new Set([...comps, ...skills].map((x) => String(x).trim()).filter(Boolean))
    );
  };

  const getTechnologyOptionsForRow = (row) => {
    const pr = getProjectRoleObj(row.selectedContractRole);
    return techOptionsFromProjectRole(pr);
  };

  // --------------------------- HANDLERS ---------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "title") titleTouchedRef.current = true;

    // ✅ mark manual edits to prevent unwanted overwrites
    if (name === "taskDescription") taskTouchedRef.current = true;
    if (name === "furtherInformation") furtherTouchedRef.current = true;
    if (name === "startDate") startTouchedRef.current = true;
    if (name === "endDate") endTouchedRef.current = true;
    if (name === "performanceLocation") locationTouchedRef.current = true;

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

  // ✅ NEW: when project selected, fetch normalized payload for dropdown + autofill
  const fetchProjectNormalized = async (projectIdOrId) => {
    try {
      const res = await API.get(`/external/projects/${projectIdOrId}/normalized`);
      return res.data || null;
    } catch (e) {
      console.error(e);
      toast.error("Failed to load project details (normalized).");
      return null;
    }
  };

  // ✅ FIXED: Reselecting projects now updates auto-filled fields correctly
  const handleProjectSelect = async (e) => {
    const selectedValue = e.target.value;

    const proj = projects.find((p, idx) => String(projectValueOf(p, idx)) === String(selectedValue));
    setSelectedProject(proj || null);

    // cleared selection
    if (!selectedValue) {
      setProjectMeta({ locations: [], skills: [], roles: [], normalized: null });
      setForm((prev) => ({
        ...prev,
        projectId: "",
        projectName: "",
      }));

      autoFillRef.current = {
        title: "",
        startDate: "",
        endDate: "",
        performanceLocation: "",
        taskDescription: "",
        furtherInformation: "",
      };

      // reset touched flags (fresh selection later should overwrite)
      titleTouchedRef.current = false;
      taskTouchedRef.current = false;
      furtherTouchedRef.current = false;
      startTouchedRef.current = false;
      endTouchedRef.current = false;
      locationTouchedRef.current = false;

      return;
    }

    const projectIdOrId = proj?.projectId || proj?.id || proj?._id || "";

    // If no usable ID exists, still update UI but can't fetch normalized
    if (!projectIdOrId) {
      setProjectMeta({ locations: [], skills: [], roles: [], normalized: null });
      setForm((prev) => ({
        ...prev,
        projectId: selectedValue || "",
        projectName: proj ? projectRightOf(proj) : "",
      }));
      toast.warning("Selected project has no ID (projectId/id/_id). Cannot load normalized details.");
      return;
    }

    const norm = await fetchProjectNormalized(projectIdOrId);

    const locations = Array.isArray(norm?.locations) ? norm.locations : [];
    const skills = Array.isArray(norm?.skills) ? norm.skills : [];
    const roleList = Array.isArray(norm?.roles) ? norm.roles : [];

    setProjectMeta({
      locations,
      skills,
      roles: roleList,
      normalized: norm,
    });

    // next auto-fill values from this project
    const nextAutoTitle =
      norm?.title || proj?.projectDescription || proj?.projectName || proj?.projectId || "";

    const nextAutoStart = norm?.startDate || proj?.projectStart || "";
    const nextAutoEnd = norm?.endDate || proj?.projectEnd || "";
    const nextAutoLocation = locations.length ? String(locations[0]) : "";

    // IMPORTANT: list response contains taskDescription, so use that as fallback always
    const nextAutoTask = norm?.taskDescription || proj?.taskDescription || "";

    const nextAutoFurther =
      (proj?.links ? `Link: ${proj.links}` : "") +
      (skills.length ? `${proj?.links ? "\n" : ""}Skills: ${skills.join(", ")}` : "");

    setForm((prev) => {
      const last = autoFillRef.current;

      const titleCanOverwrite =
        !titleTouchedRef.current || shouldOverwrite(prev.title, last.title);

      // ✅ overwrite if not manually touched OR still equals previous auto-fill OR empty
      const startCanOverwrite =
        !startTouchedRef.current || shouldOverwrite(prev.startDate, last.startDate);
      const endCanOverwrite =
        !endTouchedRef.current || shouldOverwrite(prev.endDate, last.endDate);
      const locCanOverwrite =
        !locationTouchedRef.current ||
        shouldOverwrite(prev.performanceLocation, last.performanceLocation);
      const taskCanOverwrite =
        !taskTouchedRef.current || shouldOverwrite(prev.taskDescription, last.taskDescription);
      const furtherCanOverwrite =
        !furtherTouchedRef.current ||
        shouldOverwrite(prev.furtherInformation, last.furtherInformation);

      const updated = {
        ...prev,

        projectId: norm?.projectId || projectIdOrId,
        projectName:
          norm?.projectName ||
          proj?.projectDescription ||
          proj?.projectName ||
          proj?.projectId ||
          "",

        title: titleCanOverwrite ? nextAutoTitle : prev.title,

        startDate: startCanOverwrite ? nextAutoStart : prev.startDate,
        endDate: endCanOverwrite ? nextAutoEnd : prev.endDate,

        performanceLocation: locCanOverwrite ? nextAutoLocation : prev.performanceLocation,

        taskDescription: taskCanOverwrite ? nextAutoTask : prev.taskDescription,
        furtherInformation: furtherCanOverwrite ? nextAutoFurther : prev.furtherInformation,
      };

      // update snapshot (always store the "next auto", used for comparing on next reselect)
      autoFillRef.current = {
        title: nextAutoTitle,
        startDate: nextAutoStart,
        endDate: nextAutoEnd,
        performanceLocation: nextAutoLocation,
        taskDescription: nextAutoTask,
        furtherInformation: nextAutoFurther,
      };

      return updated;
    });

    // ✅ Autofill roles rows from project roles if user hasn't touched roles yet
    if (!rolesTouchedRef.current) {
      const desiredRows = roleList.length || 1;

      // respect request type limit
      const limit = form.type === "MULTI" ? 4 : form.type === "TEAM" ? Infinity : 1;
      const count = Math.min(desiredRows, limit === Infinity ? desiredRows : limit);

      const rows = [];
      for (let i = 0; i < count; i++) {
        const pr = roleList[i];
        const roleName = pr?.roleName || "";
        const techOptions = techOptionsFromProjectRole(pr);
        const defaultTech = techOptions[0] || "";

        rows.push({
          selectedContractRole: roleName, // keep key name for compatibility
          domain: "", // domain comes from contract
          roleName: roleName,
          technology: defaultTech,
          experienceLevel: "",
          manDays: pr?.manDays ?? "",
          onsiteDays: "",
        });
      }

      setRoles(rows.length ? rows : [emptyRoleRow()]);
    }

    toast.success("Project details loaded (roles + locations)");
  };

  // ✅ Contract is ONLY reference (Group-2)
  const handleContractSelect = (e) => {
    const contractId = e.target.value;

    const contract = contracts.find(
      (c, idx) => String(contractValueOf(c, idx)) === String(contractId)
    );

    setSelectedContract(contract || null);

    // ✅ IMPORTANT FIX: keep the select controlled by the same selected value
    setForm((prev) => ({
      ...prev,
      contractId: contractId || "",
      contractSupplier: contract ? contractSupplierOf(contract) : "",
    }));

    // ✅ Domain should change when contract changes.
    // If user never edited domain manually => overwrite all domains.
    // If user edited domain manually => only fill empty domains.
    const domain = contract ? contractDomainOf(contract) : "";
    if (domain && domain !== "-") {
      setRoles((prev) =>
        prev.map((r) => {
          if (!domainTouchedRef.current) return { ...r, domain }; // overwrite all
          return r.domain ? r : { ...r, domain }; // only fill empty
        })
      );
    }
  };

  // ✅ Project role selection
  const handleRoleProjectSelect = (index, selectedRoleName) => {
    rolesTouchedRef.current = true;

    setRoles((prev) => {
      const updated = [...prev];
      const pr = getProjectRoleObj(selectedRoleName);
      const techOptions = techOptionsFromProjectRole(pr);
      const defaultTech = techOptions[0] || "";

      updated[index] = {
        ...updated[index],
        selectedContractRole: selectedRoleName,
        roleName: pr?.roleName || selectedRoleName || "",
        technology: updated[index].technology || defaultTech,
        manDays: updated[index].manDays || pr?.manDays || "",
      };

      return updated;
    });
  };

  const handleRoleFieldChange = (index, field, value) => {
    rolesTouchedRef.current = true;
    if (field === "domain") domainTouchedRef.current = true;

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
    rolesTouchedRef.current = true;
    setRoles((prev) => [...prev, emptyRoleRow()]);
  };

  const removeRoleRow = (index) => {
    if (roles.length === 1) return;
    rolesTouchedRef.current = true;
    setRoles((prev) => prev.filter((_, i) => i !== index));
  };

  // --------------------------- RESET FORM ---------------------------
  const resetForm = () => {
    localStorage.removeItem(STORAGE_KEY);

    titleTouchedRef.current = false;
    rolesTouchedRef.current = false;

    taskTouchedRef.current = false;
    furtherTouchedRef.current = false;
    startTouchedRef.current = false;
    endTouchedRef.current = false;
    locationTouchedRef.current = false;
    domainTouchedRef.current = false;

    autoFillRef.current = {
      title: "",
      startDate: "",
      endDate: "",
      performanceLocation: "",
      taskDescription: "",
      furtherInformation: "",
    };

    setEditingId(null);
    setSelectedProject(null);
    setSelectedContract(null);

    setProjectMeta({ locations: [], skills: [], roles: [], normalized: null });

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
  const startEdit = async (req) => {
    if (req.status !== "DRAFT") {
      toast.info("Only DRAFT requests can be edited.");
      return;
    }

    setActiveTab("create");
    setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    setEditingId(req.id);

    // contract reference only (support id/_id/referenceNumber)
    const contract = contracts.find(
      (c, idx) =>
        String(contractValueOf(c, idx)) === String(req.contractId) ||
        String(c.id) === String(req.contractId) ||
        String(c._id) === String(req.contractId) ||
        String(c.referenceNumber) === String(req.contractId)
    );
    setSelectedContract(contract || null);

    // project + normalized to repopulate dropdowns
    const proj = projects.find(
      (p, idx) =>
        String(projectValueOf(p, idx)) === String(req.projectId) ||
        String(p.projectId) === String(req.projectId) ||
        String(p.id) === String(req.projectId) ||
        String(p._id) === String(req.projectId)
    );
    setSelectedProject(proj || null);

    if (req.projectId) {
      const norm = await fetchProjectNormalized(req.projectId);
      setProjectMeta({
        locations: Array.isArray(norm?.locations) ? norm.locations : [],
        skills: Array.isArray(norm?.skills) ? norm.skills : [],
        roles: Array.isArray(norm?.roles) ? norm.roles : [],
        normalized: norm,
      });
    }

    // In edit mode, treat fields as user-managed to avoid overwriting
    titleTouchedRef.current = true;
    rolesTouchedRef.current = true;

    taskTouchedRef.current = true;
    furtherTouchedRef.current = true;
    startTouchedRef.current = true;
    endTouchedRef.current = true;
    locationTouchedRef.current = true;
    domainTouchedRef.current = true;

    // snapshot autoFill so reselect logic doesn't overwrite edited draft unexpectedly
    autoFillRef.current = {
      title: "",
      startDate: "",
      endDate: "",
      performanceLocation: "",
      taskDescription: "",
      furtherInformation: "",
    };

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
    niceToHaveCriteria: [form.nice1, form.nice2, form.nice3, form.nice4, form.nice5].filter(
      Boolean
    ),

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

  const projectLabel = (req) =>
    req.projectId ? `${req.projectId} – ${req.projectName || ""}` : "-";
  const contractLabel = (req) =>
    req.contractId ? `${req.contractSupplier || ""} – ${req.contractId}` : "-";

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

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Service Requests</h1>
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

          {activeTab === "create" && (
            <>
              <div ref={formTopRef} />

              <form
                onSubmit={saveRequest}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm ring-1 ring-slate-200 p-4 sm:p-6 mb-8 space-y-5"
              >
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

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="text-xs text-slate-600">Project</label>
                    <select
                      value={form.projectId || ""}
                      onChange={handleProjectSelect}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    >
                      <option value="">-- Select project --</option>
                      {projects.map((p, idx) => {
                        const value = projectValueOf(p, idx);
                        const left = projectLeftOf(p, idx);
                        const right = projectRightOf(p);

                        return (
                          <option key={value} value={value}>
                            {left} – {right}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600">Contract (Group-2 reference only)</label>
                    <select
                      value={form.contractId}
                      onChange={handleContractSelect}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                    >
                      <option value="">-- Select contract --</option>
                      {contracts.map((c, idx) => {
                        const value = contractValueOf(c, idx);
                        const supplier = contractSupplierOf(c);
                        const domain = contractDomainOf(c);
                        return (
                          <option key={value} value={value}>
                            {supplier} – {domain}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Roles/technology are taken from the selected project (Group-1).
                    </p>
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

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label className="text-xs text-slate-600">Performance Location</label>

                    {/* ✅ dropdown if project provides locations */}
                    {projectMeta.locations?.length ? (
                      <select
                        name="performanceLocation"
                        value={form.performanceLocation}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                      >
                        <option value="">-- Select location --</option>
                        {projectMeta.locations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        name="performanceLocation"
                        value={form.performanceLocation}
                        onChange={handleChange}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                      />
                    )}

                    <p className="text-[11px] text-slate-500 mt-1">
                      If the project provides locations, this becomes a dropdown.
                    </p>
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
                        Roles/technology options come from the selected <b>Project</b>.
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
                              <label className="text-[11px] text-slate-500">Project Role</label>
                              <select
                                value={r.selectedContractRole}
                                onChange={(e) => handleRoleProjectSelect(index, e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
                                disabled={!form.projectId}
                              >
                                <option value="">
                                  {form.projectId ? "-- select --" : "Select project first"}
                                </option>

                                {projectRoles.map((pr) => (
                                  <option key={pr.roleName} value={pr.roleName}>
                                    {pr.roleName}
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
                                onChange={(e) =>
                                  handleRoleFieldChange(index, "experienceLevel", e.target.value)
                                }
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
                                  onChange={(e) =>
                                    handleRoleFieldChange(index, "onsiteDays", e.target.value)
                                  }
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
                    placeholder={
                      projectMeta.skills?.length ? `Suggestion: ${projectMeta.skills.join(", ")}` : ""
                    }
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
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 border border-slate-200"
                  >
                    Clear Draft
                  </button>

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

              <div className="flex flex-wrap gap-2 mb-4">
                {["DRAFT", "IN_REVIEW", "APPROVED_FOR_BIDDING", "BIDDING", "ORDERED", "REJECTED"].map(
                  (s) => (
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
                  )
                )}
              </div>

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
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{srLabel(r)}</td>

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
                              <button
                                onClick={() => navigate(`/requests/${r.id}?tab=details`)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow"
                              >
                                Details
                              </button>

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
