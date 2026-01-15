// src/pages/Register.js

import React, { useState } from "react";
import {
  FiUser,
  FiLock,
  FiMail,
  FiCalendar,
  FiUsers,
  FiArrowRight,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/api";
import AuthLayout from "../layout/AuthLayout";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SERVICE_PROVIDER");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isFormValid =
    username && password && email && dateOfBirth && role;

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      toast.dismiss();

      await API.post("/auth/register", {
        username,
        password,
        email,
        dateOfBirth,
        role,
      });

      toast.success("Registration successful!", {
        toastId: "register_success",
      });

      navigate("/login");
    } catch (err) {
      toast.dismiss();

      const message =
        err.response?.data?.message ||
        err.response?.data ||
        "Registration failed";

      toast.error(message, { toastId: "register_error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join the platform and manage your workflow in a seamless environment."
    >
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
        Register
      </h2>

      <form onSubmit={handleRegister} className="space-y-6">

        {/* Username */}
        <div className="relative">
          <FiUser className="absolute left-4 top-3.5 text-gray-600 text-lg z-10 pointer-events-none" />
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="
              w-full rounded-xl bg-white/60 backdrop-blur-md
              border border-white/60 px-12 py-3 shadow-sm
              focus:ring-2 focus:ring-blue-300 focus:border-blue-400
              placeholder-gray-500 text-gray-800 outline-none transition
            "
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <FiLock className="absolute left-4 top-3.5 text-gray-600 text-lg z-10 pointer-events-none" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full rounded-xl bg-white/60 backdrop-blur-md
              border border-white/60 px-12 py-3 shadow-sm
              focus:ring-2 focus:ring-blue-300 focus:border-blue-400
              placeholder-gray-500 text-gray-800 outline-none transition
            "
            required
          />
        </div>

        {/* Email */}
        <div className="relative">
          <FiMail className="absolute left-4 top-3.5 text-gray-600 text-lg z-10 pointer-events-none" />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full rounded-xl bg-white/60 backdrop-blur-md
              border border-white/60 px-12 py-3 shadow-sm
              focus:ring-2 focus:ring-blue-300 focus:border-blue-400
              placeholder-gray-500 text-gray-800 outline-none transition
            "
            required
          />
        </div>

        {/* Date of Birth */}
        <div className="relative">
          <FiCalendar className="absolute left-4 top-3.5 text-gray-600 text-lg z-10 pointer-events-none" />
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="
              w-full rounded-xl bg-white/60 backdrop-blur-md
              border border-white/60 px-12 py-3 shadow-sm
              focus:ring-2 focus:ring-blue-300 focus:border-blue-400
              text-gray-800 outline-none transition
            "
            required
          />
        </div>

        {/* Role Selection */}
        <div className="relative">
          <FiUsers className="absolute left-4 top-3.5 text-gray-600 text-lg z-10 pointer-events-none" />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="
              w-full rounded-xl pl-12 py-3 bg-white/60 backdrop-blur-md
              border border-white/60 shadow-sm
              focus:ring-2 focus:ring-blue-300 focus:border-blue-400
              text-gray-800 font-medium outline-none transition
            "
          >
            <option value="ADMIN">👑 Admin</option>
            <option value="PROJECT_MANAGER">🛠 Project Manager</option>
            <option value="PROCUREMENT_OFFICER">📦 Procurement Officer</option>
            <option value="RESOURCE_PLANNER">📅 Resource Planner</option>
            <option value="SERVICE_PROVIDER">🔧 Service Provider</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg flex items-center justify-center gap-2
            transition-all ${
              isFormValid && !loading
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {loading ? "Processing..." : "Register"} {!loading && <FiArrowRight />}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-700">
        Already have an account?{" "}
        <span
          className="text-blue-600 cursor-pointer hover:underline font-medium"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </AuthLayout>
  );
};

export default Register;
