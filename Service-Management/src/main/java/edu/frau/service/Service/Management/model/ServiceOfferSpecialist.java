package edu.frau.service.Service.Management.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "service_offer_specialists")
public class ServiceOfferSpecialist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many specialists belong to one offer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_offer_id", nullable = false)
    @JsonIgnore
    private ServiceOffer serviceOffer;

    private String userId;          // e.g. "SP1002"
    private String name;            // e.g. "Jan Klein"
    private String materialNumber;

    private Double dailyRate;
    private Double travellingCost;
    private Double specialistCost;

    private Boolean matchMustHaveCriteria;
    private Boolean matchNiceToHaveCriteria;
    private Boolean matchLanguageSkills;

    public ServiceOfferSpecialist() {}

    // ---- getters/setters ----
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ServiceOffer getServiceOffer() { return serviceOffer; }
    public void setServiceOffer(ServiceOffer serviceOffer) { this.serviceOffer = serviceOffer; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMaterialNumber() { return materialNumber; }
    public void setMaterialNumber(String materialNumber) { this.materialNumber = materialNumber; }

    public Double getDailyRate() { return dailyRate; }
    public void setDailyRate(Double dailyRate) { this.dailyRate = dailyRate; }

    public Double getTravellingCost() { return travellingCost; }
    public void setTravellingCost(Double travellingCost) { this.travellingCost = travellingCost; }

    public Double getSpecialistCost() { return specialistCost; }
    public void setSpecialistCost(Double specialistCost) { this.specialistCost = specialistCost; }

    public Boolean getMatchMustHaveCriteria() { return matchMustHaveCriteria; }
    public void setMatchMustHaveCriteria(Boolean matchMustHaveCriteria) { this.matchMustHaveCriteria = matchMustHaveCriteria; }

    public Boolean getMatchNiceToHaveCriteria() { return matchNiceToHaveCriteria; }
    public void setMatchNiceToHaveCriteria(Boolean matchNiceToHaveCriteria) { this.matchNiceToHaveCriteria = matchNiceToHaveCriteria; }

    public Boolean getMatchLanguageSkills() { return matchLanguageSkills; }
    public void setMatchLanguageSkills(Boolean matchLanguageSkills) { this.matchLanguageSkills = matchLanguageSkills; }
}
