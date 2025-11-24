// src/pages/ServiceRequests.js
import { useEffect, useState } from "react";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Reference data from mockapi.io
  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]); // contract.roles

  const [form, setForm] = useState({
    title: "",
    type: "SINGLE",
    projectId: "",
    contractId: "",
    startDate: "",
    endDate: "",
    performanceLocation: "",
    maxOffers: "",
    maxAcceptedOffers: "",
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

  // dynamic roles array – used for SINGLE / MULTI / TEAM / WORK_CONTRACT
  const emptyRoleRow = () => ({
    selectedContractRole: "", // name from contract.roles[x].role
    domain: "",
    roleName: "",
    technology: "",
    experienceLevel: "",
    manDays: "",
    onsiteDays: "",
  });

  const [roles, setRoles] = useState([emptyRoleRow()]);

  // ------------ LOAD DATA ------------

  const loadRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadRequests();
    loadProjectsFromMock();
    loadContractsFromMock();
  }, []);

  // ------------ HANDLERS ------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    // handle type specially (SINGLE = only 1 role row)
    if (name === "type") {
      const newType = value;
      setForm((prev) => ({ ...prev, type: newType }));
      setRoles((prev) => {
        if (newType === "SINGLE" && prev.length > 1) {
          return [prev[0]]; // keep first row only
        }
        return prev;
      });
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectSelect = (e) => {
    const projectId = e.target.value;
    const proj = projects.find((p) => p.id === projectId) || null;
    setSelectedProject(proj);

    setForm((prev) => {
      const updated = { ...prev, projectId };

      if (proj) {
        // auto-fill only if still empty → user can override
        if (!updated.title) {
          updated.title = proj.name;
        }
        if (!updated.startDate && proj.startDate) {
          updated.startDate = proj.startDate;
        }
        if (!updated.endDate && proj.endDate) {
          updated.endDate = proj.endDate;
        }
        if (!updated.taskDescription && proj.description) {
          updated.taskDescription = proj.description;
        }
        if (!updated.furtherInformation && proj.department) {
          updated.furtherInformation = proj.department;
        }
      }

      return updated;
    });
  };

  const handleContractSelect = (e) => {
    const contractId = e.target.value;
    const contract = contracts.find((c) => c.id === contractId) || null;
    setSelectedContract(contract);
    setAvailableRoles(contract?.roles || []);

    setForm((prev) => ({ ...prev, contractId }));

    // we do NOT auto-fill rows yet – user chooses which contract role per row
  };

  const handleRoleFieldChange = (index, field, value) => {
    setRoles((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRoleContractSelect = (index, roleName) => {
    setRoles((prev) => {
      const copy = [...prev];
      const row = { ...copy[index], selectedContractRole: roleName };

      if (selectedContract && availableRoles.length > 0) {
        const contractRole = availableRoles.find((r) => r.role === roleName);
        if (contractRole) {
          row.roleName = contractRole.role;
          row.experienceLevel = contractRole.experience;
          row.domain = selectedContract.domain;
          // technology stays manual, user can type if needed
        }
      }

      copy[index] = row;
      return copy;
    });
  };

  const addRoleRow = () => {
    if (form.type === "SINGLE" && roles.length >= 1) return;
    setRoles((prev) => [...prev, emptyRoleRow()]);
  };

  const removeRoleRow = (index) => {
    if (roles.length === 1) return; // keep at least one row
    setRoles((prev) => prev.filter((_, i) => i !== index));
  };

  const numOrNull = (v) =>
    v === null || v === undefined || v === "" ? null : Number(v);

  const createRequest = async (e) => {
    e.preventDefault();

    // Build payload that matches current ServiceRequest + RequestedRole
    const payload = {
      title: form.title,
      type: form.type, // SINGLE / MULTI / TEAM / WORK_CONTRACT

      // backend uses List<String> projectIds / contractIds
      projectIds: form.projectId ? [form.projectId] : [],
      contractIds: form.contractId ? [form.contractId] : [],

      startDate: form.startDate || null,
      endDate: form.endDate || null,
      performanceLocation: form.performanceLocation || null,

      maxOffers: numOrNull(form.maxOffers),
      maxAcceptedOffers: numOrNull(form.maxAcceptedOffers),

      taskDescription: form.taskDescription || null,
      furtherInformation: form.furtherInformation || null,
    };

    // languages
    if (form.requiredLanguagesInput.trim() !== "") {
      payload.requiredLanguages = form.requiredLanguagesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // must-have / nice-to-have
    payload.mustHaveCriteria = [form.must1, form.must2, form.must3]
      .map((s) => (s ? s.trim() : ""))
      .filter((s) => s !== "");

    payload.niceToHaveCriteria = [
      form.nice1,
      form.nice2,
      form.nice3,
      form.nice4,
      form.nice5,
    ]
      .map((s) => (s ? s.trim() : ""))
      .filter((s) => s !== "");

    // roles from dynamic table
    payload.roles = roles.map((r) => ({
      domain: r.domain || null,
      roleName: r.roleName || null,
      technology: r.technology || null,
      experienceLevel: r.experienceLevel || null,
      manDays: numOrNull(r.manDays),
      onsiteDays: numOrNull(r.onsiteDays),
    }));

    try {
      await API.post("/requests", payload);

      // reset form + roles
      setForm({
        title: "",
        type: "SINGLE",
        projectId: "",
        contractId: "",
        startDate: "",
        endDate: "",
        performanceLocation: "",
        maxOffers: "",
        maxAcceptedOffers: "",
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
      setSelectedProject(null);
      setSelectedContract(null);
      setAvailableRoles([]);
      setRoles([emptyRoleRow()]);

      loadRequests();
    } catch (err) {
      console.error("Failed to create request", err);
      alert("Failed to create request. Check backend logs for details.");
    }
  };

  const submitForReview = async (id) => {
    try {
      await API.put(`/requests/${id}/submit`);
      loadRequests();
    } catch (err) {
      console.error("Failed to submit for review", err);
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this draft request?")) return;
    try {
      await API.delete(`/requests/${id}`);
      loadRequests();
    } catch (err) {
      console.error("Failed to delete request", err);
    }
  };

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

  // ------------ RENDER ------------

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">
        <TopNav />

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">
          Service Requests
        </h1>

        {/* CREATE FORM */}
        <form
          onSubmit={createRequest}
          className="bg-white/80 rounded-2xl shadow-lg p-5 mb-8 space-y-4"
        >
          {/* Title + Type */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-600 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Senior Java Developer for Project X"
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Request Type
              </label>
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
            </div>
          </div>

          {/* Project / Contract / Dates */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Project (from Group 1 / MockAPI)
              </label>
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleProjectSelect}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Select project --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.customer} – {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Contract (from Group 2 / MockAPI)
              </label>
              <select
                name="contractId"
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
              <label className="block text-xs text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Dynamic roles */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-700">
                Requested Roles
              </h2>
              <button
                type="button"
                onClick={addRoleRow}
                className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                + Add Role
              </button>
            </div>

            {roles.map((r, index) => (
              <div
                key={index}
                className="grid gap-2 md:grid-cols-7 mb-2 items-center"
              >
                {/* Contract role dropdown */}
                <select
                  value={r.selectedContractRole}
                  onChange={(e) =>
                    handleRoleContractSelect(index, e.target.value)
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                  disabled={!selectedContract || availableRoles.length === 0}
                >
                  <option value="">
                    {selectedContract
                      ? "-- Select role from contract --"
                      : "Select contract first"}
                  </option>
                  {availableRoles.map((cr) => (
                    <option key={cr.role} value={cr.role}>
                      {cr.role} ({cr.experience})
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Domain"
                  value={r.domain}
                  onChange={(e) =>
                    handleRoleFieldChange(index, "domain", e.target.value)
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="Role name"
                  value={r.roleName}
                  onChange={(e) =>
                    handleRoleFieldChange(index, "roleName", e.target.value)
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="Technology"
                  value={r.technology}
                  onChange={(e) =>
                    handleRoleFieldChange(index, "technology", e.target.value)
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  placeholder="Experience"
                  value={r.experienceLevel}
                  onChange={(e) =>
                    handleRoleFieldChange(
                      index,
                      "experienceLevel",
                      e.target.value
                    )
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  placeholder="Man days"
                  value={r.manDays}
                  onChange={(e) =>
                    handleRoleFieldChange(index, "manDays", e.target.value)
                  }
                  className="border rounded-lg px-2 py-1 text-sm"
                />
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Onsite days"
                    value={r.onsiteDays}
                    onChange={(e) =>
                      handleRoleFieldChange(index, "onsiteDays", e.target.value)
                    }
                    className="border rounded-lg px-2 py-1 text-sm flex-1"
                  />
                  {roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoleRow(index)}
                      className="text-xs text-red-500"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Location + offer limits */}
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Performance Location
              </label>
              <input
                type="text"
                name="performanceLocation"
                value={form.performanceLocation}
                onChange={handleChange}
                placeholder="Onshore / Nearshore / Offshore"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Max Offers
              </label>
              <input
                type="number"
                name="maxOffers"
                value={form.maxOffers}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Max Accepted Offers
              </label>
              <input
                type="number"
                name="maxAcceptedOffers"
                value={form.maxAcceptedOffers}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Required languages (comma separated)
            </label>
            <input
              type="text"
              name="requiredLanguagesInput"
              value={form.requiredLanguagesInput}
              onChange={handleChange}
              placeholder="e.g. English (C1), German (B2)"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Must-have / Nice-to-have criteria */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-gray-600 mb-1">
                Must-have criteria (max 3)
              </p>
              <input
                type="text"
                name="must1"
                value={form.must1}
                onChange={handleChange}
                placeholder="Must-have #1"
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <input
                type="text"
                name="must2"
                value={form.must2}
                onChange={handleChange}
                placeholder="Must-have #2"
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <input
                type="text"
                name="must3"
                value={form.must3}
                onChange={handleChange}
                placeholder="Must-have #3"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">
                Nice-to-have criteria (max 5)
              </p>
              <input
                type="text"
                name="nice1"
                value={form.nice1}
                onChange={handleChange}
                placeholder="Nice-to-have #1"
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <input
                type="text"
                name="nice2"
                value={form.nice2}
                onChange={handleChange}
                placeholder="Nice-to-have #2"
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <input
                type="text"
                name="nice3"
                value={form.nice3}
                onChange={handleChange}
                placeholder="Nice-to-have #3"
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <input
                type="text"
                name="nice4"
                value={form.nice4}
                onChange={handleChange}
                placeholder="Nice-to-have #4"
                className="w-full border rounded-lg px-3 py-2 mb-2"
              />
              <input
                type="text"
                name="nice5"
                value={form.nice5}
                onChange={handleChange}
                placeholder="Nice-to-have #5"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Description / Further info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Task Description
              </label>
              <textarea
                name="taskDescription"
                value={form.taskDescription}
                onChange={handleChange}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Further Information
              </label>
              <textarea
                name="furtherInformation"
                value={form.furtherInformation}
                onChange={handleChange}
                rows={4}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Create Request
            </button>
          </div>
        </form>

        {/* LIST */}
        {loading ? (
          <p className="text-white/80">Loading...</p>
        ) : (
          <div className="bg-white/80 rounded-2xl shadow-lg p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
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
                    <td className="py-2">{r.roles ? r.roles.length : 0}</td>
                    <td className="py-2 text-right space-x-3">
                      <button
                        onClick={() => navigate(`/requests/${r.id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        Details
                      </button>
                      {r.status === "DRAFT" && (
                        <>
                          {/* Edit page can be implemented later */}
                          <button
                            onClick={() => deleteRequest(r.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => submitForReview(r.id)}
                            className="text-green-600 hover:underline"
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
                    <td
                      colSpan={7}
                      className="py-4 text-center text-gray-500 text-sm"
                    >
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
  );
}
