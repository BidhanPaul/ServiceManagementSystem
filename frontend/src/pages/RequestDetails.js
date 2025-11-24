import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";
import API from "../api/api";

export default function RequestDetails() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [reqRes, offersRes] = await Promise.all([
        API.get(`/requests/${id}`),
        API.get(`/requests/${id}/offers`),
      ]);
      setRequest(reqRes.data);
      setOffers(offersRes.data);
    } catch (err) {
      console.error("Failed to load request details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const selectPreferred = async (offerId) => {
    try {
      await API.put(`/requests/${id}/offers/${offerId}/select`);
      load();
    } catch (err) {
      console.error("Failed to select preferred offer", err);
    }
  };

  const createOrder = async (offerId) => {
    try {
      await API.post(`/requests/offers/${offerId}/order`);
      load();
    } catch (err) {
      console.error("Failed to create service order", err);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">
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
        <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">
          <TopNav />
          <p className="text-white">Request not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">
        <TopNav />

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {request.title}
        </h1>

        {/* Request info */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-4 mb-6 text-sm space-y-1">
          <p><span className="font-semibold">Status:</span> {request.status}</p>
          <p><span className="font-semibold">Type:</span> {request.type}</p>
          <p><span className="font-semibold">Project ID:</span> {request.projectId || "-"}</p>
          <p><span className="font-semibold">Contract ID:</span> {request.contractId || "-"}</p>
          <p>
            <span className="font-semibold">Dates:</span>{" "}
            {request.startDate || "-"} → {request.endDate || "-"}
          </p>
          <p><span className="font-semibold">Domain:</span> {request.domain || "-"}</p>
          <p><span className="font-semibold">Role:</span> {request.roleName || "-"}</p>
          <p><span className="font-semibold">Technology:</span> {request.technology || "-"}</p>
          <p><span className="font-semibold">Experience:</span> {request.experienceLevel || "-"}</p>
          <p>
            <span className="font-semibold">Man days / Onsite:</span>{" "}
            {request.sumOfManDays || 0} / {request.onsiteDays || 0}
          </p>
          <p>
            <span className="font-semibold">Location:</span>{" "}
            {request.performanceLocation || "-"}
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
              <span className="font-semibold">Task:</span> {request.taskDescription}
            </p>
          )}
          {request.furtherInformation && (
            <p>
              <span className="font-semibold">Further info:</span> {request.furtherInformation}
            </p>
          )}
        </div>

        {/* Offers */}
        <h2 className="text-xl font-semibold text-white mb-3">Offers</h2>

        <div className="bg-white/80 rounded-2xl shadow-lg p-4 space-y-4 text-sm">
          {offers.length === 0 && (
            <p className="text-gray-500">No offers yet.</p>
          )}

          {offers.map((o) => (
            <div
              key={o.id}
              className="border-b border-gray-200 pb-3 last:border-0 last:pb-0 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <p className="font-semibold">{o.specialistName}</p>
                <p className="text-xs text-gray-600">
                  Daily rate: {o.dailyRate} € – Total: {o.totalCost} €
                </p>
                <p className="text-xs text-gray-500">
                  Supplier: {o.supplierName} ({o.contractualRelationship})
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => selectPreferred(o.id)}
                  className="px-3 py-1 rounded-full text-xs bg-blue-600 text-white hover:bg-blue-700"
                >
                  Set Preferred
                </button>
                <button
                  onClick={() => createOrder(o.id)}
                  className="px-3 py-1 rounded-full text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Create Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
