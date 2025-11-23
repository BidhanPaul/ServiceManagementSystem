// src/pages/NotFound.js
import { useNavigate } from "react-router-dom";
import { FiHome, FiAlertCircle } from "react-icons/fi";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center text-blue-900"
      style={{
        background: "linear-gradient(180deg, #A7C4FF, #D1E8FF)",
      }}
    >
      <div className="bg-white/50 backdrop-blur-md rounded-3xl p-10 shadow-xl border border-white/40 max-w-lg">
        
        <FiAlertCircle className="text-blue-700 text-7xl mb-6 drop-shadow-md" />

        <h1 className="text-6xl font-extrabold mb-4">404</h1>

        <p className="text-xl font-medium text-gray-700 mb-6">
          Oops! The page you're looking for doesn't exist.
        </p>

        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 flex items-center justify-center gap-3 bg-blue-600 text-white rounded-xl text-lg hover:bg-blue-700 transition"
        >
          <FiHome className="text-xl" /> Go Back Home
        </button>
      </div>
    </div>
  );
}
