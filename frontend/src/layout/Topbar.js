import React from "react";
import { getUsername, getUserRole } from "../utils/auth";

export default function Topbar() {
  const username = getUsername();
  const role = getUserRole();

  return (
    <header className="w-full bg-white/70 backdrop-blur-xl shadow-md p-4 flex justify-between items-center border-b">
      <input
        type="text"
        placeholder="Search..."
        className="px-4 py-2 w-96 rounded-xl bg-white border border-gray-300 focus:ring-2 focus:ring-blue-300 outline-none"
      />

      <div className="font-semibold text-gray-700">
        {username} <span className="text-blue-600">({role})</span>
      </div>
    </header>
  );
}
