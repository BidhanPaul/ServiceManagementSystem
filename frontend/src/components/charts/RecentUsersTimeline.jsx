import React, { useEffect, useState } from "react";
import API from "../../api/api";
import { FiUser } from "react-icons/fi";

export default function RecentUsersTimeline() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await API.get("/users");

      // Sort by UUID assuming newest first
      const sorted = [...res.data].sort((a, b) => b.id.localeCompare(a.id));

      // Take top 5
      setUsers(sorted.slice(0, 5));
    } catch (err) {
      console.error("Timeline fetch failed", err);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/30 shadow-md rounded-xl p-6 w-full">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">🕒 Recent Signups</h2>

      <div className="relative border-l-2 border-blue-300 pl-6">
        {users.map((user, idx) => (
          <div key={idx} className="mb-6 relative">
            {/* Dot */}
            <span className="absolute -left-[9px] top-2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white"></span>

            <p className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <FiUser /> {user.username}
            </p>

            <p className="text-sm text-gray-600">{user.email}</p>
            <span className="text-xs text-blue-500 font-medium bg-blue-50 px-3 py-1 rounded-full">
              {user.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
