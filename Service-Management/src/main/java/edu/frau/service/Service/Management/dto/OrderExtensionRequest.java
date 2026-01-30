package edu.frau.service.Service.Management.dto;

import java.time.LocalDate;

public class OrderExtensionRequest {

    /**
     * ✅ Group3 requirement: newEndDate (mandatory)
     */
    public LocalDate newEndDate;

    /**
     * ✅ Group3 requirement: newManDays = TOTAL manDays after extension
     * (Your service code currently may assume total.)
     */
    public Integer newManDays;

    /**
     * ✅ Group3 requirement: newContractValue = TOTAL value after extension
     */
    public Double newContractValue;

    /**
     * ✅ Group3 uses comment
     */
    public String comment;

    /**
     * Backward compatibility: your frontend earlier used:
     * - extraManDays (additional, not total)
     * - reason
     */
    public Integer extraManDays;
    public String reason;

    /**
     * ✅ If UI sends extraManDays instead of newManDays:
     * convert to TOTAL using currentManDays.
     */
    public Integer resolvedNewManDays(Integer currentManDays) {
        if (newManDays != null) return newManDays;

        // fallback: compute total from extraManDays
        int base = currentManDays == null ? 0 : currentManDays;
        int extra = extraManDays == null ? 0 : extraManDays;
        int total = base + extra;
        return total > 0 ? total : null;
    }

    /**
     * ✅ Safe comment accessor: prefer comment, fallback to reason, fallback empty.
     */
    public String resolvedComment() {
        if (comment != null && !comment.trim().isEmpty()) return comment.trim();
        if (reason != null && !reason.trim().isEmpty()) return reason.trim();
        return "";
    }
}
