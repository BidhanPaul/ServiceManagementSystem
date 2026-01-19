// src/api/api.js
import axios from "axios";

// Create an Axios instance
const API = axios.create({
  baseURL: "http://localhost:8080/api", // Base URL for your backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add request interceptor to attach token if you implement authentication later
API.interceptors.request.use(
  (config) => {
    // Example: attach JWT token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Add response interceptor for global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here
    console.error("API ERROR:", error.response || error);
    return Promise.reject(error);
  }
);


API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // DEBUG (remove later)
    console.log("[API]", config.method?.toUpperCase(), config.url, "AUTH?", !!config.headers.Authorization);

    return config;
  },
  (error) => Promise.reject(error)
);


export default API;
