// src/pages/NotFound.js
import { useNavigate } from "react-router-dom";
import { FiHome, FiAlertTriangle } from "react-icons/fi";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100 relative overflow-hidden">
      {/* soft blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/25 blur-3xl" />
      </div>

      {/* card */}
      <div className="relative w-full max-w-2xl bg-white/80 backdrop-blur-2xl border border-slate-200 rounded-[28px] shadow-[0_18px_50px_rgba(2,6,23,0.12)] overflow-hidden">
        {/* header strip */}
        <div className="h-2 bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-600" />

        <div className="p-8 sm:p-10 text-center">
          {/* icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-sm ring-1 ring-white/20">
              <FiAlertTriangle className="text-4xl" />
            </div>
          </div>

          {/* title */}
          <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
            404
          </h1>

          {/* subtitle */}
          <p className="text-base sm:text-lg text-slate-600 mt-3">
            The page you’re looking for doesn’t exist or was moved.
          </p>

          {/* actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="
                inline-flex items-center justify-center gap-2
                px-6 py-3 rounded-2xl
                bg-slate-900 text-white font-semibold
                hover:bg-slate-800 transition
                shadow-sm
                w-full sm:w-auto
              "
              type="button"
            >
              <FiHome className="text-xl" />
              Go to Dashboard
            </button>

            <button
              onClick={() => window.history.back()}
              className="
                inline-flex items-center justify-center
                px-6 py-3 rounded-2xl
                bg-white/80 text-slate-800 font-semibold
                border border-slate-200
                hover:bg-white transition
                shadow-sm
                w-full sm:w-auto
              "
              type="button"
            >
              Go Back
            </button>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            If you think this is a mistake, contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
