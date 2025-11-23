import React from "react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden
      bg-[radial-gradient(circle_at_15%_20%,#c7e6ff,#8ecbff,#63a4ff,#4c7bff,#7da8ff)]"
    >
      {/* DOT PATTERN OVERLAY */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[length:22px_22px] opacity-25"></div>

      {/* BLURRED GLOWING BACKGROUND BLOBS */}
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-300/30 blur-3xl rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-300/25 blur-3xl rounded-full"></div>

      {/* MAIN GLASS CARD */}
      <div className="relative flex w-[900px] max-w-[95%] bg-white/15 backdrop-blur-2xl rounded-[32px] border border-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden">
        
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-12 bg-white/10 backdrop-blur-xl border-b md:border-r border-white/20">

  <h1 className="text-3xl font-semibold text-white/95 mb-4 leading-snug text-center drop-shadow-[0_0_4px_rgba(0,0,0,0.4)]">
    {title}
  </h1>

  <p className="text-white/80 text-center text-base leading-relaxed font-normal max-w-[360px] drop-shadow-[0_0_3px_rgba(0,0,0,0.4)]">
    {subtitle}
  </p>

</div>




        {/* RIGHT FORM AREA */}
        <div className="w-full md:w-1/2 bg-white p-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
