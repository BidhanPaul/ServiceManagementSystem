// src/pages/ManageUsers.js
import React, { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { FiTrash2, FiEdit, FiSearch, FiUsers } from "react-icons/fi";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
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

  const filtered = useMemo(() => {
    return (users || []).filter((u) =>
      (u.username || "").toLowerCase().includes((search || "").toLowerCase())
    );
  }, [users, search]);

  const rolePillClass = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-indigo-100 text-indigo-700 border border-indigo-200";
      case "PROCUREMENT_OFFICER":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "PROJECT_MANAGER":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      case "RESOURCE_PLANNER":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/80 border border-slate-200 shadow-sm">
              <FiUsers className="text-slate-900 text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Manage Users
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                View, search, and manage all system users.
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Total:{" "}
          <span className="font-semibold text-slate-800">{users.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl px-4 py-3 w-full max-w-md">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
            <FiSearch className="text-slate-600 text-lg" />
          </div>

          <input
            placeholder="Search by username..."
            className="outline-none w-full bg-transparent text-slate-800 placeholder-slate-500 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search?.trim() && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="bg-slate-50/80">
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white/60">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {user.username}
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    {user.email}
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold " +
                        rolePillClass(user.role)
                      }
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition flex items-center gap-1.5"
                        onClick={() => alert("Edit user feature pending")}
                        type="button"
                        title="Edit user"
                      >
                        <FiEdit />
                        Edit
                      </button>

                      <button
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm transition flex items-center gap-1.5"
                        onClick={() => handleDelete(user.id)}
                        type="button"
                        title="Delete user"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-600">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-xs text-slate-500 bg-white/60 border-t border-slate-200">
          Showing{" "}
          <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">{users.length}</span>{" "}
          users.
        </div>
      </div>
    </div>
  );
}
