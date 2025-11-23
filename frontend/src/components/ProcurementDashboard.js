// src/components/ProcurementDashboard.js
import React from "react";

const ProcurementDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-orange-700 mb-6">
        Procurement Officer Panel
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Active Contracts</h2>
          <p className="text-3xl font-bold text-orange-600 mt-2">6</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Suppliers Engaged</h2>
          <p className="text-3xl font-bold text-orange-600 mt-2">18</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Pending Approvals</h2>
          <p className="text-3xl font-bold text-orange-600 mt-2">4</p>
        </div>
      </div>
    </div>
  );
};

export default ProcurementDashboard;
