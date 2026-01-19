// src/components/ServiceProviderDashboard.js
import React, { memo } from "react";

const StatCard = memo(function StatCard({ title, value }) {
    return (
        <div
            className="bg-white shadow-md rounded-xl p-6"
            role="group"
            aria-label={title}
        >
            <h2 className="font-semibold text-gray-800">{title}</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">{value}</p>
        </div>
    );
});

const ServiceProviderDashboard = () => {
    const stats = [
        { title: "Open Offers", value: 12 },
        { title: "Accepted Orders", value: 5 },
        { title: "Upcoming Tasks", value: 7 },
    ];

    return (
        <section aria-label="Service Provider Dashboard">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-green-700">
                    Service Provider Panel
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Quick overview of your current offers, orders, and upcoming work.
                </p>
            </head
