package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;

@Entity
@Table(name = "service_offers")
public class ServiceOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // NEW → Link offer to its service request
    @ManyToOne
    @JoinColumn(name = "service_request_id")
    private ServiceRequest serviceRequest;

    private String specialistName;
    private String materialNumber;

    private double dailyRate;
    private double travellingCost;
    private double totalCost;

    private String contractualRelationship; // Employee, Freelancer, Subcontractor
    private String subcontractorCompany;

    private boolean matchMustHaveCriteria;
    private boolean matchNiceToHaveCriteria;
    private boolean matchLanguageSkills;

    // NEW FIELDS (required for creating service order)
    private String supplierName;
    private String supplierRepresentative;

    public ServiceOffer() {}

    public ServiceOffer(Long id, ServiceRequest serviceRequest, String specialistName,
                        String materialNumber, double dailyRate, double travellingCost,
                        double totalCost, String contractualRelationship,
                        String subcontractorCompany, boolean matchMustHaveCriteria,
                        boolean matchNiceToHaveCriteria, boolean matchLanguageSkills,
                        String supplierName, String supplierRepresentative) {
        this.id = id;
        this.serviceRequest = serviceRequest;
        this.specialistName = specialistName;
        this.materialNumber = materialNumber;
        this.dailyRate = dailyRate;
        this.travellingCost = travellingCost;
        this.totalCost = totalCost;
        this.contractualRelationship = contractualRelationship;
        this.subcontractorCompany = subcontractorCompany;
        this.matchMustHaveCriteria = matchMustHaveCriteria;
        this.matchNiceToHaveCriteria = matchNiceToHaveCriteria;
        this.matchLanguageSkills = matchLanguageSkills;
        this.supplierName = supplierName;
        this.supplierRepresentative = supplierRepresentative;
    }

    // --------------------------
    //   GETTERS & SETTERS
    // --------------------------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ServiceRequest getServiceRequest() { return serviceRequest; }
    public void setServiceRequest(ServiceRequest serviceRequest) { this.serviceRequest = serviceRequest; }

    public String getSpecialistName() { return specialistName; }
    public void setSpecialistName(String specialistName) { this.specialistName = specialistName; }

    public String getMaterialNumber() { return materialNumber; }
    public void setMaterialNumber(String materialNumber) { this.materialNumber = materialNumber; }

    public double getDailyRate() { return dailyRate; }
    public void setDailyRate(double dailyRate) { this.dailyRate = dailyRate; }

    public double getTravellingCost() { return travellingCost; }
    public void setTravellingCost(double travellingCost) { this.travellingCost = travellingCost; }

    public double getTotalCost() { return totalCost; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }

    public String getContractualRelationship() { return contractualRelationship; }
    public void setContractualRelationship(String contractualRelationship) { this.contractualRelationship = contractualRelationship; }

    public String getSubcontractorCompany() { return subcontractorCompany; }
    public void setSubcontractorCompany(String subcontractorCompany) { this.subcontractorCompany = subcontractorCompany; }

    public boolean isMatchMustHaveCriteria() { return matchMustHaveCriteria; }
    public void setMatchMustHaveCriteria(boolean matchMustHaveCriteria) { this.matchMustHaveCriteria = matchMustHaveCriteria; }

    public boolean isMatchNiceToHaveCriteria() { return matchNiceToHaveCriteria; }
    public void setMatchNiceToHaveCriteria(boolean matchNiceToHaveCriteria) { this.matchNiceToHaveCriteria = matchNiceToHaveCriteria; }

    public boolean isMatchLanguageSkills() { return matchLanguageSkills; }
    public void setMatchLanguageSkills(boolean matchLanguageSkills) { this.matchLanguageSkills = matchLanguageSkills; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getSupplierRepresentative() { return supplierRepresentative; }
    public void setSupplierRepresentative(String supplierRepresentative) { this.supplierRepresentative = supplierRepresentative; }

    @Override
    public String toString() {
        return "ServiceOffer{" +
                "id=" + id +
                ", specialistName='" + specialistName + '\'' +
                ", supplierName='" + supplierName + '\'' +
                ", representative='" + supplierRepresentative + '\'' +
                ", totalCost=" + totalCost +
                '}';
    }
}
