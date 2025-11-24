package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "service_order")
public class ServiceOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "service_request_id")
    private ServiceRequest serviceRequestReference;

    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
    private String supplierName;
    private String supplierRepresentative;
    private String specialistName;

    /**
     * CHANGED FROM ENUM → STRING
     * More flexible because role may come from external APIs.
     */
    private String role;

    private int manDays;

    // 💰 NEW FIELD
    private double contractValue;

    public ServiceOrder() {}

    public ServiceOrder(Long id, String title, ServiceRequest serviceRequestReference, LocalDate startDate, LocalDate endDate,
                        String location, String supplierName, String supplierRepresentative, String specialistName,
                        String role, int manDays) {
        this.id = id;
        this.title = title;
        this.serviceRequestReference = serviceRequestReference;
        this.startDate = startDate;
        this.endDate = endDate;
        this.location = location;
        this.supplierName = supplierName;
        this.supplierRepresentative = supplierRepresentative;
        this.specialistName = specialistName;
        this.role = role;
        this.manDays = manDays;
    }

    // ====================== GETTERS & SETTERS ======================

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public ServiceRequest getServiceRequestReference() { return serviceRequestReference; }
    public void setServiceRequestReference(ServiceRequest serviceRequestReference) {
        this.serviceRequestReference = serviceRequestReference;
    }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getSupplierRepresentative() { return supplierRepresentative; }
    public void setSupplierRepresentative(String supplierRepresentative) {
        this.supplierRepresentative = supplierRepresentative;
    }

    public String getSpecialistName() { return specialistName; }
    public void setSpecialistName(String specialistName) { this.specialistName = specialistName; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public int getManDays() { return manDays; }
    public void setManDays(int manDays) { this.manDays = manDays; }

    public double getContractValue() { return contractValue; }
    public void setContractValue(double contractValue) { this.contractValue = contractValue; }
}
