import { FiSearch, FiUser } from "react-icons/fi";
import { getUsername, getUserRole } from "../utils/auth";

export default function Navbar() {
  const username = getUsername();
  const role = getUserRole();

  return (
    <div
      className="
        sticky top-0 z-30
        bg-white/50 backdrop-blur-xl
        border-b border-white/40
        shadow-[0_4px_15px_rgba(0,0,0,0.05)]
        flex items-center justify-between px-6 py-4
      "
    >
      {/* Search Bar */}
      <div
        className="
          flex items-center gap-3
          bg-white/70 backdrop-blur-md
          px-4 py-2 w-80
          rounded-full border border-white/60
          shadow-sm
        "
      >
        <FiSearch className="text-gray-500 text-lg" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent w-full outline-none text-gray-700"
        />
      </div>

      {/* User Info */}
      <div
        className="
          flex items-center gap-3
          bg-white/60 backdrop-blur-lg
          px-4 py-2 rounded-full
          border border-white/50
          shadow-sm
          text-gray-700
        "
      >
        <div className="bg-blue-100 p-2 rounded-full">
          <FiUser className="text-blue-700 text-xl" />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-gray-800">{username}</span>
          <span className="text-xs font-medium text-blue-700">{role}</span>
        </div>
      </div>
    </div>
  );
}
