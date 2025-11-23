import React, { useState } from "react";
import {
  FiUser,
  FiLock,
  FiMail,
  FiCalendar,
  FiUsers,
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
  const isFormValid = username && password && email && dateOfBirth && role;

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      toast.dismiss();

      // IMPORTANT: use /auth/register (not /users/register)
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
      subtitle="Join the platform and start managing service workflows efficiently across teams."
    >
      <h2 className="text-3xl font-semibold text-center text-blue-700 mb-8">
        Register
      </h2>

      <form onSubmit={handleRegister} className="space-y-5">
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

        {/* Email */}
        <div className="relative">
          <FiMail className="absolute left-3 top-3 text-gray-500 text-lg" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none"
            required
          />
        </div>

        {/* Date of Birth */}
        <div className="relative">
          <FiCalendar className="absolute left-3 top-3 text-gray-500 text-lg" />
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full border border-gray-300 rounded-lg pl-10 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none"
            required
          />
        </div>

        {/* Role Selection — Glass + Emojis */}
        <div className="relative">
          <FiUsers className="absolute left-3 top-3 text-gray-500 text-lg" />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="
              w-full pl-10 py-2 rounded-xl
              bg-white/30 backdrop-blur-xl
              border border-white/50
              shadow-[0_4px_15px_rgba(0,0,0,0.08)]
              focus:ring-2 focus:ring-blue-300 focus:border-blue-500
              outline-none text-gray-800 font-medium transition
            "
          >
            <option value="ADMIN">👑 Admin</option>
            <option value="PROJECT_MANAGER">🛠 Project Manager</option>
            <option value="PROCUREMENT_OFFICER">
              📦 Procurement Officer
            </option>
            <option value="SERVICE_PROVIDER">🔧 Service Provider</option>
          </select>
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
          {loading ? "Processing..." : "Register"}
        </button>
      </form>

      <p className="text-center mt-6 text-gray-600">
        Already have an account?{" "}
        <span
          className="text-blue-600 cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>
    </AuthLayout>
  );
};

export default Register;
