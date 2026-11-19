package com.chromaguard.service;

import com.chromaguard.dto.*;
import com.chromaguard.entity.Alert;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.entity.Worker;
import com.chromaguard.exception.ResourceNotFoundException;
import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.repository.WorkerRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class WorkerService {

    private final WorkerRepository workerRepository;
    private final ExposureRecordRepository exposureRecordRepository;
    private final AlertRepository alertRepository;
    private final ExposureCalculationService calculationService;
    private final ActiveDatasetService activeDatasetService;

    public WorkerService(WorkerRepository workerRepository,
                         ExposureRecordRepository exposureRecordRepository,
                         AlertRepository alertRepository,
                         ExposureCalculationService calculationService,
                         ActiveDatasetService activeDatasetService) {
        this.workerRepository = workerRepository;
        this.exposureRecordRepository = exposureRecordRepository;
        this.alertRepository = alertRepository;
        this.calculationService = calculationService;
        this.activeDatasetService = activeDatasetService;
    }

    public List<WorkerSummaryDto> getAllWorkers(String searchQuery, String zoneId, String shiftId) {
        List<Worker> workers;
        if (searchQuery != null && !searchQuery.isBlank()) {
            workers = workerRepository.searchWorkers(searchQuery.trim());
        } else {
            workers = workerRepository.findAll();
        }

        if (zoneId != null && !zoneId.isBlank()) {
            workers = workers.stream().filter(w -> w.getAssignedZone().getId().equalsIgnoreCase(zoneId)).toList();
        }

        if (shiftId != null && !shiftId.isBlank()) {
            workers = workers.stream().filter(w -> w.getPreferredShift().getId().equalsIgnoreCase(shiftId)).toList();
        }

        return workers.stream()
                .map(this::buildWorkerSummary)
                .sorted(Comparator.comparing(WorkerSummaryDto::getId))
                .collect(Collectors.toList());
    }

    public WorkerSummaryDto getWorkerSummaryById(String workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", workerId));
        return buildWorkerSummary(worker);
    }

    public WorkerSummaryDto updateWorkerProfile(String workerId, WorkerProfileUpdateRequest request) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", workerId));
        worker.setSyntheticName(request.getSyntheticName().trim());
        worker.setRole(request.getRole().trim());
        worker.setExperienceYears(request.getExperienceYears());
        worker.setBadgeId(request.getBadgeId().trim());
        return buildWorkerSummary(workerRepository.save(worker));
    }

    public WorkerDetailDto getWorkerDetailById(String workerId) {
        Worker worker = workerRepository.findById(workerId)
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", workerId));

        WorkerSummaryDto summary = buildWorkerSummary(worker);
        List<ExposureRecord> records = recordsForWorker(workerId);
        List<Alert> alerts = alertsForWorker(workerId);

        List<ExposureRecordDto> recordDtos = records.stream()
                .map(this::toRecordDto)
                .collect(Collectors.toList());

        List<AlertDto> alertDtos = alerts.stream()
                .map(this::toAlertDto)
                .collect(Collectors.toList());

        // Build exposure trend by date
        Map<String, List<ExposureRecord>> byDate = calculationService.groupByDate(records);
        List<TrendPointDto> trend = byDate.entrySet().stream()
                .map(entry -> {
                    String date = entry.getKey();
                    List<ExposureRecord> dayRecords = entry.getValue();
                    double avg = round(calculationService.calculateMeanExposure(dayRecords));
                    double max = round(calculationService.calculateMaxExposure(dayRecords));
                    long warnings = dayRecords.stream().filter(r -> r.getDemoStatus().name().equals("WARNING")).count();
                    long criticals = dayRecords.stream().filter(r -> r.getDemoStatus().name().equals("CRITICAL")).count();
                    return new TrendPointDto(date, avg, max, dayRecords.size(), warnings, criticals);
                })
                .sorted(Comparator.comparing(TrendPointDto::getDate))
                .collect(Collectors.toList());

        return new WorkerDetailDto(summary, recordDtos, alertDtos, trend);
    }

    public List<ExposureRecordDto> getWorkerExposureRecords(String workerId) {
        if (!workerRepository.existsById(workerId)) {
            throw new ResourceNotFoundException("Worker", "id", workerId);
        }
        return recordsForWorker(workerId).stream()
                .map(this::toRecordDto)
                .collect(Collectors.toList());
    }

    public WorkerSummaryDto buildWorkerSummary(Worker worker) {
        List<ExposureRecord> records = recordsForWorker(worker.getId());
        long count = records.size();
        double avg = round(calculationService.calculateMeanExposure(records));
        double max = round(calculationService.calculateMaxExposure(records));

        String latestStatus = records.isEmpty() ? "NORMAL" : records.get(0).getDemoStatus().name();
        String latestTimestamp = records.isEmpty() ? "" : records.get(0).getTimestamp().toString();

        return new WorkerSummaryDto(
                worker.getId(),
                worker.getSyntheticName(),
                worker.getAssignedZone().getId(),
                worker.getAssignedZone().getZoneName(),
                worker.getPreferredShift().getId(),
                worker.getPreferredShift().getShiftName(),
                worker.getRole(),
                worker.getExperienceYears(),
                worker.getBadgeId(),
                count,
                avg,
                max,
                latestStatus,
                latestTimestamp
        );
    }

    private List<ExposureRecord> recordsForWorker(String workerId) {
        String activeVersion = activeDatasetService.getActiveVersion();
        if (activeVersion == null) return exposureRecordRepository.findByWorkerIdOrderByTimestampDesc(workerId);
        return exposureRecordRepository.findByDatasetVersion(activeVersion).stream()
                .filter(record -> record.getWorker().getId().equals(workerId))
                .sorted(Comparator.comparing(ExposureRecord::getTimestamp).reversed())
                .toList();
    }

    private List<Alert> alertsForWorker(String workerId) {
        String activeVersion = activeDatasetService.getActiveVersion();
        if (activeVersion == null) return alertRepository.findByWorkerIdOrderByTimestampDesc(workerId);
        return alertRepository.findWithActiveDatasetFilters(activeVersion, null, null, null, workerId, null, null);
    }

    public ExposureRecordDto toRecordDto(ExposureRecord r) {
        return new ExposureRecordDto(
                r.getId(),
                r.getWorker().getId(),
                r.getWorker().getSyntheticName(),
                r.getZone().getId(),
                r.getZone().getZoneCode(),
                r.getZone().getZoneName(),
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
                r.getDatasetVersion(),
                r.getSourceDatasetJson()
        );
    }

    private AlertDto toAlertDto(Alert a) {
        return new AlertDto(
                a.getId(),
                a.getExposureRecord().getId(),
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
                a.getAcknowledgedAt() != null ? a.getAcknowledgedAt().toString() : "",
                a.getAcknowledgedBy() != null ? a.getAcknowledgedBy() : "",
                a.getActionNotes() != null ? a.getActionNotes() : ""
        );
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
