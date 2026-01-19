import { FiUser, FiHome, FiLogOut } from "react-icons/fi";
import { getUsername, getUserRole, removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const username = getUsername() || "User";
  const role = getUserRole() || "GUEST";
  const navigate = useNavigate();

  return (
    <div
      className="
        w-full flex items-center justify-between
        px-6 py-4 mb-6
        bg-white/50 backdrop-blur-xl
        shadow-[0_4px_10px_rgba(0,0,0,0.05)]
        border border-white/40 rounded-2xl
      "
    >
      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-full shadow-sm">
          <FiUser className="text-blue-700 text-xl" />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-gray-800 text-sm md:text-base">
            {username}
          </span>
          <span className="text-xs text-blue-600 font-medium">{role}</span>
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center gap-4">

        <button
          onClick={() => navigate("/")}
          className="
            flex items-center gap-2
            bg-white/70 backdrop-blur-md
            px-4 py-2 rounded-xl
            border border-white/50
            shadow-sm
            text-blue-700 font-medium
            hover:bg-white hover:shadow-md
            transition
          "
        >
          <FiHome className="text-lg" />
          Dashboard
        </button>

        <button
          onClick={() => {
            removeToken();
            navigate("/login");
          }}
          className="
            flex items-center gap-2
            bg-red-500 text-white
            px-4 py-2 rounded-xl
            shadow-md hover:bg-red-600
            transition font-medium
          "
        >
          <FiLogOut className="text-lg" />
          Logout
        </button>

      </div>
    </div>
  );
}
