// src/pages/Dashboard.js
import { getUserRole } from "../utils/auth";

import AdminDashboard from "../components/AdminDashboard";
import ProjectManagerDashboard from "../components/ProjectManagerDashboard";
import ProcurementDashboard from "../components/ProcurementDashboard";
import ServiceProviderDashboard from "../components/ServiceProviderDashboard";

export default function Dashboard() {
  const role = getUserRole();

  switch (role) {
    case "ADMIN":
      return <AdminDashboard />;

    case "PROJECT_MANAGER":
      return <ProjectManagerDashboard />;

    case "PROCUREMENT_OFFICER":
      return <ProcurementDashboard />;

    case "SERVICE_PROVIDER":
      return <ServiceProviderDashboard />;

    default:
      return <div className="text-red-500 p-6">Unknown role: {role}</div>;
  }
}
