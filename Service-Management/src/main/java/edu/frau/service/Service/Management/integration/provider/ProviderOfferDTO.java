package edu.frau.service.Service.Management.integration.provider;

import java.util.List;

public class ProviderOfferDTO {
    public String id; // record id from mockapi (optional)
    public String requestId; // MUST match your ServiceRequest.requestNumber

    public String supplierId;
    public String supplierName;

    public Response response;
    public List<Delta> deltas; // optional

    public static class Response {
        public Staffing staffing;
        public Delivery delivery;
        public String notes;
    }

    public static class Staffing {
        public String currency;
        public List<Candidate> candidates;
    }

    public static class Candidate {
        public String specialistId;
        public String materialNumber;
        public String role;
        public String experienceLevel;
        public String technologyLevel;
        public Double dailyRate;
        public Double travelCostPerOnsiteDay;
        public String contractualRelationship;
        public String subcontractorCompany;
    }

    public static class Delivery {
        public String proposedStartDate;
        public String proposedEndDate;
        public Integer proposedOnsiteDays;
    }

    public static class Delta {
        public String category;
        public String fieldPath;
        public Object currentValue;
        public Object proposedValue;
        public String reason;
        public String severity;
    }
}
