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
    <div className="min-h-screen p-8 bg-gradient-to-br from-blue-200 to-blue-400">

      {/* 🔥 Top Navigation (No Sidebar Here) */}
      <TopNav />

      <h1 className="text-3xl font-bold text-blue-800 mb-6">
        👥 User Management
      </h1>

      {/* Search Bar */}
      <div className="flex items-center bg-white/30 backdrop-blur-xl border border-white/50 shadow-md rounded-xl px-4 py-2 mb-6 w-1/2">
        <FiSearch className="text-gray-600 text-xl mr-3" />
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search users..."
          className="w-full bg-transparent outline-none text-gray-800"
        />
      </div>

      {/* Users Table */}
      <table className="w-full bg-white/40 backdrop-blur-xl rounded-xl overflow-hidden shadow-md">
        <thead className="bg-blue-600 text-white">
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
              <td colSpan="4" className="p-5 text-center text-gray-500">
                No users found
              </td>
            </tr>
          ) : (
            filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 hover:bg-white/60 transition"
              >
                <td className="p-3">{user.username}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 font-semibold text-blue-700">{user.role}</td>

                <td className="flex justify-center gap-4 p-3">
                  <FiEdit
                    className="text-blue-600 cursor-pointer text-xl hover:scale-110"
                    onClick={() => openEditModal(user)}
                  />
                  <FiTrash2
                    className="text-red-500 cursor-pointer text-xl hover:scale-110"
                    onClick={() => setConfirmDelete(user)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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
