package edu.frau.service.Service.Management.model;

public enum OrderStatus {
    PENDING_RP_APPROVAL,
    SUBMITTED_TO_PROVIDER,  // ✅ after RP final approve
    APPROVED,               // ✅ provider accepted
    REJECTED                // ✅ provider rejected
}
