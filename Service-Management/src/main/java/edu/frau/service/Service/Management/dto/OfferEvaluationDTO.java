package edu.frau.service.Service.Management.dto;

public class OfferEvaluationDTO {

    public Long offerId;

    public boolean eligible;
    public String disqualificationReason;

    public double techScore;
    public double commercialScore;
    public double finalScore;

    public String breakdownJson;

    // Offer info needed for table
    public String supplierName;
    public String specialistName;
    public String contractualRelationship;
    public String subcontractorCompany;
    public String materialNumber;

    public double dailyRate;
    public double travellingCost;
    public double totalCost;

    public boolean matchMustHaveCriteria;
    public boolean matchNiceToHaveCriteria;
    public boolean matchLanguageSkills;

    public int rank;
    public boolean recommended;
}
