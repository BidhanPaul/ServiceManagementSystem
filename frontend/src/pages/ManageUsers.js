aimport React, { useEffect, useState } from "react";
import API from "../api/api";
import { FiTrash2, FiEdit, FiSearch } from "react-icons/fi";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const res = await API.get("/users");
    setUsers(res.data);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await API.delete(`/users/${id}`);
    fetchUsers();
  };

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Manage Users</h1>

      {/* Search Bar */}
      <div className="flex items-center border rounded-lg px-4 py-2 w-80 bg-white shadow">
        <FiSearch className="text-gray-400 mr-3" />
        <input
          placeholder="Search users..."
          className="outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <table className="w-full mt-6 bg-white shadow-md rounded-xl overflow-hidden">
        <thead className="bg-blue-50 text-gray-700">
          <tr>
            <th className="py-3 px-4 text-left">Username</th>
            <th className="py-3 px-4 text-left">Email</th>
            <th className="py-3 px-4 text-left">Role</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">{user.username}</td>
              <td className="py-3 px-4">{user.email}</td>
              <td className="py-3 px-4">{user.role}</td>
              <td className="py-3 px-4 flex justify-center gap-4">
                <button className="text-blue-600 hover:text-blue-800">
                  <FiEdit size={18} />
                </button>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDelete(user.id)}
                >
                  <FiTrash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
