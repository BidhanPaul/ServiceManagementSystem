import React, { useState } from "react";
import API from "../api/api";

export default function UserEditModal({ user, onClose, refresh }) {
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    dob: user.dob || "",
    role: user.role,
    password: "" // optional
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await API.put(`/users/${user.id}`, form);
      refresh();
      onClose();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[400px] space-y-4">

        <h2 className="text-xl font-bold text-blue-600">Edit User</h2>

        <input name="username" value={form.username} onChange={handleChange}
               className="border p-2 w-full rounded" placeholder="Username" />

        <input name="email" value={form.email} onChange={handleChange}
               className="border p-2 w-full rounded" placeholder="Email" />

        <input type="date" name="dob" value={form.dob} onChange={handleChange}
               className="border p-2 w-full rounded" />

        <select name="role" value={form.role} onChange={handleChange}
                className="border p-2 w-full rounded">
          <option value="ADMIN">ADMIN</option>
          <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
          <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER</option>
          <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
        </select>

        <input type="password" name="password" value={form.password} onChange={handleChange}
               className="border p-2 w-full rounded" placeholder="New Password (optional)" />

        <div className="flex justify-end gap-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
