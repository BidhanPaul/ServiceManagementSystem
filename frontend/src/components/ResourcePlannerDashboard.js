import React, { useEffect, useState, useCallback, useMemo } from "react";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

export default function ResourcePlannerDashboard() {
    const [requests, setRequests] = useState([]);
    const [offersByRequest, setOffersByRequest] = useState({});
    const [loading, setLoading] = useState(true);

    // Load requests
    const loadRequests = useCallback(async () => {
        try {
            const res = await API.get("/requests");
            setRequests(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to load requests", err);
            setRequests([]);
        }
    }, []);

    // Load offers for each request
    const loadOffers = useCallback(async (reqs) => {
        try {
            const list = await Promise.all(
                reqs.map((r) =>
                    API.get(`/requests/${r.id}/offers`).then((res) => ({
                        id: r.id,
                        offers: Array.isArray(res.data) ? res.data : [],
                    }))
                )
            );

            const map = list.reduce((acc, x) => {
                acc[x.id] = x.offers;
                return acc;
            }, {});

            setOffersByRequest(map);
        } catch (err) {
            console.error("Failed to load offers", err);
            setOffersByRequest({});
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadRequests();
            setLoading(false);
        };
        init();
    }, [loadRequests]);

    useEffect(() => {
        if (requests.length) {
            loadOffers(requests);
        } else {
            setOffersByRequest({});
        }
    }, [requests, loadOffers]);

    const approveFinal = useCallback(
        async (offerId) => {
            try {
                await API.post(`/resource-planner/approve/${offerId}`);
                toast.success("Final approval given");
                loadRequests();
            } catch (err) {
                console.error("Final approval failed", err);
                toast.error("Failed to approve");
            }
        },
        [loadRequests]
    );

    const hasRequests = useMemo(() => requests.length > 0, [requests]);

    return (
        <div className="flex">
            <Sidebar />

            <div className="flex-1 min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">
                <TopNav />

                <h1 className="text-3xl font-bold text-white mb-6">
                    Resource Planner Panel
                </h1>

                {/* Loading */}
                {loading && <p className="text-white/80">Loading...</p>}

                {/* REQUESTS LIST */}
                {!loading && (
                    <div className="bg-white/80 rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Requests Requiring Final Approval
                        </h2>

                        {!hasRequests ? (
                            <p className="text-gray-600">No requests found.</p>
                        ) : (
                            <div className="space-y-5">
                                {requests.map((r) => {
                                    const offers = offersByRequest[r.id] || [];

                                    return (
                                        <div
                                            key={r.id}
                                            className="border border-gray-200 rounded-xl p-4 bg-white/60 backdrop-blur-sm"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-lg">
                                                        {r.title}
                                                    </p>
                                                    <p className="text-gray-600 text-sm">
                                                        Status:{" "}
                                                        <span className="font-semibold">{r.status}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Offers */}
                                            <h3 className="font-semibold text-gray-700 mt-3 mb-1">
                                                Offers Received:
                                            </h3>

                                            {offers.length === 0 ? (
                                                <p className="text-xs text-gray-500">
                                                    No offers submitted.
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {offers.map((o) => (
                                                        <div
                                                            key={o.id}
                                                            className="p-3 border rounded-lg bg-white/70 flex justify-between items-center"
                                                        >
                                                            <div>
                                                                <p className="font-semibold text-gray-800">
                                                                    {o.specialistName}
                                                                </p>
                                                                <p className="text-gray-600 text-sm">
                                                                    {o.supplierName} – {o.dailyRate} €/day
                                                                </p>
                                                            </div>

                                                            <button
                                                                onClick={() => approveFinal(o.id)}
                                                                className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
                                                            >
                                                                Final Approve
                                                            </button>
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
                )}
            </div>
        </div>
    );
}
