import React from "react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div
      className="
        min-h-screen flex items-center justify-center relative overflow-hidden 
        bg-[radial-gradient(circle_at_20%_20%,#d7ecff,#a6d3ff,#74aaff,#4d7cff)]
      "
    >
      {/* DOT OVERLAY */}
      <div className="
        absolute inset-0 
        bg-[radial-gradient(circle,rgba(255,255,255,0.20)_1px,transparent_1px)] 
        bg-[length:22px_22px] 
        opacity-30
      "></div>

      {/* BLURRED DECORATIVE BLOBS */}
      <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-300/30 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-300/30 blur-3xl rounded-full" />

      {/* MAIN AUTH CARD */}
      <div
        className="
          relative flex w-[900px] max-w-[96%] 
          bg-white/20 backdrop-blur-2xl 
          rounded-[32px] border border-white/30 
          shadow-[0_8px_30px_rgba(0,0,0,0.12)] 
          overflow-hidden
          flex-col md:flex-row
        "
      >
        {/* LEFT SIDE – Title + Subtitle */}
        <div
          className="
            flex flex-col justify-center items-center 
            w-full md:w-1/2 p-12 
            bg-white/10 backdrop-blur-xl 
            border-b md:border-b-0 md:border-r border-white/20
          "
        >
          <h1
            className="
              text-3xl font-semibold text-white drop-shadow 
              mb-4 text-center leading-snug tracking-wide
            "
          >
            {title}
          </h1>

          <p
            className="
              text-white/80 text-center text-base leading-relaxed 
              font-normal max-w-[360px] drop-shadow
            "
          >
            {subtitle}
          </p>
        </div>

        {/* RIGHT SIDE – Form */}
        <div className="w-full md:w-1/2 bg-white p-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
