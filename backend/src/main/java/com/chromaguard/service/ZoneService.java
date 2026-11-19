package com.chromaguard.service;

import com.chromaguard.dto.*;
import com.chromaguard.entity.Alert;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.entity.IndustrialZone;
import com.chromaguard.entity.RiskTier;
import com.chromaguard.entity.Worker;
import com.chromaguard.exception.ResourceNotFoundException;
import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.repository.IndustrialZoneRepository;
import com.chromaguard.repository.WorkerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service encapsulating business operations and analytical queries for Industrial Zones.
 * Reuses existing repositories, entities, and calculation services without creating redundant tables.
 */
@Service
public class ZoneService {

    private final IndustrialZoneRepository zoneRepository;
    private final ExposureRecordRepository exposureRecordRepository;
    private final WorkerRepository workerRepository;
    private final AlertRepository alertRepository;
    private final ExposureCalculationService calculationService;
    private final WorkerService workerService;
    private final AlertService alertService;
    private final ActiveDatasetService activeDatasetService;

    public ZoneService(IndustrialZoneRepository zoneRepository,
                       ExposureRecordRepository exposureRecordRepository,
                       WorkerRepository workerRepository,
                       AlertRepository alertRepository,
                       ExposureCalculationService calculationService,
                       WorkerService workerService,
                       AlertService alertService, ActiveDatasetService activeDatasetService) {
        this.zoneRepository = zoneRepository;
        this.exposureRecordRepository = exposureRecordRepository;
        this.workerRepository = workerRepository;
        this.alertRepository = alertRepository;
        this.calculationService = calculationService;
        this.workerService = workerService;
        this.alertService = alertService;
        this.activeDatasetService = activeDatasetService;
    }

    public List<IndustrialZone> getAllZones() {
        return zoneRepository.findAll().stream().filter(IndustrialZone::isActive).toList();
    }

    public List<IndustrialZone> getAllZonesForAdmin() {
        // This endpoint is the configuration list used for add/edit/delete.
        // Keep it complete even while imported exposure data is active; the
        // dashboard separately limits its exposure filters to imported zones.
        return zoneRepository.findAll();
    }

    public IndustrialZone getZoneById(String id) {
        return zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IndustrialZone", "id", id));
    }

