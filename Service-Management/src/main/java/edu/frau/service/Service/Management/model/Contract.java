package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String scope;
    private String terms;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate offerDeadline;
    private double functionalWeighting;
    private double commercialWeighting;

    @ElementCollection
    @CollectionTable(name = "contract_service_types", joinColumns = @JoinColumn(name = "contract_id"))
    @Column(name = "service_request_type")
    private List<String> acceptedServiceRequestTypes;

    public Contract() {}

    public Contract(Long id, String title, String scope, String terms, LocalDate startDate, LocalDate endDate, LocalDate offerDeadline, double functionalWeighting, double commercialWeighting, List<String> acceptedServiceRequestTypes) {
        this.id = id;
        this.title = title;
        this.scope = scope;
        this.terms = terms;
        this.startDate = startDate;
        this.endDate = endDate;
        this.offerDeadline = offerDeadline;
        this.functionalWeighting = functionalWeighting;
        this.commercialWeighting = commercialWeighting;
        this.acceptedServiceRequestTypes = acceptedServiceRequestTypes;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public String getTerms() { return terms; }
    public void setTerms(String terms) { this.terms = terms; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public LocalDate getOfferDeadline() { return offerDeadline; }
    public void setOfferDeadline(LocalDate offerDeadline) { this.offerDeadline = offerDeadline; }

    public double getFunctionalWeighting() { return functionalWeighting; }
    public void setFunctionalWeighting(double functionalWeighting) { this.functionalWeighting = functionalWeighting; }

    public double getCommercialWeighting() { return commercialWeighting; }
    public void setCommercialWeighting(double commercialWeighting) { this.commercialWeighting = commercialWeighting; }

    public List<String> getAcceptedServiceRequestTypes() { return acceptedServiceRequestTypes; }
    public void setAcceptedServiceRequestTypes(List<String> acceptedServiceRequestTypes) { this.acceptedServiceRequestTypes = acceptedServiceRequestTypes; }
}
