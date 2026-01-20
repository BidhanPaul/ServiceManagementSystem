// src/api/api.js
import axios from "axios";

/**
 * Use env var in production and localhost in dev.
 *
 * CRA:   REACT_APP_API_BASE_URL
 * Vite:  VITE_API_BASE_URL
 *
 * Example Render value (IMPORTANT: no trailing slash):
 *   https://servicemanagementsystem-1-2s7d.onrender.com
 */
const API_BASE_URL_RAW =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "http://localhost:8080";

// ✅ FIX: Remove trailing slashes so we never produce //api
const API_BASE_URL = String(API_BASE_URL_RAW).replace(/\/+$/, "");

// Create an Axios instance
const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token (kept) + debug (kept)
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // DEBUG (remove later)
    console.log(
      "[API]",
      config.method?.toUpperCase(),
      config.baseURL ? `${config.baseURL}${config.url}` : config.url,
      "AUTH?",
      !!config.headers.Authorization
    );

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: global error handling (kept)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response || error);
    return Promise.reject(error);
  }
);

export default API;
