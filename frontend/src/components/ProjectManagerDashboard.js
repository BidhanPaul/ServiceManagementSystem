// src/components/ProjectManagerDashboard.js
import React from "react";

const ProjectManagerDashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-purple-700 mb-6">
        Project Manager Panel
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Projects Overseen</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">8</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Open Service Requests</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">5</p>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="font-semibold text-gray-800">Upcoming Deadlines</h2>
          <p className="text-3xl font-bold text-purple-600 mt-2">3</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectManagerDashboard;
