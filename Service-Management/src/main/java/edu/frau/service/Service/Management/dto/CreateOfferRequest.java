package edu.frau.service.Service.Management.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class CreateOfferRequest {

    public Long serviceRequestId;

    // Accept both providerOfferId and provider_offer_id
    @JsonAlias({"provider_offer_id"})
    public Long providerOfferId;

    public String specialistName;
    public String materialNumber;

    public Double dailyRate;
    public Double travellingCost;
    public Double totalCost;

    public Boolean matchMustHaveCriteria;
    public Boolean matchNiceToHaveCriteria;
    public Boolean matchLanguageSkills;

    public String contractualRelationship;
    public String subcontractorCompany;

    public String supplierName;
    public String supplierRepresentative;
}
