import { FiUser, FiHome, FiLogOut } from "react-icons/fi";
import { getUsername, getUserRole, removeToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

export default function TopNav() {
  const username = getUsername() || "User";
  const role = getUserRole() || "GUEST";
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-6 py-4 backdrop-blur-md text-white mb-6">
      {/* User Info */}
      <div className="flex items-center gap-3 font-medium text-blue-600">
        <FiUser />
        <span>
          {username} <span className="text-gray-500">({role})</span>
        </span>
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <FiHome /> Dashboard
        </button>

        <button
          onClick={() => {
            removeToken();
            navigate("/login");
          }}
          className="flex items-center gap-2 text-red-500 hover:text-red-700"
        >
          <FiLogOut /> Logout
        </button>
      </div>
    </div>
  );
}
