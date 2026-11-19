package com.chromaguard.domain.report;

import com.chromaguard.domain.ExposureReport;
import com.chromaguard.domain.ZoneExposureSummary;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Polymorphic implementation of {@link ReportFormatter} rendering reports in JSON.
 * Extends {@link AbstractReportFormatter} as part of the Template Method pattern.
 */
public class JsonReportFormatter extends AbstractReportFormatter {

    private final ObjectMapper objectMapper;

    public JsonReportFormatter() {
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .enable(SerializationFeature.INDENT_OUTPUT);
    }

    @Override
    protected String renderReport(ExposureReport report) {

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("reportId", report.getReportId());
            payload.put("reportTitle", report.getReportTitle());
            payload.put("generatedAt", report.getGeneratedAt().toString());
            payload.put("totalRecords", report.getTotalRecords());
            payload.put("compliantRecords", report.getCompliantRecords());
            payload.put("complianceRatePercent", Math.round(report.getComplianceRate() * 10.0) / 10.0);
            payload.put("safetyIndex", Math.round(report.calculateSafetyIndex() * 10.0) / 10.0);
            payload.put("overallCompliant", report.isOverallFacilityCompliant());
            payload.put("warningAlerts", report.getWarningAlertCount());
            payload.put("criticalAlerts", report.getCriticalAlertCount());
            payload.put("meanExposurePpmHr", report.getMeanExposurePpmHr());
            payload.put("peakExposurePpmHr", report.getPeakExposurePpmHr());
            payload.put("zoneBreakdowns", report.getZoneSummaries());
            return objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize exposure report to JSON", e);
        }
    }

    @Override
    public String getContentType() {
        return "application/json";
    }
}
