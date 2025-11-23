package edu.frau.service.Service.Management.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @ElementCollection
    @CollectionTable(name = "project_roles", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "role")
    private List<String> requiredRoles;

    @ElementCollection
    @CollectionTable(name = "project_skills", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "skill")
    private List<String> requiredSkills;

    private int capacity;

    private String location;

    @ElementCollection
    @CollectionTable(name = "project_links", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "link")
    private List<String> links;

    public Project() {}

    public Project(Long id, String title, String description, LocalDate startDate, LocalDate endDate,
                   List<String> requiredRoles, List<String> requiredSkills, int capacity, String location, List<String> links) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.startDate = startDate;
        this.endDate = endDate;
        this.requiredRoles = requiredRoles;
        this.requiredSkills = requiredSkills;
        this.capacity = capacity;
        this.location = location;
        this.links = links;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public List<String> getRequiredRoles() { return requiredRoles; }
    public void setRequiredRoles(List<String> requiredRoles) { this.requiredRoles = requiredRoles; }

    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public List<String> getLinks() { return links; }
    public void setLinks(List<String> links) { this.links = links; }
}
