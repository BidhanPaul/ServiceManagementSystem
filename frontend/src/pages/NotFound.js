import { useNavigate } from "react-router-dom";
import { FiHome, FiAlertTriangle } from "react-icons/fi";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(to bottom, #93B5FF, #BFD9FF)",
      }}
    >
      {/* Card */}
      <div className="bg-white/90 shadow-2xl rounded-3xl border border-white/50 p-10 max-w-xl w-full text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-5 rounded-full shadow-md">
            <FiAlertTriangle className="text-blue-700 text-6xl" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
          404
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-700 mb-6">
          The page you're trying to access doesn’t exist or has been moved.
        </p>

        {/* Home Button */}
        <button
          onClick={() => navigate("/")}
          className="
            flex items-center justify-center gap-3
            mx-auto px-6 py-3 
            rounded-xl text-white font-semibold text-lg
            bg-blue-600 hover:bg-blue-700
            shadow-md hover:shadow-lg transition-all
            w-56
          "
        >
          <FiHome className="text-2xl" />
          Go Home
        </button>

        {/* Extra little text */}
        <p className="text-sm text-gray-500 mt-6">
          Need help? Contact your administrator if the issue persists.
        </p>
      </div>
    </div>
  );
}
