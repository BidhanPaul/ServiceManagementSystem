package edu.frau.service.Service.Management.dto;

import java.util.List;

public class ProviderBidPayloadDTO {

    // provider offer id
    public Long id;

    /**
     * BACKWARD COMPAT (old): single request bid
     * If serviceRequests is provided, this can be null.
     */
    public ServiceRequestDTO serviceRequest;

    /**
     * NEW: multi-request bid (provider bids on multiple SRs)
     * If this is provided, serviceRequest can be null.
     */
    public List<ServiceRequestDTO> serviceRequests;

    /**
     * BACKWARD COMPAT (old): flat list of specialists
     * If allocations is provided, this can be null.
     */
    public List<SpecialistDTO> specialists;

    /**
     * NEW: team-by-role allocations (recommended for team bidding)
     */
    public List<RoleAllocationDTO> allocations;

    public Double totalCost;

    public String contractualRelationship;
    public String subcontractorCompany;

    public String supplierName;
    public String supplierRepresentative;

    public String offerStatus;

    public String providerId;
    public String providerName;

    // --- Nested DTOs ---

    public static class ServiceRequestDTO {
        public Long id;               // internal id OR provider's copy
        public String requestNumber;  // best external identifier for mapping
    }

    /**
     * NEW: One allocation per role, containing a team (members).
     * This is what enables true "team bidding".
     */
    public static class RoleAllocationDTO {
        // identifies the role (use roleId if you have it in your DB)
        public String domain;
        public String roleName;
        public String technology;
        public String experienceLevel;

        // demand for this role in the service request
        public Integer manDays;
        public Integer onsiteDays;

        // team members for this role
        public List<SpecialistAllocationDTO> members;

        public Double roleTotalCost;
    }

    /**
     * BACKWARD COMPAT (old specialist fields) + NEW assignment split fields.
     */
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

    /**
     * NEW: Specialist with assigned workload (for team split).
     * Same fields as SpecialistDTO plus manDaysAssigned/onsiteDaysAssigned.
     */
    public static class SpecialistAllocationDTO extends SpecialistDTO {
        public Integer manDaysAssigned;
        public Integer onsiteDaysAssigned;
    }
}
