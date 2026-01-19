// src/pages/Login.js
import React, { useMemo, useState } from "react";
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
  const isFormValid = useMemo(() => !!(username && password), [username, password]);

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
      title="Welcome back"
      subtitle="Sign in to continue to the Service Portal."
    >
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center">
          Sign in
        </h2>
        <p className="text-center text-sm text-slate-600 mt-1">
          Use your work account credentials.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Username */}
        <div className="relative">
          <FiUser className="absolute left-4 top-3.5 text-slate-500 text-lg z-10 pointer-events-none" />
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className="
              w-full rounded-2xl bg-white/80 backdrop-blur-xl
              border border-slate-200 px-12 py-3
              shadow-sm
              focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
              placeholder-slate-400 text-slate-900 outline-none transition
            "
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <FiLock className="absolute left-4 top-3.5 text-slate-500 text-lg z-10 pointer-events-none" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="
              w-full rounded-2xl bg-white/80 backdrop-blur-xl
              border border-slate-200 px-12 py-3
              shadow-sm
              focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
              placeholder-slate-400 text-slate-900 outline-none transition
            "
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={
            "w-full py-3 rounded-2xl font-semibold text-white shadow-sm " +
            "flex items-center justify-center gap-2 transition " +
            (isFormValid && !loading
              ? "bg-slate-900 hover:bg-slate-800"
              : "bg-slate-300 cursor-not-allowed")
          }
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              Login <FiArrowRight />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-500">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-slate-700">
        Don’t have an account?{" "}
        <span
          className="text-indigo-700 cursor-pointer hover:underline font-semibold"
          onClick={() => navigate("/register")}
          role="button"
          tabIndex={0}
        >
          Register
        </span>
      </p>
    </AuthLayout>
  );
};

export default Login;
