package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "service_requests")
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Enumerated(EnumType.STRING)
    private RequestType type; // SINGLE, MULTI, TEAM, WORK_CONTRACT

    /** USER WHO CREATED REQUEST — username only */
    private String requestedByUsername;

    /** One project per request (from MockAPI / Group 1) */
    private String projectId;
    private String projectName;

    /** One contract per request (from MockAPI / Group 2) */
    private String contractId;
    private String contractSupplier;

    private LocalDate startDate;
    private LocalDate endDate;

    private String performanceLocation; // Onshore / Nearshore / Offshore etc.

    private Integer maxOffers;
    private Integer maxAcceptedOffers;

    /** Evaluation filters (from project JSON or manually) */
    @ElementCollection
    private List<String> requiredLanguages;

    @ElementCollection
    private List<String> mustHaveCriteria;

    @ElementCollection
    private List<String> niceToHaveCriteria;

    @Column(length = 2000)
    private String taskDescription;

    @Column(length = 2000)
    private String furtherInformation;

    @Enumerated(EnumType.STRING)
    private RequestStatus status; // DRAFT, IN_REVIEW, APPROVED_FOR_BIDDING, BIDDING, ORDERED, REJECTED

    /** Preferred offer (by id) after evaluation */
    private Long preferredOfferId;

    /** Dynamic list of requested roles */
    @ElementCollection
    @CollectionTable(
            name = "service_request_roles",
            joinColumns = @JoinColumn(name = "service_request_id")
    )
    private List<RequestedRole> roles;

    public ServiceRequest() {}

    // ---------------- GETTERS & SETTERS ----------------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public RequestType getType() { return type; }
    public void setType(RequestType type) { this.type = type; }

    public String getRequestedByUsername() { return requestedByUsername; }
    public void setRequestedByUsername(String requestedByUsername) { this.requestedByUsername = requestedByUsername; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getProjectName() { return projectName; }
    public void setProjectName(String projectName) { this.projectName = projectName; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getContractSupplier() { return contractSupplier; }
    public void setContractSupplier(String contractSupplier) { this.contractSupplier = contractSupplier; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getPerformanceLocation() { return performanceLocation; }
    public void setPerformanceLocation(String performanceLocation) { this.performanceLocation = performanceLocation; }

    public Integer getMaxOffers() { return maxOffers; }
    public void setMaxOffers(Integer maxOffers) { this.maxOffers = maxOffers; }

    public Integer getMaxAcceptedOffers() { return maxAcceptedOffers; }
    public void setMaxAcceptedOffers(Integer maxAcceptedOffers) { this.maxAcceptedOffers = maxAcceptedOffers; }

    public List<String> getRequiredLanguages() { return requiredLanguages; }
    public void setRequiredLanguages(List<String> requiredLanguages) { this.requiredLanguages = requiredLanguages; }

    public List<String> getMustHaveCriteria() { return mustHaveCriteria; }
    public void setMustHaveCriteria(List<String> mustHaveCriteria) { this.mustHaveCriteria = mustHaveCriteria; }

    public List<String> getNiceToHaveCriteria() { return niceToHaveCriteria; }
    public void setNiceToHaveCriteria(List<String> niceToHaveCriteria) { this.niceToHaveCriteria = niceToHaveCriteria; }

    public String getTaskDescription() { return taskDescription; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }

    public String getFurtherInformation() { return furtherInformation; }
    public void setFurtherInformation(String furtherInformation) { this.furtherInformation = furtherInformation; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public Long getPreferredOfferId() { return preferredOfferId; }
    public void setPreferredOfferId(Long preferredOfferId) { this.preferredOfferId = preferredOfferId; }

    public List<RequestedRole> getRoles() { return roles; }
    public void setRoles(List<RequestedRole> roles) { this.roles = roles; }
}
