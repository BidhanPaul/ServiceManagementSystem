import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-blue-200 to-blue-400">
      {/* LEFT SIDEBAR */}
      <Sidebar />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* FIXED TOP NAV */}
        <div className="sticky top-0 z-30">
          <TopNav />
        </div>

        {/* PAGE CONTENT */}
        <div className="p-6 mt-2">
          {children}
        </div>

      </div>
    </div>
  );
}
