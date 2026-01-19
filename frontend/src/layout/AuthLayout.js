// src/layout/AuthLayout.js
import React from "react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100">
      {/* subtle background blobs (enterprise feel) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-200/20 blur-3xl" />
      </div>

      {/* subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      {/* MAIN AUTH CARD */}
      <div
        className="
          relative w-[980px] max-w-[94%]
          rounded-[28px] overflow-hidden
          bg-white/70 backdrop-blur-2xl
          border border-white/60
          shadow-[0_18px_50px_rgba(2,6,23,0.12)]
          flex flex-col md:flex-row
        "
      >
        {/* LEFT SIDE – Title + Subtitle */}
        <div
          className="
            w-full md:w-[44%]
            px-8 py-10 sm:px-10 sm:py-12
            bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-900
            text-white
            relative
          "
        >
          {/* subtle shine */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.18),transparent_55%)]" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/15 px-3 py-2 mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
              <span className="text-xs font-semibold tracking-wide text-white/90">
                Service Portal
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight">
              {title}
            </h1>

            <p className="mt-4 text-white/80 text-sm sm:text-base leading-relaxed max-w-[420px]">
              {subtitle}
            </p>

            {/* small value props */}
            <div className="mt-8 grid grid-cols-1 gap-3 text-xs text-white/80">
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                Secure access with role-based dashboards
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                Track requests, offers, and approvals in one place
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – Form */}
        <div className="w-full md:w-[56%] bg-white/80 px-6 py-8 sm:px-10 sm:py-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
