package edu.frau.service.Service.Management.dto;

public class PublicBidRequest {
    public Long requestId;
    public ServiceOfferDTO offer; // reuse your offer dto/entity shape if you already have it

    public static class ServiceOfferDTO {
        public Long id; // <-- provider offer id in their system
        public Long providerOfferId; // optional if they add later

        public ServiceRequestDTO serviceRequest;

        public String specialistName;
        public String materialNumber;
        public Double dailyRate;
        public Double travellingCost;
        public Double totalCost;

        public String contractualRelationship;
        public String subcontractorCompany;

        public Boolean matchMustHaveCriteria;
        public Boolean matchNiceToHaveCriteria;
        public Boolean matchLanguageSkills;

        public String supplierName;
        public String supplierRepresentative;
    }

    public static class ServiceRequestDTO {
        public Long id;
    }
}
