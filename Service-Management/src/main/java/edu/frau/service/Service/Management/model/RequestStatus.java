package edu.frau.service.Service.Management.model;

public enum RequestStatus {
    DRAFT,
    IN_REVIEW,
    REJECTED,
    APPROVED_FOR_BIDDING,
    BIDDING,
    EXPIRED,      // ✅ NEW
    EVALUATION,
    ORDERED,
    COMPLETED,
    CANCELLED
}