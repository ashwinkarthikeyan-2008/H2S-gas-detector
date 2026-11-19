package com.chromaguard.controller;

import com.chromaguard.domain.ExposureReport;
import com.chromaguard.domain.report.JsonReportFormatter;
import com.chromaguard.dto.ExposureReportDto;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.service.ReportService;
import com.chromaguard.service.ActiveDatasetService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;
    private final ExposureRecordRepository exposureRecordRepository;
    private final AlertRepository alertRepository;
    private final ActiveDatasetService activeDatasetService;
    private final JsonReportFormatter jsonReportFormatter = new JsonReportFormatter();

    public ReportController(ReportService reportService,
                            ExposureRecordRepository exposureRecordRepository,
                            AlertRepository alertRepository, ActiveDatasetService activeDatasetService) {
        this.reportService = reportService;
        this.exposureRecordRepository = exposureRecordRepository;
        this.alertRepository = alertRepository;
        this.activeDatasetService = activeDatasetService;
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummaryReport() {
        return ResponseEntity.ok(reportService.generateExecutiveSummaryReport());
    }

    @GetMapping("/formal")
    public ResponseEntity<ExposureReportDto> getFormalComplianceReport() {
        ExposureReport report = reportService.generateDomainExposureReport();
        return ResponseEntity.ok(ExposureReportDto.fromDomain(report));
    }

    @GetMapping(value = "/export/json", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> exportReportJson() {
        ExposureReport report = reportService.generateDomainExposureReport();
        String jsonOutput = reportService.formatReport(report, jsonReportFormatter);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chromaguard_formal_report.json");
        headers.setContentType(MediaType.APPLICATION_JSON);

        return ResponseEntity.ok()
                .headers(headers)
                .body(jsonOutput);
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus demoStatus) {

        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        List<ExposureRecord> records = exposureRecordRepository.findWithActiveDatasetFilters(activeDatasetService.getActiveVersion(), startDt, endDt, zoneId, shiftId, workerId, demoStatus);
        String csvData = reportService.exportRecordsToCsv(records);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chromaguard_exposure_records.csv");
        headers.setContentType(MediaType.parseMediaType("text/csv"));

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvData);
    }

    @GetMapping(value = "/export/alerts-csv", produces = "text/csv")
    public ResponseEntity<String> exportAlertsCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus severity,
            @RequestParam(required = false) Boolean isAcknowledged) {

        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        List<com.chromaguard.entity.Alert> alerts = alertRepository.findWithActiveDatasetFilters(activeDatasetService.getActiveVersion(), startDt, endDt, zoneId, workerId, severity, isAcknowledged);
        String csvData = reportService.exportAlertsToCsv(alerts);

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=chromaguard_simulated_alerts.csv");
        headers.setContentType(MediaType.parseMediaType("text/csv"));

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvData);
    }
}
