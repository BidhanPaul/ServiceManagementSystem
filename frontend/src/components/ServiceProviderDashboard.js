// src/components/ServiceProviderDashboard.js
import React from "react";

const ServiceProviderDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-green-700 mb-6">
        Service Provider Panel
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Open Offers</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">12</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Accepted Orders</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">5</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Upcoming Tasks</h2>
          <p className="text-3xl font-bold text-green-600 mt-2">7</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderDashboard;
