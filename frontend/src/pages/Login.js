import React, { useState } from "react";
import { FiUser, FiLock } from "react-icons/fi";
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

      // Backend returns { token, username, role }
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
      subtitle="Sign in to access your dashboard, manage services, and continue where you left off."
    >
      <h2 className="text-3xl font-bold text-center text-blue-700 mb-8">
        Login
      </h2>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Username */}
        <div className="relative">
          <FiUser className="absolute left-3 top-3 text-gray-500 text-lg" />
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none"
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <FiLock className="absolute left-3 top-3 text-gray-500 text-lg" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className={`w-full py-2 rounded-lg font-semibold transition
            ${
              isFormValid && !loading
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-300 cursor-not-allowed"
            }`}
        >
          {loading ? "Processing..." : "Login"}
        </button>
      </form>

      {/* Redirect link */}
      <p className="text-center mt-6 text-gray-600">
        Don’t have an account?{" "}
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => navigate("/register")}
        >
          Register
        </span>
      </p>
    </AuthLayout>
  );
};

export default Login;
