// src/pages/RequestDetails.js
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

        <div className="bg-white/80 rounded-2xl shadow-lg p-4 mb-6 text-sm">
          <p><span className="font-semibold">Status:</span> {request.status}</p>
          <p><span className="font-semibold">Type:</span> {request.type}</p>
          <p><span className="font-semibold">Project:</span> {request.projectReference}</p>
          <p><span className="font-semibold">Contract:</span> {request.contractReference}</p>
          <p><span className="font-semibold">Dates:</span> {request.startDate} → {request.endDate}</p>
        </div>

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
