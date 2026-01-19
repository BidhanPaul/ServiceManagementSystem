// src/pages/ManageUsers.js

import React, { useEffect, useState } from "react";
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
    <div className="p-6 bg-gradient-to-b from-blue-100 via-sky-100 to-blue-300 min-h-screen">
      {/* Header */}
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
        Manage Users
      </h1>
      <p className="text-sm text-slate-600 mb-6">
        View, search, and manage all system users.
      </p>

      {/* Search */}
      <div className="flex items-center bg-white/70 backdrop-blur-md border border-white/70 shadow-sm rounded-xl px-4 py-2 w-full max-w-md">
        <FiSearch className="text-gray-400 mr-3 text-lg" />
        <input
          placeholder="Search users..."
          className="outline-none w-full bg-transparent text-slate-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table Container */}
      <div className="mt-6 bg-white/60 backdrop-blur-md rounded-2xl shadow-md border border-white/70 overflow-hidden">
        
        {/* Table Header */}
        <div className="grid grid-cols-4 bg-slate-100/70 text-slate-700 font-semibold py-3 px-4 border-b">
          <div>Username</div>
          <div>Email</div>
          <div>Role</div>
          <div className="text-center">Actions</div>
        </div>

        {/* List */}
        {filtered.map((user, idx) => (
          <div
            key={user.id}
            className={`grid grid-cols-4 px-4 py-3 text-slate-700 ${
              idx !== filtered.length - 1 ? "border-b border-slate-200/50" : ""
            } hover:bg-white/40 transition`}
          >
            <div className="flex items-center">{user.username}</div>
            <div className="flex items-center">{user.email}</div>
            <div className="flex items-center">
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                {user.role}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <button
                className="text-blue-600 hover:text-blue-800 transition"
                onClick={() => alert("Edit user feature pending")}
              >
                <FiEdit size={18} />
              </button>
              <button
                className="text-red-600 hover:text-red-800 transition"
                onClick={() => handleDelete(user.id)}
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-6 text-center text-slate-500 text-sm">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
