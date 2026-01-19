package edu.frau.service.Service.Management.dto;

import edu.frau.service.Service.Management.model.RequestType;
import edu.frau.service.Service.Management.model.RequestedRole;

import java.time.LocalDate;
import java.util.List;

public class RequestCreateDTO {

    public String title;
    public RequestType type;

    // Frontend sends arrays
    public List<String> projectIds;
    public List<String> contractIds;

    // Optional "display fields" you want to store
    public String projectName;        // store projectDescription here
    public String contractSupplier;   // store supplier name here

    public LocalDate startDate;
    public LocalDate endDate;
    public String performanceLocation;

    public Integer maxOffers;
    public Integer maxAcceptedOffers;

    public List<String> requiredLanguages;
    public List<String> mustHaveCriteria;
    public List<String> niceToHaveCriteria;

    public String taskDescription;
    public String furtherInformation;

    public List<RequestedRole> roles;
}
