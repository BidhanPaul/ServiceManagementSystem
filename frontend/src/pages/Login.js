// src/pages/Login.js

import React, { useState } from "react";
import { FiUser, FiLock, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/api";
import { setToken } from "../utils/auth";
import AuthLayout from "../layout/AuthLayout";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const isFormValid = username && password;

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      toast.dismiss();

      const res = await API.post("/auth/login", {
        username,
        password,
      });

      setToken(res.data.token);
      localStorage.setItem("username", res.data.username);
      localStorage.setItem("role", res.data.role);

      toast.success("Logged in successfully!", {
        toastId: "login_success",
      });

      navigate("/");
    } catch (err) {
      toast.dismiss();

      const message =
        err.response?.data?.message ||
        err.response?.data ||
        "Login failed.";

      toast.error(message, { toastId: "login_error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your dashboard and continue your work."
    >
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
        Login
      </h2>

      <form onSubmit={handleLogin} className="space-y-6">

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
          {loading ? "Processing..." : "Login"} {!loading && <FiArrowRight />}
        </button>
      </form>

      {/* Redirect link */}
      <p className="text-center mt-6 text-gray-700">
        Don’t have an account?{" "}
        <span
          className="text-blue-600 cursor-pointer hover:underline font-medium"
          onClick={() => navigate("/register")}
        >
          Register
        </span>
      </p>
    </AuthLayout>
  );
};

export default Login;
