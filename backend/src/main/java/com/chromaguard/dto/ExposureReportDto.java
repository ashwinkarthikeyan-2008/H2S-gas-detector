package com.chromaguard.dto;

import com.chromaguard.domain.ExposureReport;
import com.chromaguard.domain.ZoneExposureSummary;

import java.util.List;

/**
 * Data Transfer Object (DTO) for ExposureReport API responses.
 * Demonstrates separation of domain models from request/response wire representations
 * using Java 21 Record types for concise, immutable data carriers.
 */
public record ExposureReportDto(
        String reportId,
        String reportTitle,
        String generatedAt,
        String windowStart,
        String windowEnd,
        int totalRecords,
        int compliantRecords,
        double complianceRate,
        double safetyIndex,
        boolean isOverallCompliant,
        int warningAlerts,
        int criticalAlerts,
        double meanExposurePpmHr,
        double peakExposurePpmHr,
        List<ZoneExposureSummary> zoneBreakdowns
) {
    public static ExposureReportDto fromDomain(ExposureReport report) {
        return new ExposureReportDto(
                report.getReportId(),
                report.getReportTitle(),
                report.getGeneratedAt().toString(),
                report.getWindowStart() != null ? report.getWindowStart().toString() : null,
                report.getWindowEnd() != null ? report.getWindowEnd().toString() : null,
                report.getTotalRecords(),
                report.getCompliantRecords(),
                Math.round(report.getComplianceRate() * 100.0) / 100.0,
                Math.round(report.calculateSafetyIndex() * 100.0) / 100.0,
                report.isOverallFacilityCompliant(),
                report.getWarningAlertCount(),
                report.getCriticalAlertCount(),
                report.getMeanExposurePpmHr(),
                report.getPeakExposurePpmHr(),
                report.getZoneSummaries()
        );
    }
}
