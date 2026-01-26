package edu.frau.service.Service.Management.dto;

import edu.frau.service.Service.Management.model.OrderStatus;

import java.time.Instant;
import java.time.LocalDate;

public class OrderDetailsDTO {

    public Long id;
    public OrderStatus status;

    public String title;

    public Long requestId;
    public String requestNumber;

    public LocalDate startDate;
    public LocalDate endDate;
    public String location;

    public String supplierName;
    public String supplierRepresentative;
    public String specialistName;

    public String role;
    public int manDays;

    public double contractValue;

    // ✅ NEW FIELD (as String for API output)
    public String pendingSubstitutionDate;

    // from selected offer (if linked)
    public Long offerId;
    public String materialNumber;
    public double dailyRate;
    public double travellingCost;
    public String contractualRelationship;
    public String subcontractorCompany;

    // audit
    public Instant createdAt;
    public String createdBy;

    public Instant approvedAt;
    public String approvedBy;

    public Instant rejectedAt;
    public String rejectedBy;
    public String rejectionReason;

    // feedback (optional)
    public Integer rating;
    public String feedbackComment;
    public Instant feedbackCreatedAt;
    public String feedbackCreatedBy;

    public String pendingChangeType;          // "SUBSTITUTION" | "EXTENSION"
    public String pendingChangeStatus;        // "NONE" | "PENDING" | "APPROVED" | "REJECTED"

    public String pendingNewSpecialistName;

    public String pendingNewEndDate;
    public Integer pendingNewManDays;
    public Double pendingNewContractValue;

    public String pendingChangeComment;
    public String pendingChangeRequestedBy;
    public String pendingChangeRequestedAt;

    public String pendingChangeDecisionBy;
    public String pendingChangeDecisionAt;

    public String pendingChangeRejectionReason;
}
