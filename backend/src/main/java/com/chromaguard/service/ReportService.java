package com.chromaguard.service;

import com.chromaguard.domain.ExposureReport;
import com.chromaguard.domain.ZoneExposureSummary;
import com.chromaguard.domain.report.ReportFormatter;
import com.chromaguard.dto.DashboardSummaryDto;
import com.chromaguard.dto.DescriptiveStatsDto;
import com.chromaguard.dto.ZoneComparisonDto;
import com.chromaguard.entity.Alert;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.ExposureRecordRepository;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReportService {

    private final ExposureRecordRepository exposureRecordRepository;
    private final AlertRepository alertRepository;
    private final AnalyticsService analyticsService;
    private final ExposureCalculationService calculationService;
    private final ActiveDatasetService activeDatasetService;

    public ReportService(ExposureRecordRepository exposureRecordRepository,
                         AlertRepository alertRepository,
                         AnalyticsService analyticsService,
                         ExposureCalculationService calculationService, ActiveDatasetService activeDatasetService) {
        this.exposureRecordRepository = exposureRecordRepository;
        this.alertRepository = alertRepository;
        this.analyticsService = analyticsService;
        this.calculationService = calculationService;
        this.activeDatasetService = activeDatasetService;
    }

    private List<ExposureRecord> currentDatasetRecords() {
        String version = activeDatasetService.getActiveVersion();
        return version == null ? exposureRecordRepository.findAll() : exposureRecordRepository.findByDatasetVersion(version);
    }

    /**
     * Generates a comprehensive analytical summary report in structured JSON format.
     */
    public Map<String, Object> generateExecutiveSummaryReport() {
        List<ExposureRecord> records = currentDatasetRecords();
        List<DescriptiveStatsDto> stats = analyticsService.getAllDescriptiveStatistics();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("reportTitle", "ChromaGuard Industrial H2S Exposure Intelligence & Academic DEV Audit Report");
        report.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        report.put("environment", "SOFTWARE_DEMONSTRATION_SIMULATION");
        report.put("disclaimer", "ACADEMIC DEMO NOTICE: All calculations, exposure values (expressed in ppm·hr), and alerts are derived from deterministic synthetic datasets. Not certified for life-safety or official OSHA compliance monitoring.");

        Map<String, Object> datasetMetrics = new LinkedHashMap<>();
        datasetMetrics.put("totalRecords", records.size());
        datasetMetrics.put("dataSpanDays", records.stream().map(r -> r.getTimestamp().toLocalDate()).distinct().count());
        datasetMetrics.put("simulatedWorkers", records.stream().map(r -> r.getWorker().getId()).distinct().count());
        datasetMetrics.put("industrialZonesMonitored", records.stream().map(r -> r.getZone().getId()).distinct().count());
        datasetMetrics.put("warningThresholdPpmHr", calculationService.getWarningThresholdPpmHr());
        datasetMetrics.put("criticalThresholdPpmHr", calculationService.getCriticalThresholdPpmHr());
        report.put("datasetMetrics", datasetMetrics);

        report.put("descriptiveStatistics", stats);

        // Zone comparisons
        Map<String, List<ExposureRecord>> byZone = calculationService.groupByZone(records);
        List<Map<String, Object>> zoneBreakdowns = new ArrayList<>();
        for (Map.Entry<String, List<ExposureRecord>> entry : byZone.entrySet()) {
            List<ExposureRecord> zRecs = entry.getValue();
            if (zRecs.isEmpty()) continue;
            var sample = zRecs.get(0);
            Map<String, Object> zData = new LinkedHashMap<>();
            zData.put("zoneId", sample.getZone().getId());
            zData.put("zoneCode", sample.getZone().getZoneCode());
            zData.put("zoneName", sample.getZone().getZoneName());
            zData.put("riskTier", sample.getZone().getRiskTier().name());
            zData.put("baselinePpmHr", sample.getZone().getBaselineExposurePpmHr());
            zData.put("meanExposurePpmHr", Math.round(calculationService.calculateMeanExposure(zRecs) * 100.0) / 100.0);
            zData.put("maxExposurePpmHr", Math.round(calculationService.calculateMaxExposure(zRecs) * 100.0) / 100.0);
            zData.put("recordCount", zRecs.size());
            zoneBreakdowns.add(zData);
        }
        report.put("zoneBreakdowns", zoneBreakdowns);

        report.put("academicMethodologyNotes", List.of(
                "Cumulative dose is evaluated using discrete integration over operational shift windows (8 hours).",
                "Outlier identification employs Tukey's Fences (IQR = Q3 - Q1, with k = 1.5 multiplier).",
                "RGB components reflect simulated optical densitometry response curves for synthetic colorimetric badges."
        ));

        return report;
    }

    /**
     * Exports exposure records to CSV format.
     */
    public String exportRecordsToCsv(List<ExposureRecord> records) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);

        // Header
        pw.println("record_id,worker_id,worker_name,zone_id,zone_code,shift_id,shift_name,timestamp,simulated_r,simulated_g,simulated_b,illustrative_exposure_ppm_hr,cumulative_dose_ppm_hr,demo_status,data_source,dataset_version");

        for (ExposureRecord r : records) {
            pw.printf("%s,%s,\"%s\",%s,%s,%s,\"%s\",%s,%d,%d,%d,%.2f,%.2f,%s,%s,%s%n",
                    r.getId(),
                    r.getWorker().getId(),
                    r.getWorker().getSyntheticName(),
                    r.getZone().getId(),
                    r.getZone().getZoneCode(),
                    r.getShift().getId(),
                    r.getShift().getShiftName(),
                    r.getTimestamp().toString(),
                    r.getSimulatedColorR(),
                    r.getSimulatedColorG(),
                    r.getSimulatedColorB(),
                    r.getIllustrativeExposureValue(),
                    r.getIllustrativeCumulativeDose(),
                    r.getDemoStatus().name(),
                    r.getDataSource(),
                    r.getDatasetVersion()
            );
        }

        pw.flush();
        return sw.toString();
    }

    /**
     * Exports simulated alerts to CSV format with consistent column names and units.
     * Clearly labels each row with simulation flag.
     */
    public String exportAlertsToCsv(List<Alert> alerts) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);

        pw.println("alert_id,synthetic_worker_id,worker_name,zone_id,zone_code,zone_name,timestamp,demo_severity,trigger_value_ppm_hr,threshold_limit_ppm_hr,is_acknowledged,acknowledged_by,acknowledged_at,action_notes,simulation_flag");

        for (Alert a : alerts) {
            pw.printf("%s,%s,\"%s\",%s,%s,\"%s\",%s,%s,%.2f,%.2f,%b,\"%s\",\"%s\",\"%s\",%s%n",
                    a.getId(),
                    a.getWorker().getId(),
                    a.getWorker().getSyntheticName(),
                    a.getZone().getId(),
                    a.getZone().getZoneCode(),
                    a.getZone().getZoneName(),
                    a.getTimestamp().toString(),
                    a.getDemoSeverity().name(),
                    a.getTriggerValuePpmHr(),
                    a.getThresholdLimitPpmHr(),
                    a.getIsAcknowledged(),
                    a.getAcknowledgedBy() != null ? a.getAcknowledgedBy() : "",
                    a.getAcknowledgedAt() != null ? a.getAcknowledgedAt().toString() : "",
                    a.getActionNotes() != null ? a.getActionNotes().replace("\"", "\"\"") : "",
                    "SIMULATED_DEMO_ALERT"
            );
        }

        pw.flush();
        return sw.toString();
    }

    /**
     * Constructs a domain {@link ExposureReport} model containing aggregated compliance,
     * statistical moments, and zone evaluations.
     */
    public ExposureReport generateDomainExposureReport() {
        List<ExposureRecord> records = currentDatasetRecords();
        List<Alert> alerts = alertRepository.findWithActiveDatasetFilters(activeDatasetService.getActiveVersion(), null, null, null, null, null, null);

        int total = records.size();
        int compliant = (int) records.stream().filter(r -> !r.getDemoStatus().isIncidentLevel()).count();
        int warnings = (int) alerts.stream().filter(a -> a.getDemoSeverity() == DemoStatus.WARNING).count();
        int criticals = (int) alerts.stream().filter(a -> a.getDemoSeverity() == DemoStatus.CRITICAL).count();

        double meanExp = calculationService.calculateMeanExposure(records);
        double maxExp = calculationService.calculateMaxExposure(records);

        Map<String, List<ExposureRecord>> byZone = calculationService.groupByZone(records);
        List<ZoneExposureSummary> zoneSummaries = new ArrayList<>();
        for (Map.Entry<String, List<ExposureRecord>> entry : byZone.entrySet()) {
            List<ExposureRecord> zRecs = entry.getValue();
            if (zRecs.isEmpty()) continue;
            var sample = zRecs.get(0);
            long exceedances = zRecs.stream().filter(r -> r.getDemoStatus().isIncidentLevel()).count();
            zoneSummaries.add(new ZoneExposureSummary(
                    sample.getZone().getId(),
                    sample.getZone().getZoneName(),
                    zRecs.size(),
                    Math.round(calculationService.calculateMeanExposure(zRecs) * 100.0) / 100.0,
                    Math.round(calculationService.calculateMaxExposure(zRecs) * 100.0) / 100.0,
                    sample.getZone().getBaselineExposurePpmHr(),
                    exceedances
            ));
        }

        LocalDateTime minDate = records.stream()
                .map(ExposureRecord::getTimestamp)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());
        LocalDateTime maxDate = records.stream()
                .map(ExposureRecord::getTimestamp)
                .max(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

        return new ExposureReport(
                "REP-" + System.currentTimeMillis(),
                "ChromaGuard Industrial H2S Exposure Executive Report",
                LocalDateTime.now(),
                minDate,
                maxDate,
                total,
                compliant,
                warnings,
                criticals,
                Math.round(meanExp * 100.0) / 100.0,
                Math.round(maxExp * 100.0) / 100.0,
                zoneSummaries,
                alerts
        );
    }

    /**
     * Polymorphically formats an ExposureReport using the chosen ReportFormatter strategy.
     */
    public String formatReport(ExposureReport report, ReportFormatter formatter) {
        return formatter.format(report);
    }
}
