package com.chromaguard.domain;

import com.chromaguard.entity.Alert;
import com.chromaguard.entity.ExposureRecord;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Rich domain model representing an illustrative H2S exposure analytical report.
 * Encapsulates compliance calculations, aggregated statistics, and zone-level evaluations.
 *
 * Demonstrates:
 * - Encapsulation (private fields, validation, unmodifiable collection views)
 * - Interfaces (implements {@link Identifiable})
 * - Composition (contains ZoneExposureSummary, ExposureRecord, Alert)
 * - LocalDateTime for reporting temporal boundaries
 * - Business methods (compliance scoring, safety index calculation)
 */
public class ExposureReport implements Identifiable<String> {

    private final String reportId;
    private final String reportTitle;
    private final LocalDateTime generatedAt;
    private final LocalDateTime windowStart;
    private final LocalDateTime windowEnd;
    private final int totalRecords;
    private final int compliantRecords;
    private final int warningAlertCount;
    private final int criticalAlertCount;
    private final double meanExposurePpmHr;
    private final double peakExposurePpmHr;
    private final List<ZoneExposureSummary> zoneSummaries;
    private final List<Alert> activeAlerts;

    public ExposureReport(String reportId,
                          String reportTitle,
                          LocalDateTime generatedAt,
                          LocalDateTime windowStart,
                          LocalDateTime windowEnd,
                          int totalRecords,
                          int compliantRecords,
                          int warningAlertCount,
                          int criticalAlertCount,
                          double meanExposurePpmHr,
                          double peakExposurePpmHr,
                          List<ZoneExposureSummary> zoneSummaries,
                          List<Alert> activeAlerts) {
        if (totalRecords < 0) throw new IllegalArgumentException("totalRecords cannot be negative");
        if (compliantRecords < 0 || compliantRecords > totalRecords) {
            throw new IllegalArgumentException("compliantRecords must be between 0 and totalRecords");
        }
        if (windowStart != null && windowEnd != null && windowStart.isAfter(windowEnd)) {
            throw new IllegalArgumentException("windowStart must be before or equal to windowEnd");
        }

        this.reportId = Objects.requireNonNull(reportId, "reportId must not be null");
        this.reportTitle = Objects.requireNonNull(reportTitle, "reportTitle must not be null");
        this.generatedAt = Objects.requireNonNull(generatedAt, "generatedAt must not be null");
        this.windowStart = windowStart;
        this.windowEnd = windowEnd;
        this.totalRecords = totalRecords;
        this.compliantRecords = compliantRecords;
        this.warningAlertCount = warningAlertCount;
        this.criticalAlertCount = criticalAlertCount;
        this.meanExposurePpmHr = meanExposurePpmHr;
        this.peakExposurePpmHr = peakExposurePpmHr;

        // Defensive copying to ensure encapsulation and prevent outside mutation
        this.zoneSummaries = zoneSummaries == null ? List.of() : List.copyOf(zoneSummaries);
        this.activeAlerts = activeAlerts == null ? List.of() : List.copyOf(activeAlerts);
    }

    @Override
    public String getId() {
        return reportId;
    }

    public String getReportId() {
        return reportId;
    }

    public String getReportTitle() {
        return reportTitle;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public LocalDateTime getWindowStart() {
        return windowStart;
    }

    public LocalDateTime getWindowEnd() {
        return windowEnd;
    }

    public int getTotalRecords() {
        return totalRecords;
    }

    public int getCompliantRecords() {
        return compliantRecords;
    }

    public int getWarningAlertCount() {
        return warningAlertCount;
    }

    public int getCriticalAlertCount() {
        return criticalAlertCount;
    }

    public double getMeanExposurePpmHr() {
        return meanExposurePpmHr;
    }

    public double getPeakExposurePpmHr() {
        return peakExposurePpmHr;
    }

    /**
     * Returns an unmodifiable list of zone summaries, preserving encapsulation.
     */
    public List<ZoneExposureSummary> getZoneSummaries() {
        return zoneSummaries;
    }

    /**
     * Returns an unmodifiable list of active alerts.
     */
    public List<Alert> getActiveAlerts() {
        return activeAlerts;
    }

    /**
     * Computes the facility-wide compliance rate percentage.
     *
     * @return percentage in range [0.0, 100.0]
     */
    public double getComplianceRate() {
        if (totalRecords == 0) return 100.0;
        return (compliantRecords * 100.0) / totalRecords;
    }

    /**
     * Determines whether the facility satisfies minimum target compliance (>= 90%).
     */
    public boolean isOverallFacilityCompliant() {
        return getComplianceRate() >= 90.0 && criticalAlertCount == 0;
    }

    /**
     * Computes a composite illustrative safety index [0.0 to 100.0],
     * penalizing warning and critical alert occurrences.
     */
    public double calculateSafetyIndex() {
        double base = getComplianceRate();
        double penalty = (warningAlertCount * 1.5) + (criticalAlertCount * 4.0);
        return Math.max(0.0, Math.min(100.0, base - penalty));
    }

    @Override
    public String toString() {
        return String.format("ExposureReport[id=%s, records=%d, compliance=%.1f%%, safetyIndex=%.1f]",
                reportId, totalRecords, getComplianceRate(), calculateSafetyIndex());
    }
}
