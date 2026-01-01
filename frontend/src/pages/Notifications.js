// src/pages/Notifications.js

import { useEffect, useState, useCallback } from "react";
import API from "../api/api";
import TopNav from "../components/TopNav";
import { FiBell, FiCheckCircle } from "react-icons/fi";

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);

    // User context (retrieved once)
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role"); // ADMIN, PM, PO, RP

    // ---------------------------------------------------------
    // LOAD NOTIFICATIONS BASED ON USER ROLE
    // ---------------------------------------------------------
    const loadNotifications = useCallback(async () => {
        if (!role) {
            console.warn("User role not found. Skipping notifications fetch.");
            return;
        }

        try {
            let endpoint = `/notifications/${role}`;

            if (role === "ADMIN") {
                endpoint = "/notifications/admin";
            }

            const res = await API.get(endpoint);
            setNotifications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to load notifications", e
