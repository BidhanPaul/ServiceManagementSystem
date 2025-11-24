package edu.frau.service.Service.Management.model;

import jakarta.persistence.Embeddable;

@Embeddable
public class RequestedRole {

    private String domain;
    private String roleName;
    private String technology;
    private String experienceLevel;
    private Integer manDays;
    private Integer onsiteDays;

    public RequestedRole() {}

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getTechnology() { return technology; }
    public void setTechnology(String technology) { this.technology = technology; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public Integer getManDays() { return manDays; }
    public void setManDays(Integer manDays) { this.manDays = manDays; }

    public Integer getOnsiteDays() { return onsiteDays; }
    public void setOnsiteDays(Integer onsiteDays) { this.onsiteDays = onsiteDays; }
}
