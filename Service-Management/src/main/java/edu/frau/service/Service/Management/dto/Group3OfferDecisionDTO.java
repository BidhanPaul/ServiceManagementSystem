package edu.frau.service.Service.Management.dto;

public class Group3OfferDecisionDTO {
    private Long serviceOfferId;
    private String decision; // SUBMITTED | ACCEPTED | REJECTED

    public Long getServiceOfferId() { return serviceOfferId; }
    public void setServiceOfferId(Long serviceOfferId) { this.serviceOfferId = serviceOfferId; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }
}
