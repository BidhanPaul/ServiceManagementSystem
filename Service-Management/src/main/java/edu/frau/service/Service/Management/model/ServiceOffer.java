package edu.frau.service.Service.Management.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "service_offers")
@JsonIgnoreProperties(value = { "hibernateLazyInitializer", "handler" })
public class ServiceOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    // ✅ Link offer to service request
    @ManyToOne
    @JoinColumn(name = "service_request_id")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private ServiceRequest serviceRequest;

    private String specialistName;
    private String materialNumber;

    private double dailyRate;
    private double travellingCost;
    private double totalCost;

    private String contractualRelationship;
    private String subcontractorCompany;

    private boolean matchMustHaveCriteria;
    private boolean matchNiceToHaveCriteria;
    private boolean matchLanguageSkills;

    private String supplierName;
    private String supplierRepresentative;

    // ✅ CRITICAL: provider system offer ID (Group3 / Group4)
    @Column(name = "provider_offer_id", unique = true)
    private Long providerOfferId;

    // ✅ NEW: store provider payload specialists[] (TEAM / MULTI support)
    @OneToMany(mappedBy = "serviceOffer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ServiceOfferSpecialist> specialists = new ArrayList<>();

    public ServiceOffer() {}

    // --------------------------
    //   GETTERS & SETTERS
    // --------------------------

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ServiceRequest getServiceRequest() {
        return serviceRequest;
    }

    public void setServiceRequest(ServiceRequest serviceRequest) {
        this.serviceRequest = serviceRequest;
    }

    public String getSpecialistName() {
        return specialistName;
    }

    public void setSpecialistName(String specialistName) {
        this.specialistName = specialistName;
    }

    public String getMaterialNumber() {
        return materialNumber;
    }

    public void setMaterialNumber(String materialNumber) {
        this.materialNumber = materialNumber;
    }

    public double getDailyRate() {
        return dailyRate;
    }

    public void setDailyRate(double dailyRate) {
        this.dailyRate = dailyRate;
    }

    public double getTravellingCost() {
        return travellingCost;
    }

    public void setTravellingCost(double travellingCost) {
        this.travellingCost = travellingCost;
    }

    public double getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(double totalCost) {
        this.totalCost = totalCost;
    }

    public String getContractualRelationship() {
        return contractualRelationship;
    }

    public void setContractualRelationship(String contractualRelationship) {
        this.contractualRelationship = contractualRelationship;
    }

    public String getSubcontractorCompany() {
        return subcontractorCompany;
    }

    public void setSubcontractorCompany(String subcontractorCompany) {
        this.subcontractorCompany = subcontractorCompany;
    }

    public boolean isMatchMustHaveCriteria() {
        return matchMustHaveCriteria;
    }

    public void setMatchMustHaveCriteria(boolean matchMustHaveCriteria) {
        this.matchMustHaveCriteria = matchMustHaveCriteria;
    }

    public boolean isMatchNiceToHaveCriteria() {
        return matchNiceToHaveCriteria;
    }

    public void setMatchNiceToHaveCriteria(boolean matchNiceToHaveCriteria) {
        this.matchNiceToHaveCriteria = matchNiceToHaveCriteria;
    }

    public boolean isMatchLanguageSkills() {
        return matchLanguageSkills;
    }

    public void setMatchLanguageSkills(boolean matchLanguageSkills) {
        this.matchLanguageSkills = matchLanguageSkills;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierRepresentative() {
        return supplierRepresentative;
    }

    public void setSupplierRepresentative(String supplierRepresentative) {
        this.supplierRepresentative = supplierRepresentative;
    }

    // ✅ Provider offer ID accessors
    public Long getProviderOfferId() {
        return providerOfferId;
    }

    public void setProviderOfferId(Long providerOfferId) {
        this.providerOfferId = providerOfferId;
    }

    // ✅ NEW: Specialists list accessors
    public List<ServiceOfferSpecialist> getSpecialists() {
        return specialists;
    }

    /**
     * Replace entire specialists list safely (keeps JPA orphanRemoval happy).
     */
    public void setSpecialists(List<ServiceOfferSpecialist> specialists) {
        this.specialists.clear();
        if (specialists != null) {
            for (ServiceOfferSpecialist s : specialists) {
                addSpecialist(s);
            }
        }
    }

    /**
     * Add specialist and bind back-reference.
     */
    public void addSpecialist(ServiceOfferSpecialist specialist) {
        if (specialist == null) return;
        specialist.setServiceOffer(this);
        this.specialists.add(specialist);
    }

    /**
     * Remove specialist and clear back-reference.
     */
    public void removeSpecialist(ServiceOfferSpecialist specialist) {
        if (specialist == null) return;
        specialist.setServiceOffer(null);
        this.specialists.remove(specialist);
    }

    @Override
    public String toString() {
        return "ServiceOffer{" +
                "id=" + id +
                ", providerOfferId=" + providerOfferId +
                ", specialistName='" + specialistName + '\'' +
                ", supplierName='" + supplierName + '\'' +
                ", supplierRepresentative='" + supplierRepresentative + '\'' +
                ", totalCost=" + totalCost +
                ", specialistsCount=" + (specialists == null ? 0 : specialists.size()) +
                '}';
    }
}
