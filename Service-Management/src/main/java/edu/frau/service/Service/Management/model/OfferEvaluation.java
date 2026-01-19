package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
        name = "offer_evaluation",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_offer_eval_offer", columnNames = {"offer_id"})
        }
)
public class OfferEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which request this evaluation belongs to
    @ManyToOne(optional = false)
    @JoinColumn(name = "service_request_id")
    private ServiceRequest serviceRequest;

    // Which offer this evaluation belongs to
    @ManyToOne(optional = false)
    @JoinColumn(name = "offer_id")
    private ServiceOffer serviceOffer;

    // Gate decision
    private boolean eligible;

    @Column(length = 500)
    private String disqualificationReason;

    // Scores
    private double techScore;        // 0..100
    private double commercialScore;  // 0..100
    private double finalScore;       // 0..100

    // Breakdown for UI
    @Column(length = 4000)
    private String breakdownJson;

    // Audit
    private Instant computedAt;

    private String computedBy;

    private String algorithmVersion;

    // Optional decision tracking (future-safe)
    private boolean recommended;
    private boolean overridden;

    @Column(length = 1000)
    private String overrideReason;

    private String finalApprovedByRp;
    private Instant finalApprovedAt;

    public OfferEvaluation() {}

    // -------- getters/setters --------

    public Long getId() { return id; }

    public ServiceRequest getServiceRequest() { return serviceRequest; }
    public void setServiceRequest(ServiceRequest serviceRequest) { this.serviceRequest = serviceRequest; }

    public ServiceOffer getServiceOffer() { return serviceOffer; }
    public void setServiceOffer(ServiceOffer serviceOffer) { this.serviceOffer = serviceOffer; }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public String getDisqualificationReason() { return disqualificationReason; }
    public void setDisqualificationReason(String disqualificationReason) { this.disqualificationReason = disqualificationReason; }

    public double getTechScore() { return techScore; }
    public void setTechScore(double techScore) { this.techScore = techScore; }

    public double getCommercialScore() { return commercialScore; }
    public void setCommercialScore(double commercialScore) { this.commercialScore = commercialScore; }

    public double getFinalScore() { return finalScore; }
    public void setFinalScore(double finalScore) { this.finalScore = finalScore; }

    public String getBreakdownJson() { return breakdownJson; }
    public void setBreakdownJson(String breakdownJson) { this.breakdownJson = breakdownJson; }

    public Instant getComputedAt() { return computedAt; }
    public void setComputedAt(Instant computedAt) { this.computedAt = computedAt; }

    public String getComputedBy() { return computedBy; }
    public void setComputedBy(String computedBy) { this.computedBy = computedBy; }

    public String getAlgorithmVersion() { return algorithmVersion; }
    public void setAlgorithmVersion(String algorithmVersion) { this.algorithmVersion = algorithmVersion; }

    public boolean isRecommended() { return recommended; }
    public void setRecommended(boolean recommended) { this.recommended = recommended; }

    public boolean isOverridden() { return overridden; }
    public void setOverridden(boolean overridden) { this.overridden = overridden; }

    public String getOverrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }

    public String getFinalApprovedByRp() { return finalApprovedByRp; }
    public void setFinalApprovedByRp(String finalApprovedByRp) { this.finalApprovedByRp = finalApprovedByRp; }

    public Instant getFinalApprovedAt() { return finalApprovedAt; }
    public void setFinalApprovedAt(Instant finalApprovedAt) { this.finalApprovedAt = finalApprovedAt; }
}
