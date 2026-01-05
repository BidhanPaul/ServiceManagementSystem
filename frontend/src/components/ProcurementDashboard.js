// src/components/ProcurementDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../layout/Sidebar";
import TopNav from "./TopNav";
import API from "../api/api";
import { toast } from "react-toastify";

const ProcurementDashboard = () => {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [requests, setRequests] = useState([]);
    const [offersByRequestId, setOffersByRequestId] = useState({});
    const [loading, setLoading] = useState(true);

    // contact PM modal
    const [contactOpen, setContactOpen] = useState(false);
    const [contactMessage, setContactMessage] = useState("");
    const [contactTargetRequest, setContactTargetRequest] = useState(null);

    // reject modal
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectTargetRequest, setRejectTargetRequest] = useState(null);

    const currentUsername = localStorage.getItem("username");

    // -------- LOAD DATA --------

  const loadProjectsFromMock = async () => {
        try {
      const res = await fetch(
        "https://69233a5309df4a492324c022.mockapi.io/Projects"
      );
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load projects from mockapi", err);
    }
  };

  const loadContractsFromMock = async () => {
    try {
      const res = await fetch(
        "https://69233a5309df4a492324c022.mockapi.io/Contracts"
      );
      const data = await res.json();
      setContracts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load contracts from mockapi", err);
        }
  };

  const loadRequests = async () => {
        try {
            const res = await API.get("/requests");
      setRequests(res.data || []);
        } catch (err) {
            console.error("Failed to load requests", err);
        }
  };

  const loadOffersForRequests = async (reqs) => {
        try {
            const promises = reqs.map((r) =>
                API.get(`/requests/${r.id}/offers`).then((res) => ({
                    requestId: r.id,
          offers: res.data || [],
                }))
            );

            const results = await Promise.all(promises);

            const map = results.reduce((acc, entry) => {
                acc[entry.requestId] = entry.offers;
                return acc;
            }, {});

            setOffersByRequestId(map);
        } catch (err) {
            console.error("Failed to load offers for requests", err);
            setOffersByRequestId({});
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([loadProjectsFromMock(), loadContractsFromMock(), loadRequests()]);
            setLoading(false);
        };
        init();
    }, [loadProjectsFromMock, loadContractsFromMock, loadRequests]);

    useEffect(() => {
        if (requests.length > 0) {
            loadOffersForRequests(requests);
        } else {
            setOffersByRequestId({});
        }
    }, [requests, loadOffersForRequests]);

    // -------- HELPERS --------

    const statusBadgeClass = useCallback((status) => {
        switch (status) {
            case "DRAFT":
                return "bg-gray-100 text-gray-700 border border-gray-200";
            case "IN_REVIEW":
                return "bg-amber-50 text-amber-700 border border-amber-200";
            case "APPROVED_FOR_BIDDING":
                return "bg-blue-50 text-blue-700 border border-blue-200";
            case "BIDDING":
                return "bg-purple-50 text-purple-700 border border-purple-200";
            case "ORDERED":
                return "bg-emerald-50 text-emerald-700 border border-emerald-200";
            case "REJECTED":
                return "bg-red-50 text-red-700 border border-red-200";
            default:
                return "bg-gray-50 text-gray-700 border border-gray-200";
        }
    }, []);

    const projectLabel = useCallback(
        (req) => {
            if (!req.projectIds || req.projectIds.length === 0) return "-";
            const id = req.projectIds[0];
            const proj = projects.find((p) => p.id === id);
            if (!proj) return id;
            return `${proj.customer} � ${proj.name}`;
        },
        [projects]
    );

    const contractLabel = useCallback(
        (req) => {
            if (!req.contractIds || req.contractIds.length === 0) return "-";
            const id = req.contractIds[0];
            const c = contracts.find((x) => x.id === id);
            if (!c) return id;
            return `${c.supplier} � ${c.domain}`;
        },
        [contracts]
    );

    const pendingRequests = useMemo(
        () => requests.filter((r) => r.status === "IN_REVIEW"),
        [requests]
    );

    const totalOffers = useMemo(
        () =>
            Object.values(offersByRequestId).reduce(
                (acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0),
                0
            ),
        [offersByRequestId]
    );

// (rest of your file stays the same below...)
