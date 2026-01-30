package edu.frau.service.Service.Management.dto;

import java.time.LocalDate;

public class OrderSubstitutionRequest {

    /**
     * Existing/internal field (your current UI/service uses this).
     */
    public String newSpecialistName;

    /**
     * ✅ Group3 requirement: substitutionDate is mandatory.
     */
    public LocalDate substitutionDate;

    /**
     * ✅ Group3 uses "comment" text.
     * Your frontend might still send "reason" sometimes, so we keep both.
     */
    public String comment;

    /**
     * Backward compatibility: some UI versions may send "reason".
     * We keep it so nothing breaks.
     */
    public String reason;

    /**
     * ✅ Safe accessor used by service layer:
     * Prefer comment, fallback to reason, fallback to empty.
     */
    public String resolvedComment() {
        if (comment != null && !comment.trim().isEmpty()) return comment.trim();
        if (reason != null && !reason.trim().isEmpty()) return reason.trim();
        return "";
    }
}
