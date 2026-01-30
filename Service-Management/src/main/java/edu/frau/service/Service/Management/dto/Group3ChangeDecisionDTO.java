package edu.frau.service.Service.Management.dto;

public class Group3ChangeDecisionDTO {
    public String decision; // "ACCEPTED" | "REJECTED"
    public String reason;
    public String specialistName; // ✅ REQUIRED only when ACCEPTED + SUBSTITUTION// optional if rejected

}
