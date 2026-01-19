package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "service_order")
public class ServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_request_id")
    private ServiceRequest serviceRequestReference;

    // ✅ Link the exact offer used to create this order
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_offer_id")
    private ServiceOffer selectedOffer;

    private LocalDate startDate;
    private LocalDate endDate;
    private String location;

    private String supplierName;
    private String supplierRepresentative;
    private String specialistName;

    // Flexible (string)
    private String role;

    private int manDays;
    private double contractValue;

    // ✅ Enterprise lifecycle
    @Enumerated(EnumType.STRING)
    private OrderStatus status = OrderStatus.PENDING_RP_APPROVAL;

    // ✅ Audit fields
    private Instant createdAt;
    private String createdBy;

    private Instant approvedAt;
    private String approvedBy;

    private Instant rejectedAt;
    private String rejectedBy;

    @Column(length = 2000)
    private String rejectionReason;

    // =====================
    // ✅ Change Request flow (Substitution / Extension)
    // =====================
    @Enumerated(EnumType.STRING)
    private OrderChangeType pendingChangeType;

    @Enumerated(EnumType.STRING)
    private OrderChangeStatus pendingChangeStatus = OrderChangeStatus.NONE;

    // substitution
    private String pendingNewSpecialistName;

    // extension
    private LocalDate pendingNewEndDate;
    private Integer pendingNewManDays;
    private Double pendingNewContractValue;

    // common metadata
    @Column(length = 2000)
    private String pendingChangeComment;

    private Instant pendingChangeRequestedAt;
    private String pendingChangeRequestedBy;

    private Instant pendingChangeDecisionAt;
    private String pendingChangeDecisionBy;

    @Column(length = 2000)
    private String pendingChangeRejectionReason;

    public ServiceOrder() {}

    // ---------------- GETTERS & SETTERS ----------------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public ServiceRequest getServiceRequestReference() { return serviceRequestReference; }
    public void setServiceRequestReference(ServiceRequest serviceRequestReference) {
        this.serviceRequestReference = serviceRequestReference;
    }

    public ServiceOffer getSelectedOffer() { return selectedOffer; }
    public void setSelectedOffer(ServiceOffer selectedOffer) { this.selectedOffer = selectedOffer; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getSupplierRepresentative() { return supplierRepresentative; }
    public void setSupplierRepresentative(String supplierRepresentative) {
        this.supplierRepresentative = supplierRepresentative;
    }

    public String getSpecialistName() { return specialistName; }
    public void setSpecialistName(String specialistName) { this.specialistName = specialistName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public int getManDays() { return manDays; }
    public void setManDays(int manDays) { this.manDays = manDays; }

    public double getContractValue() { return contractValue; }
    public void setContractValue(double contractValue) { this.contractValue = contractValue; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public Instant getRejectedAt() { return rejectedAt; }
    public void setRejectedAt(Instant rejectedAt) { this.rejectedAt = rejectedAt; }

    public String getRejectedBy() { return rejectedBy; }
    public void setRejectedBy(String rejectedBy) { this.rejectedBy = rejectedBy; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    // ---------- PENDING CHANGE GETTERS & SETTERS ----------

    public OrderChangeType getPendingChangeType() { return pendingChangeType; }
    public void setPendingChangeType(OrderChangeType pendingChangeType) { this.pendingChangeType = pendingChangeType; }

    public OrderChangeStatus getPendingChangeStatus() { return pendingChangeStatus; }
    public void setPendingChangeStatus(OrderChangeStatus pendingChangeStatus) { this.pendingChangeStatus = pendingChangeStatus; }

    public String getPendingNewSpecialistName() { return pendingNewSpecialistName; }
    public void setPendingNewSpecialistName(String pendingNewSpecialistName) { this.pendingNewSpecialistName = pendingNewSpecialistName; }

    public LocalDate getPendingNewEndDate() { return pendingNewEndDate; }
    public void setPendingNewEndDate(LocalDate pendingNewEndDate) { this.pendingNewEndDate = pendingNewEndDate; }

    public Integer getPendingNewManDays() { return pendingNewManDays; }
    public void setPendingNewManDays(Integer pendingNewManDays) { this.pendingNewManDays = pendingNewManDays; }

    public Double getPendingNewContractValue() { return pendingNewContractValue; }
    public void setPendingNewContractValue(Double pendingNewContractValue) { this.pendingNewContractValue = pendingNewContractValue; }

    public String getPendingChangeComment() { return pendingChangeComment; }
    public void setPendingChangeComment(String pendingChangeComment) { this.pendingChangeComment = pendingChangeComment; }

    public Instant getPendingChangeRequestedAt() { return pendingChangeRequestedAt; }
    public void setPendingChangeRequestedAt(Instant pendingChangeRequestedAt) { this.pendingChangeRequestedAt = pendingChangeRequestedAt; }

    public String getPendingChangeRequestedBy() { return pendingChangeRequestedBy; }
    public void setPendingChangeRequestedBy(String pendingChangeRequestedBy) { this.pendingChangeRequestedBy = pendingChangeRequestedBy; }

    public Instant getPendingChangeDecisionAt() { return pendingChangeDecisionAt; }
    public void setPendingChangeDecisionAt(Instant pendingChangeDecisionAt) { this.pendingChangeDecisionAt = pendingChangeDecisionAt; }

    public String getPendingChangeDecisionBy() { return pendingChangeDecisionBy; }
    public void setPendingChangeDecisionBy(String pendingChangeDecisionBy) { this.pendingChangeDecisionBy = pendingChangeDecisionBy; }

    public String getPendingChangeRejectionReason() { return pendingChangeRejectionReason; }
    public void setPendingChangeRejectionReason(String pendingChangeRejectionReason) { this.pendingChangeRejectionReason = pendingChangeRejectionReason; }
}
