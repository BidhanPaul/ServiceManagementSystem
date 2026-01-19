// src/layout/MainLayout.js
import Sidebar from "../layout/Sidebar";
import TopNav from "../components/TopNav";

export default function MainLayout({ children }) {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100">
      {/* subtle background decoration (enterprise feel) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {/* LEFT SIDEBAR */}
      <div className="relative z-10">
        <Sidebar />
      </div>

      {/* MAIN AREA */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* STICKY TOP NAV */}
        <div className="sticky top-0 z-30">
          {/* tiny separator glow under top nav */}
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
          <TopNav />
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
