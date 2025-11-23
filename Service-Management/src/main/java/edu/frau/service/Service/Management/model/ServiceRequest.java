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

    /** USER WHO CREATED REQUEST */
    @ManyToOne
    @JoinColumn(name = "requested_by_user_id")
    private User requestedBy;

    private String requestedByUsername;

    /** PROJECT REFERENCE */
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project projectReference;

    /** MULTIPLE CONTRACT REFERENCES */
    @ManyToMany
    @JoinTable(
            name = "service_request_contract",
            joinColumns = @JoinColumn(name = "service_request_id"),
            inverseJoinColumns = @JoinColumn(name = "contract_id")
    )
    private List<Contract> contractReferences;

    /** Selected final contract */
    private Long contractReferenceId;

    private LocalDate startDate;
    private LocalDate endDate;

    private String domain;

    @Enumerated(EnumType.STRING)
    private Role role; // Internal enum

    /** Text version (used when suppliers send data) */
    private String roleName;

    private String technology;
    private String experienceLevel;

    @Column(length = 2000)
    private String taskDescription;

    private Integer maxOffers;
    private Integer maxAcceptedOffers;

    private Integer sumOfManDays;
    private Integer onsiteDays;

    private String performanceLocation; // Onshore, Offshore, etc.

    /** Preferred offer selected */
    private Long preferredOfferId;

    /** Evaluation filters */
    @ElementCollection
    private List<String> requiredLanguages;

    @ElementCollection
    private List<String> mustHaveCriteria;

    @ElementCollection
    private List<String> niceToHaveCriteria;

    @Column(length = 2000)
    private String furtherInformation;

    @Enumerated(EnumType.STRING)
    private RequestStatus status; // DRAFT, IN_REVIEW, BIDDING, ORDERED etc.

    public ServiceRequest() {}

    // -------- GETTERS & SETTERS --------

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public RequestType getType() { return type; }
    public void setType(RequestType type) { this.type = type; }

    public User getRequestedBy() { return requestedBy; }
    public void setRequestedBy(User requestedBy) { this.requestedBy = requestedBy; }

    public String getRequestedByUsername() { return requestedByUsername; }
    public void setRequestedByUsername(String requestedByUsername) { this.requestedByUsername = requestedByUsername; }

    public Project getProjectReference() { return projectReference; }
    public void setProjectReference(Project projectReference) { this.projectReference = projectReference; }

    public List<Contract> getContractReferences() { return contractReferences; }
    public void setContractReferences(List<Contract> contractReferences) { this.contractReferences = contractReferences; }

    public Long getContractReferenceId() { return contractReferenceId; }
    public void setContractReferenceId(Long contractReferenceId) { this.contractReferenceId = contractReferenceId; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getTechnology() { return technology; }
    public void setTechnology(String technology) { this.technology = technology; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public String getTaskDescription() { return taskDescription; }
    public void setTaskDescription(String taskDescription) { this.taskDescription = taskDescription; }

    public Integer getMaxOffers() { return maxOffers; }
    public void setMaxOffers(Integer maxOffers) { this.maxOffers = maxOffers; }

    public Integer getMaxAcceptedOffers() { return maxAcceptedOffers; }
    public void setMaxAcceptedOffers(Integer maxAcceptedOffers) { this.maxAcceptedOffers = maxAcceptedOffers; }

    public Integer getSumOfManDays() { return sumOfManDays; }
    public void setSumOfManDays(Integer sumOfManDays) { this.sumOfManDays = sumOfManDays; }

    public Integer getOnsiteDays() { return onsiteDays; }
    public void setOnsiteDays(Integer onsiteDays) { this.onsiteDays = onsiteDays; }

    public String getPerformanceLocation() { return performanceLocation; }
    public void setPerformanceLocation(String performanceLocation) { this.performanceLocation = performanceLocation; }

    public Long getPreferredOfferId() { return preferredOfferId; }
    public void setPreferredOfferId(Long preferredOfferId) { this.preferredOfferId = preferredOfferId; }

    public List<String> getRequiredLanguages() { return requiredLanguages; }
    public void setRequiredLanguages(List<String> requiredLanguages) { this.requiredLanguages = requiredLanguages; }

    public List<String> getMustHaveCriteria() { return mustHaveCriteria; }
    public void setMustHaveCriteria(List<String> mustHaveCriteria) { this.mustHaveCriteria = mustHaveCriteria; }

    public List<String> getNiceToHaveCriteria() { return niceToHaveCriteria; }
    public void setNiceToHaveCriteria(List<String> niceToHaveCriteria) { this.niceToHaveCriteria = niceToHaveCriteria; }

    public String getFurtherInformation() { return furtherInformation; }
    public void setFurtherInformation(String furtherInformation) { this.furtherInformation = furtherInformation; }

    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
}
