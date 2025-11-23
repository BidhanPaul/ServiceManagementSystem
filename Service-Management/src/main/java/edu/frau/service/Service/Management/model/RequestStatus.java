package edu.frau.service.Service.Management.model;

public enum RequestStatus {
    DRAFT,                 // just created by PM
    IN_REVIEW,             // Procurement Officer QA
    REJECTED,              // QA rejected
    APPROVED_FOR_BIDDING,  // QA ok, waiting for providers
    BIDDING,               // offers are being collected
    EVALUATION,            // PM / RP are evaluating
    ORDERED,               // service order created
    COMPLETED,             // finished
    CANCELLED              // cancelled
}