    public IndustrialZone createZone(IndustrialZone input) {
        validateZone(input);
        String requestedCode = normalizeCode(input.getZoneCode());
        IndustrialZone matching = zoneRepository.findByZoneCodeIgnoreCase(requestedCode).orElse(null);
        if (matching != null) {
            if (matching.isActive()) {
                String activeVersion = activeDatasetService.getActiveVersion();
                boolean belongsToCurrentDataset = activeVersion != null && exposureRecordRepository.findByDatasetVersion(activeVersion)
                        .stream().anyMatch(record -> record.getZone().getId().equals(matching.getId()));
                if (!belongsToCurrentDataset) {
                    throw new IllegalArgumentException("That zone code belongs to an existing facility zone. Choose a new code for this imported dataset.");
                }
                return updateZone(matching.getId(), input);
            }
            matching.setZoneName(input.getZoneName().trim());
            matching.setRiskTier(input.getRiskTier());
            matching.setBaselineExposurePpmHr(input.getBaselineExposurePpmHr());
            matching.setDescription(input.getDescription() == null ? "" : input.getDescription().trim());
            matching.setActive(true);
            return zoneRepository.save(matching);
        }
        String id = "ZONE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        IndustrialZone zone = new IndustrialZone(id, requestedCode,
                input.getZoneName().trim(), input.getRiskTier(), input.getBaselineExposurePpmHr(), input.getDescription());
        return zoneRepository.save(zone);
    }

    public IndustrialZone updateZone(String id, IndustrialZone input) {
        IndustrialZone zone = getZoneById(id);
        validateZone(input);
        String code = normalizeCode(input.getZoneCode());
        IndustrialZone duplicate = zoneRepository.findByZoneCodeIgnoreCase(code).orElse(null);
        if (duplicate != null && !duplicate.getId().equals(id)) {
            String activeVersion = activeDatasetService.getActiveVersion();
            boolean duplicateIsOutsideDataset = activeVersion != null && exposureRecordRepository.findByDatasetVersion(activeVersion)
                    .stream().noneMatch(record -> record.getZone().getId().equals(duplicate.getId()));
            if (duplicateIsOutsideDataset) {
                throw new IllegalArgumentException("That zone code belongs to an existing facility zone. Choose a new code for this imported dataset.");
            }
            throw new IllegalArgumentException("A zone with this code already exists.");
        }
        zone.setZoneCode(code);
        zone.setZoneName(input.getZoneName().trim());
        zone.setRiskTier(input.getRiskTier());
        zone.setBaselineExposurePpmHr(input.getBaselineExposurePpmHr());
        zone.setDescription(input.getDescription() == null ? "" : input.getDescription().trim());
        return zoneRepository.save(zone);
    }

    public void deleteZone(String id) {
        IndustrialZone zone = getZoneById(id);
        zone.setActive(false);
        zoneRepository.save(zone);
    }

    public void restoreZone(String id) {
        IndustrialZone zone = getZoneById(id);
        zone.setActive(true);
        zoneRepository.save(zone);
    }

    private void validateZone(IndustrialZone zone) {
        if (zone == null || zone.getZoneCode() == null || zone.getZoneCode().isBlank()
                || zone.getZoneCode().trim().length() > 16 || !zone.getZoneCode().trim().matches("[A-Za-z0-9_-]+") || zone.getZoneName() == null
                || zone.getZoneName().isBlank() || zone.getZoneName().trim().length() > 128
                || zone.getRiskTier() == null || zone.getBaselineExposurePpmHr() == null
                || !Double.isFinite(zone.getBaselineExposurePpmHr()) || zone.getBaselineExposurePpmHr() < 0
                || (zone.getDescription() != null && zone.getDescription().length() > 512)) {
            throw new IllegalArgumentException("Enter a zone code, name, risk tier, and non-negative baseline value.");
        }
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
    }

    public ZoneDetailDto getZoneDetailById(String id) {
        IndustrialZone zone = getZoneById(id);

        String activeVersion = activeDatasetService.getActiveVersion();
        List<ExposureRecord> records = activeVersion == null
                ? exposureRecordRepository.findByZoneIdOrderByTimestampDesc(id)
                : exposureRecordRepository.findWithActiveDatasetFilters(activeVersion, null, null, id, null, null, null);
        List<Worker> stationedWorkers = workerRepository.findByAssignedZoneId(id);
        if (activeVersion != null) {
            Set<String> datasetWorkerIds = records.stream().map(record -> record.getWorker().getId()).collect(Collectors.toSet());
            stationedWorkers = stationedWorkers.stream().filter(worker -> datasetWorkerIds.contains(worker.getId())).toList();
        }
        List<Alert> recentAlerts = alertRepository.findWithActiveDatasetFilters(activeVersion, null, null, id, null, null, null);

        long totalRecords = records.size();
        double meanExposure = totalRecords > 0
                ? Math.round(calculationService.calculateMeanExposure(records) * 100.0) / 100.0
                : 0.0;
        double maxExposure = totalRecords > 0
                ? Math.round(calculationService.calculateMaxExposure(records) * 100.0) / 100.0
                : 0.0;
        double excessPercentage = Math.round(zone.calculateExcessPercentage(meanExposure) * 100.0) / 100.0;

        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        for (DemoStatus status : DemoStatus.values()) {
            long count = records.stream().filter(r -> r.getDemoStatus() == status).count();
            statusBreakdown.put(status.name(), count);
        }

        long incidentCount = records.stream()
                .filter(r -> r.getDemoStatus().isIncidentLevel())
                .count();

        Set<String> visibleWorkerIds = records.stream().map(record -> record.getWorker().getId()).collect(Collectors.toSet());
        List<WorkerSummaryDto> workerDtos = stationedWorkers.stream()
                .filter(worker -> activeVersion == null || visibleWorkerIds.contains(worker.getId()))
                .map(workerService::buildWorkerSummary)
                .sorted(Comparator.comparing(WorkerSummaryDto::getId))
                .collect(Collectors.toList());

        List<AlertDto> alertDtos = recentAlerts.stream()
                .limit(10)
                .map(alertService::toDto)
                .collect(Collectors.toList());

        return new ZoneDetailDto(
                zone.getId(),
                zone.getZoneCode(),
                zone.getZoneName(),
                zone.getRiskTier().name(),
                zone.getBaselineExposurePpmHr(),
                zone.getDescription(),
                stationedWorkers.size(),
                totalRecords,
                meanExposure,
                maxExposure,
                excessPercentage,
                incidentCount,
                statusBreakdown,
                workerDtos,
                alertDtos,
                "SIMULATED_ZONE_DOSIMETRY"
        );
    }

    public Page<ExposureRecordDto> getZoneRecordsPaged(String zoneId, LocalDateTime startDate, LocalDateTime endDate,
                                                      String shiftId, DemoStatus demoStatus, Pageable pageable) {
        if (!zoneRepository.existsById(zoneId)) {
            throw new ResourceNotFoundException("IndustrialZone", "id", zoneId);
        }

        String activeVersion = activeDatasetService.getActiveVersion();
        Page<ExposureRecord> page = activeVersion == null
                ? exposureRecordRepository.findWithFiltersPaged(startDate, endDate, zoneId, shiftId, null, demoStatus, pageable)
                : exposureRecordRepository.findActiveDatasetRecordsPaged(activeVersion, startDate, endDate, zoneId, shiftId, demoStatus, pageable);
        return page.map(workerService::toRecordDto);
    }
}
