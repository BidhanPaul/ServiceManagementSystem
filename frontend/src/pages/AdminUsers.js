// src/pages/AdminUsers.js
import React, { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { FiSearch, FiEdit, FiTrash2, FiUsers } from "react-icons/fi";
import UserEditModal from "../components/UserEditModal";
import ConfirmDialog from "../components/ConfirmDialog";
import TopNav from "../components/TopNav";
import Sidebar from "../layout/Sidebar";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
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
    const val = e.target.value;
    setSearch(val);
    setFilteredUsers(
      users.filter((u) => u.username.toLowerCase().includes(val.toLowerCase()))
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

  const totalUsers = users.length;

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
    <div className="flex min-h-screen bg-gradient-to-b from-slate-50 via-sky-50 to-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky TopNav */}
        <div className="sticky top-0 z-30">
          <TopNav />
          <div className="h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
        </div>

        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto min-w-0">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white/80 border border-slate-200 shadow-sm">
                    <FiUsers className="text-slate-800 text-xl" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                      User Management
                    </h1>
                    <p className="text-sm text-slate-600 mt-1">
                      Search, edit, and remove user accounts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Total users:{" "}
                <span className="font-semibold text-slate-800">{totalUsers}</span>
              </div>
            </div>

            {/* Search */}
            <div className="mb-5">
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl px-4 py-3 w-full md:w-[520px]">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <FiSearch className="text-slate-600 text-lg" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search by username..."
                  className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-500 text-sm"
                />
                {search?.trim() && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setFilteredUsers(users);
                    }}
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
                <table className="w-full text-sm min-w-[780px]">
                  <thead className="bg-slate-50/80">
                    <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-slate-600">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
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
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(user)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm transition flex items-center gap-1.5"
                                type="button"
                              >
                                <FiEdit />
                                Edit
                              </button>

                              <button
                                onClick={() => setConfirmDelete(user)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 shadow-sm transition flex items-center gap-1.5"
                                type="button"
                              >
                                <FiTrash2 />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* footer */}
              <div className="px-4 py-3 text-xs text-slate-500 bg-white/60 border-t border-slate-200">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredUsers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">{users.length}</span>{" "}
                users.
              </div>
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
        </div>
      </div>
    </div>
  );
}
