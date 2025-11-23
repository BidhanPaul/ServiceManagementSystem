// src/components/Navbar.js
import { FiSearch, FiUser } from "react-icons/fi";
import { getUsername, getUserRole } from "../utils/auth";

export default function Navbar() {
  const username = getUsername();
  const role = getUserRole();

  return (
    <div className="flex justify-between items-center p-4 shadow-sm bg-white/70 backdrop-blur-xl sticky top-0">
      {/* SEARCH BAR */}
      <div className="flex items-center bg-white/60 border rounded-full px-4 py-2 gap-2 w-80 shadow-sm">
        <FiSearch className="text-gray-500" />
        <input type="text" placeholder="Search..." className="w-full bg-transparent outline-none" />
      </div>

      {/* USER INFO */}
      <div className="flex items-center gap-2 text-gray-700 font-medium">
        <FiUser className="text-xl" />
        {username} <span className="text-sm text-blue-600 font-semibold">({role})</span>
      </div>
    </div>
  );
}
