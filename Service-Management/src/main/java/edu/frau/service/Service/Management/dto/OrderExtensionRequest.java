package edu.frau.service.Service.Management.dto;

import java.time.LocalDate;

public class OrderExtensionRequest {
    public LocalDate newEndDate;
    public Integer newManDays;         // total manDays after extension (recommended)
    public Double newContractValue;    // total value after extension
    public String comment;
}
