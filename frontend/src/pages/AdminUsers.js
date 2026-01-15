import React, { useEffect, useState } from "react";
import API from "../api/api";
import { FiSearch, FiEdit, FiTrash2 } from "react-icons/fi";
import UserEditModal from "../components/UserEditModal";
import ConfirmDialog from "../components/ConfirmDialog";
import TopNav from "../components/TopNav";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setFilteredUsers(
      users.filter((u) =>
        u.username.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowEdit(true);
  };

  const deleteUser = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      fetchUsers();
      setConfirmDelete(null);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-6">

      {/* Top Navigation */}
      <TopNav />

      {/* Page Header */}
      <h1 className="text-3xl font-bold text-white drop-shadow mt-4 mb-6">
        👥 User Management
      </h1>

      {/* SEARCH BAR */}
      <div className="flex items-center bg-white/50 backdrop-blur-xl border border-white/40 shadow-lg rounded-xl px-4 py-3 mb-8 w-full md:w-1/2">
        <FiSearch className="text-gray-700 text-xl mr-3" />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search users..."
          className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-600"
        />
      </div>

      {/* USER TABLE */}
      <div className="bg-white/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-700/80 text-white">
            <tr>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-600">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/40 hover:bg-white/70 transition"
                >
                  <td className="p-3 font-medium">{user.username}</td>
                  <td className="p-3">{user.email}</td>

                  <td className="p-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {user.role}
                    </span>
                  </td>

                  <td className="p-3 flex justify-center gap-3">
                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => openEditModal(user)}
                      className="
                        px-3 py-1 rounded-lg text-xs font-semibold 
                        bg-blue-600 text-white shadow hover:bg-blue-700 flex items-center gap-1
                      "
                    >
                      <FiEdit /> Edit
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => setConfirmDelete(user)}
                      className="
                        px-3 py-1 rounded-lg text-xs font-semibold 
                        bg-red-600 text-white shadow hover:bg-red-700 flex items-center gap-1
                      "
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setShowEdit(false)}
          refresh={fetchUsers}
        />
      )}

      {/* CONFIRM DELETE */}
      {confirmDelete && (
        <ConfirmDialog
          message={`Delete user "${confirmDelete.username}"?`}
          onConfirm={() => deleteUser(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
