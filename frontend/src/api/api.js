// src/api/api.js
import axios from "axios";

// Centralized API configuration constants
const API_BASE_URL = "http://localhost:8080/api";
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

// Create an Axios instance
const API = axios.create({
  baseURL: API_BASE_URL, // Base URL for backend services
  headers: DEFAULT_HEADERS,
  timeout: 10000, // Prevent hanging requests (10s timeout)
});

// Optional: Add request interceptor to attach token if authentication is enabled
API.interceptors.request.use(
  (config) => {
    // Attach JWT token from localStorage if present
    const token = localStorage.getItem("token");

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Tag request with timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add response interceptor for global error handling & logging
API.interceptors.response.use(
  (response) => {
    // Calculate request duration (for future performance monitoring)
    if (response.config?.metadata?.startTime) {
      const duration =
        new Date() - response.config.metadata.startTime;
      console.debug("API call duration:", duration, "ms");
    }

    return response;
  },
  (error) => {
    // Centralized error logging
    console.error("API ERROR:", error.response || error);

    return Promise.reject(error);
  }
);

export default API;
