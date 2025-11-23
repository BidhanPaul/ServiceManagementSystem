import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">
        <TopNav />  {/* 🔥 Always visible with sidebar */}
        {children}
      </div>
    </div>
  );
}
