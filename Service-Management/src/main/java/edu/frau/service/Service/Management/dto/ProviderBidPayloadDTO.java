package edu.frau.service.Service.Management.dto;

import java.util.List;

public class ProviderBidPayloadDTO {

    // provider offer id
    public Long id;

    // provider sends nested request (we don't trust it for persistence, but it's in payload)
    public ServiceRequestDTO serviceRequest;

    public List<SpecialistDTO> specialists;

    public Double totalCost;

    public String contractualRelationship;
    public String subcontractorCompany;

    public String supplierName;
    public String supplierRepresentative;

    public String offerStatus;

    public String providerId;
    public String providerName;

    public static class ServiceRequestDTO {
        public Long id;             // might be internal id OR provider's copy
        public String requestNumber; // you can use this if you want mapping later
    }

    public static class SpecialistDTO {
        public String userId;
        public String name;
        public String materialNumber;

        public Double dailyRate;
        public Double travellingCost;
        public Double specialistCost;

        public Boolean matchMustHaveCriteria;
        public Boolean matchNiceToHaveCriteria;
        public Boolean matchLanguageSkills;
    }
}
