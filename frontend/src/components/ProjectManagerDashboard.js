// src/components/ProjectManagerDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav"; // or "../components/TopNav" depending on your structure
import API from "../api/api";

const ProjectManagerDashboard = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offersByRequestId, setOffersByRequestId] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ current PM username from localStorage
  const currentUsername = localStorage.getItem("username");

  // ---------- LOAD DATA ----------

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

  const loadRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to load requests", err);
    }
  };

  const loadOffersForMyRequests = async (myReqs) => {
    try {
      const promises = myReqs.map((r) =>
        API.get(`/requests/${r.id}/offers`).then((res) => ({
          requestId: r.id,
          offers: res.data || [],
        }))
      );

      const results = await Promise.all(promises);
      const map = {};
      results.forEach((entry) => {
        map[entry.requestId] = entry.offers;
      });
      setOffersByRequestId(map);
    } catch (err) {
      console.error("Failed to load offers for my requests", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadProjectsFromMock(), loadContractsFromMock(), loadRequests()]);
      setLoading(false);
    };
    init();
  }, []);

  // When requests are loaded, fetch offers for "my" requests
  useEffect(() => {
    if (!currentUsername) return;
    const myReqs = requests.filter(
      (r) => r.requestedByUsername === currentUsername
    );
    if (myReqs.length > 0) {
      loadOffersForMyRequests(myReqs);
    } else {
      setOffersByRequestId({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, currentUsername]);

  // ---------- HELPERS ----------

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

  const myRequests = currentUsername
    ? requests.filter((r) => r.requestedByUsername === currentUsername)
    : [];

  // ---------- RENDER ----------

  if (!currentUsername) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">
          <TopNav />
          <div className="bg-white/80 rounded-2xl shadow-lg p-6 mt-4">
            <h1 className="text-xl font-semibold text-red-600 mb-2">
              No Project Manager logged in
            </h1>
            <p className="text-sm text-gray-700">
              Please make sure you set{" "}
              <code>localStorage.setItem("username", "pm1")</code> (or similar)
              after login so the dashboard can show your requests.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">
        <TopNav />

        {/* Header + Create Request button */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Project Manager Panel
          </h1>
          <button
            onClick={() => navigate("/requests")}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 shadow-md"
          >
            + Create Service Request
          </button>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow-md rounded-xl p-4">
            <h2 className="font-semibold text-gray-700 text-sm">
              Projects (Mock API)
            </h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {projects.length}
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl p-4">
            <h2 className="font-semibold text-gray-700 text-sm">
              Contracts (Mock API)
            </h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {contracts.length}
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl p-4">
            <h2 className="font-semibold text-gray-700 text-sm">
              My Service Requests
            </h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {myRequests.length}
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl p-4">
            <h2 className="font-semibold text-gray-700 text-sm">
              All Service Requests
            </h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {requests.length}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-white/80">Loading...</p>
        ) : (
          <>
            {/* My Requests */}
            <div className="bg-white/90 rounded-2xl shadow-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  My Service Requests
                </h2>
              </div>

              {myRequests.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You have not created any requests yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2">Title</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Project</th>
                        <th className="py-2">Contract</th>
                        <th className="py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myRequests.map((r) => (
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
                          <td className="py-2 text-right">
                            <button
                              onClick={() => navigate(`/requests/${r.id}`)}
                              className="text-blue-600 hover:underline"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* All Requests */}
            <div className="bg-white/90 rounded-2xl shadow-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                All Service Requests
              </h2>
              {requests.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No service requests in the system.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="py-2">Title</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Project</th>
                        <th className="py-2">Contract</th>
                        <th className="py-2">Requested By</th>
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
                          <td className="py-2">
                            {r.requestedByUsername || "-"}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              onClick={() => navigate(`/requests/${r.id}`)}
                              className="text-blue-600 hover:underline"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Offers for My Requests */}
            <div className="bg-white/90 rounded-2xl shadow-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Offers for My Requests
              </h2>

              {myRequests.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You have no requests, so there are no offers yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((req) => {
                    const offers = offersByRequestId[req.id] || [];
                    return (
                      <div
                        key={req.id}
                        className="border border-gray-200 rounded-xl p-3"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {req.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {projectLabel(req)} | {contractLabel(req)}
                            </p>
                          </div>
                          <span
                            className={
                              "inline-flex px-2 py-0.5 rounded-full text-xs font-medium " +
                              statusBadgeClass(req.status)
                            }
                          >
                            {req.status}
                          </span>
                        </div>

                        {offers.length === 0 ? (
                          <p className="text-xs text-gray-500">
                            No offers received yet.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {offers.map((o) => (
                              <div
                                key={o.id}
                                className="flex justify-between text-xs border-t pt-1 mt-1"
                              >
                                <div>
                                  <p className="font-semibold text-gray-700">
                                    {o.specialistName || "Unnamed Specialist"}
                                  </p>
                                  <p className="text-gray-500">
                                    Supplier: {o.supplierName} (
                                    {o.contractualRelationship})
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-gray-600">
                                    Daily rate: {o.dailyRate} €
                                  </p>
                                  <p className="font-semibold text-gray-800">
                                    Total: {o.totalCost} €
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;


//changes related to ProjectManagerDashboard file 