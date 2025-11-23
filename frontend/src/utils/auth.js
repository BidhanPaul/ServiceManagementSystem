// src/utils/auth.js

// Store token
export const setToken = (token) => {
  localStorage.setItem("token", token);
};

// Get token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Remove token (logout helper)
export const removeToken = () => {
  localStorage.removeItem("token");
};

// Safely decode JWT payload
const decodePayload = () => {
  const token = getToken();
  if (!token || !token.includes(".")) return null;

  try {
    const base64 = token.split(".")[1];
    const decoded = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (e) {
    console.error("Failed to decode JWT", e);
    return null;
  }
};

// Get role from different possible JWT formats
export const getUserRole = () => {
  const payload = decodePayload();
  if (!payload) return null;

  // Try common patterns
  let role =
    payload.role || // { role: "ADMIN" }
    (Array.isArray(payload.roles) ? payload.roles[0] : null) || // { roles: ["ADMIN"] }
    (Array.isArray(payload.authorities) ? payload.authorities[0] : null); // { authorities: ["ROLE_ADMIN"] }

  if (!role) return null;

  // Normalize "ROLE_ADMIN" -> "ADMIN"
  if (typeof role === "string" && role.startsWith("ROLE_")) {
    role = role.substring(5);
  }

  return role;
};

// Optional: get username from token
export const getUsername = () => {
  const payload = decodePayload();
  if (!payload) return null;

  // Common fields: "sub" or "username"
  return payload.sub || payload.username || null;
};
