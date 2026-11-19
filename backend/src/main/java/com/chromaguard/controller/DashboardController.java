package com.chromaguard.controller;

import com.chromaguard.dto.*;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.entity.IndustrialZone;
import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.repository.IndustrialZoneRepository;
import com.chromaguard.repository.WorkerRepository;
import com.chromaguard.service.AnalyticsService;
import com.chromaguard.service.ExposureCalculationService;
import com.chromaguard.service.ActiveDatasetService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final ExposureRecordRepository exposureRecordRepository;
    private final WorkerRepository workerRepository;
    private final IndustrialZoneRepository zoneRepository;
    private final AlertRepository alertRepository;
    private final ExposureCalculationService calculationService;
    private final AnalyticsService analyticsService;
    private final ActiveDatasetService activeDatasetService;

    public DashboardController(ExposureRecordRepository exposureRecordRepository,
                               WorkerRepository workerRepository,
                               IndustrialZoneRepository zoneRepository,
                               AlertRepository alertRepository,
                               ExposureCalculationService calculationService,
                               AnalyticsService analyticsService, ActiveDatasetService activeDatasetService) {
        this.exposureRecordRepository = exposureRecordRepository;
        this.workerRepository = workerRepository;
        this.zoneRepository = zoneRepository;
        this.alertRepository = alertRepository;
        this.calculationService = calculationService;
        this.analyticsService = analyticsService;
        this.activeDatasetService = activeDatasetService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryDto> getSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus demoStatus) {

        List<ExposureRecord> records = getFilteredRecords(startDate, endDate, zoneId, shiftId, workerId, demoStatus);

        long totalWorkers = records.stream().map(r -> r.getWorker().getId()).distinct().count();
        long totalRecords = records.size();

        double avgExposure = Math.round(calculationService.calculateMeanExposure(records) * 100.0) / 100.0;
        double maxExposure = Math.round(calculationService.calculateMaxExposure(records) * 100.0) / 100.0;
        double minExposure = Math.round(calculationService.calculateMinExposure(records) * 100.0) / 100.0;

        long warningCount = records.stream().filter(r -> r.getDemoStatus() == DemoStatus.WARNING).count();
        long criticalCount = records.stream().filter(r -> r.getDemoStatus() == DemoStatus.CRITICAL).count();
        long elevatedCount = records.stream().filter(r -> r.getDemoStatus() == DemoStatus.ELEVATED).count();
        long normalCount = records.stream().filter(r -> r.getDemoStatus() == DemoStatus.NORMAL).count();

        LocalDateTime startDt = startDate == null ? null : startDate.atStartOfDay();
        LocalDateTime endDt = endDate == null ? null : endDate.atTime(LocalTime.MAX);
        long totalAlerts = warningCount + criticalCount;
        long unacknowledgedAlerts = alertRepository.findWithActiveDatasetFilters(activeDatasetService.getActiveVersion(),
                        startDt, endDt, zoneId, workerId, null, false).size();

        DashboardSummaryDto summary = new DashboardSummaryDto(
                totalWorkers,
                totalRecords,
                avgExposure,
                maxExposure,
                minExposure,
                warningCount,
                criticalCount,
                elevatedCount,
                normalCount,
                totalAlerts,
                unacknowledgedAlerts,
                "SIMULATED_DEMO_DATA"
        );

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/trends")
    public ResponseEntity<List<TrendPointDto>> getTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus demoStatus) {

        List<ExposureRecord> records = getFilteredRecords(startDate, endDate, zoneId, shiftId, workerId, demoStatus);
        Map<String, List<ExposureRecord>> byDate = calculationService.groupByDate(records);

        List<TrendPointDto> points = byDate.entrySet().stream()
                .map(entry -> {
                    String date = entry.getKey();
                    List<ExposureRecord> dayRecords = entry.getValue();
                    double avg = Math.round(calculationService.calculateMeanExposure(dayRecords) * 100.0) / 100.0;
                    double max = Math.round(calculationService.calculateMaxExposure(dayRecords) * 100.0) / 100.0;
                    long warnings = dayRecords.stream().filter(r -> r.getDemoStatus() == DemoStatus.WARNING).count();
                    long criticals = dayRecords.stream().filter(r -> r.getDemoStatus() == DemoStatus.CRITICAL).count();
                    return new TrendPointDto(date, avg, max, dayRecords.size(), warnings, criticals);
                })
                .sorted(Comparator.comparing(TrendPointDto::getDate))
                .collect(Collectors.toList());

        return ResponseEntity.ok(points);
    }

    @GetMapping("/zone-comparison")
    public ResponseEntity<List<ZoneComparisonDto>> getZoneComparison(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus demoStatus) {

        List<IndustrialZone> allZones = zoneRepository.findAll();
        List<ExposureRecord> records = getFilteredRecords(startDate, endDate, null, shiftId, workerId, demoStatus);
        Map<String, List<ExposureRecord>> byZone = calculationService.groupByZone(records);

        List<ZoneComparisonDto> list = allZones.stream()
                .map(zone -> {
                    List<ExposureRecord> zRecs = byZone.getOrDefault(zone.getId(), Collections.emptyList());
                    double avg = zRecs.isEmpty() ? 0.0 : Math.round(calculationService.calculateMeanExposure(zRecs) * 100.0) / 100.0;
                    double max = zRecs.isEmpty() ? 0.0 : Math.round(calculationService.calculateMaxExposure(zRecs) * 100.0) / 100.0;
                    long alertCount = zRecs.stream().filter(r -> r.getDemoStatus() == DemoStatus.WARNING || r.getDemoStatus() == DemoStatus.CRITICAL).count();

                    return new ZoneComparisonDto(
                            zone.getId(),
                            zone.getZoneCode(),
                            zone.getZoneName(),
                            zone.getRiskTier().name(),
                            zone.getBaselineExposurePpmHr(),
                            avg,
                            max,
                            zRecs.size(),
                            alertCount
                    );
                })
                .sorted(Comparator.comparing(ZoneComparisonDto::getAvgExposurePpmHr).reversed())
                .collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }

    @GetMapping("/status-distribution")
    public ResponseEntity<List<StatusDistributionDto>> getStatusDistribution(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId) {

        List<ExposureRecord> records = getFilteredRecords(startDate, endDate, zoneId, shiftId, workerId, null);
        long total = records.size();

        Map<DemoStatus, Long> counts = records.stream()
                .collect(Collectors.groupingBy(ExposureRecord::getDemoStatus, Collectors.counting()));

        List<StatusDistributionDto> result = new ArrayList<>();
        Map<DemoStatus, String> colors = Map.of(
                DemoStatus.NORMAL, "#10B981",    // Green / Emerald
                DemoStatus.ELEVATED, "#06B6D4",  // Cyan
                DemoStatus.WARNING, "#F59E0B",   // Amber
                DemoStatus.CRITICAL, "#EF4444"   // Red
        );

        for (DemoStatus st : DemoStatus.values()) {
            long c = counts.getOrDefault(st, 0L);
            double pct = total > 0 ? Math.round(((double) c / total * 100.0) * 10.0) / 10.0 : 0.0;
            result.add(new StatusDistributionDto(
                    st.name(),
                    st.getDisplayName(),
                    c,
                    pct,
                    colors.getOrDefault(st, "#6B7280")
            ));
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/histogram")
    public ResponseEntity<List<HistogramBinDto>> getHistogram(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(defaultValue = "10") int bins) {

        List<ExposureRecord> records = getFilteredRecords(startDate, endDate, zoneId, shiftId, workerId, null);
        List<HistogramBinDto> histogram = analyticsService.calculateExposureHistogram(records, bins);
        return ResponseEntity.ok(histogram);
    }

    @GetMapping("/heatmap")
    public ResponseEntity<List<HeatmapCellDto>> getHeatmap(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus demoStatus) {

        List<ExposureRecord> records = getFilteredRecords(startDate, endDate, null, shiftId, workerId, demoStatus);

        // Group by zoneCode and date
        Map<String, Map<String, List<ExposureRecord>>> grouped = records.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getZone().getZoneCode(),
                        Collectors.groupingBy(r -> r.getTimestamp().toLocalDate().toString())
                ));

        List<IndustrialZone> zones = zoneRepository.findAll();
        List<HeatmapCellDto> cells = new ArrayList<>();

        for (IndustrialZone z : zones) {
            Map<String, List<ExposureRecord>> dateMap = grouped.getOrDefault(z.getZoneCode(), Collections.emptyMap());
            for (Map.Entry<String, List<ExposureRecord>> entry : dateMap.entrySet()) {
                String date = entry.getKey();
                List<ExposureRecord> cellRecs = entry.getValue();
                double avg = Math.round(calculationService.calculateMeanExposure(cellRecs) * 100.0) / 100.0;
                cells.add(new HeatmapCellDto(z.getZoneCode(), z.getZoneName(), date, avg, cellRecs.size()));
            }
        }

        return ResponseEntity.ok(cells);
    }

    @GetMapping("/worker-comparison")
    public ResponseEntity<List<Map<String, Object>>> getWorkerComparison(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus demoStatus,
            @RequestParam(defaultValue = "10") int limit) {

        List<ExposureRecord> records = getFilteredRecords(startDate, endDate, zoneId, shiftId, workerId, demoStatus);

        Map<String, List<ExposureRecord>> byWorker = calculationService.groupByWorker(records);

        List<Map<String, Object>> result = byWorker.entrySet().stream()
                .map(entry -> {
                    String wId = entry.getKey();
                    List<ExposureRecord> wRecs = entry.getValue();
                    String wName = wRecs.isEmpty() ? wId : wRecs.get(0).getWorker().getSyntheticName();
                    double avg = Math.round(calculationService.calculateMeanExposure(wRecs) * 100.0) / 100.0;
                    double max = Math.round(calculationService.calculateMaxExposure(wRecs) * 100.0) / 100.0;

                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("workerId", wId);
                    map.put("workerName", wName);
                    map.put("avgExposurePpmHr", avg);
                    map.put("maxExposurePpmHr", max);
                    map.put("recordCount", wRecs.size());
                    return map;
                })
                .sorted((a, b) -> Double.compare((double) b.get("avgExposurePpmHr"), (double) a.get("avgExposurePpmHr")))
                .limit(limit)
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    private List<ExposureRecord> getFilteredRecords(
            LocalDate startDate, LocalDate endDate, String zoneId, String shiftId, String workerId, DemoStatus demoStatus) {

        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        return exposureRecordRepository.findWithActiveDatasetFilters(activeDatasetService.getActiveVersion(),
                startDt, endDt, zoneId, shiftId, workerId, demoStatus);
    }
}
