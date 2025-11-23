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

  // Full form state (frontend-only structure)
  const [form, setForm] = useState({
    title: "",
    type: "SINGLE",

    // References (for future Group 1 & 2 integration)
    projectId: "",
    contractId: "",

    // Dates
    startDate: "",
    endDate: "",

    // Core request attributes
    domain: "",
    roleName: "",
    technology: "",
    experienceLevel: "",
    performanceLocation: "",
    sumOfManDays: "",
    onsiteDays: "",

    // Offer limits
    maxOffers: "",
    maxAcceptedOffers: "",

    // Criteria / languages
    requiredLanguagesInput: "", // comma separated
    must1: "",
    must2: "",
    must3: "",
    nice1: "",
    nice2: "",
    nice3: "",
    nice4: "",
    nice5: "",

    // Description
    taskDescription: "",
    furtherInformation: "",
  });

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

  useEffect(() => {
    loadRequests();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const createRequest = async (e) => {
    e.preventDefault();

    // Build payload that matches your ServiceRequest entity
    const payload = {
      title: form.title,
      type: form.type, // "SINGLE", "MULTI", "TEAM", "WORK_CONTRACT"
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      domain: form.domain || null,
      roleName: form.roleName || null,
      technology: form.technology || null,
      experienceLevel: form.experienceLevel || null,
      performanceLocation: form.performanceLocation || null,
      taskDescription: form.taskDescription || null,
      furtherInformation: form.furtherInformation || null,
    };

    // Numbers (convert "" → null, otherwise Number)
    const numOrNull = (v) =>
      v === null || v === undefined || v === "" ? null : Number(v);

    payload.sumOfManDays = numOrNull(form.sumOfManDays);
    payload.onsiteDays = numOrNull(form.onsiteDays);
    payload.maxOffers = numOrNull(form.maxOffers);
    payload.maxAcceptedOffers = numOrNull(form.maxAcceptedOffers);

    // Project reference (Group 1 – later this will be selected from API)
    if (form.projectId) {
      payload.projectReference = { id: Number(form.projectId) };
    }

    // Contract references (Group 2 – for now: one contract)
    if (form.contractId) {
      payload.contractReferences = [{ id: Number(form.contractId) }];
    }

    // Required languages: comma-separated → array
    if (form.requiredLanguagesInput.trim() !== "") {
      payload.requiredLanguages = form.requiredLanguagesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Must-have criteria (max 3)
    payload.mustHaveCriteria = [form.must1, form.must2, form.must3].filter(
      (s) => s && s.trim() !== ""
    );

    // Nice-to-have criteria (max 5)
    payload.niceToHaveCriteria = [
      form.nice1,
      form.nice2,
      form.nice3,
      form.nice4,
      form.nice5,
    ].filter((s) => s && s.trim() !== "");

    try {
      await API.post("/requests", payload);
      // Reset form
      setForm({
        title: "",
        type: "SINGLE",
        projectId: "",
        contractId: "",
        startDate: "",
        endDate: "",
        domain: "",
        roleName: "",
        technology: "",
        experienceLevel: "",
        performanceLocation: "",
        sumOfManDays: "",
        onsiteDays: "",
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
                Project ID (from Group 1)
              </label>
              <input
                type="number"
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Contract ID (from Group 2)
              </label>
              <input
                type="number"
                name="contractId"
                value={form.contractId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
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

          {/* Domain / Role / Tech / Experience */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Domain
              </label>
              <input
                type="text"
                name="domain"
                value={form.domain}
                onChange={handleChange}
                placeholder="e.g. Consulting and Development"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Role Name
              </label>
              <input
                type="text"
                name="roleName"
                value={form.roleName}
                onChange={handleChange}
                placeholder="e.g. Project Manager"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Technology
              </label>
              <input
                type="text"
                name="technology"
                value={form.technology}
                onChange={handleChange}
                placeholder="e.g. Java, Spring Boot"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Experience Level
              </label>
              <input
                type="text"
                name="experienceLevel"
                value={form.experienceLevel}
                onChange={handleChange}
                placeholder="e.g. Senior"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Man days / Location / Offer limits */}
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Sum of Man Days
              </label>
              <input
                type="number"
                name="sumOfManDays"
                value={form.sumOfManDays}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Onsite Days
              </label>
              <input
                type="number"
                name="onsiteDays"
                value={form.onsiteDays}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
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
            <div className="grid gap-2 md:grid-cols-2">
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
                  Max Accepted
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
                  <th className="py-2">Project ID</th>
                  <th className="py-2">Contract ID</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2">{r.title}</td>
                    <td className="py-2">{r.type}</td>
                    <td className="py-2">{r.status}</td>
                    <td className="py-2">
                      {r.projectReference ? r.projectReference.id : "-"}
                    </td>
                    <td className="py-2">
                      {r.contractReferences && r.contractReferences.length > 0
                        ? r.contractReferences.map((c) => c.id).join(", ")
                        : "-"}
                    </td>
                    <td className="py-2 text-right space-x-2">
                      <button
                        onClick={() => navigate(`/requests/${r.id}`)}
                        className="text-blue-600 hover:underline"
                      >
                        Details
                      </button>
                      {r.status === "DRAFT" && (
                        <button
                          onClick={() => submitForReview(r.id)}
                          className="text-green-600 hover:underline"
                        >
                          Submit
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
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
