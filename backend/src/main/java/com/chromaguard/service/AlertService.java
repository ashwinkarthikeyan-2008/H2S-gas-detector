package com.chromaguard.service;

import com.chromaguard.dto.AcknowledgeAlertRequestDto;
import com.chromaguard.dto.AlertDto;
import com.chromaguard.entity.Alert;
import com.chromaguard.entity.DemoAuditLog;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.exception.ResourceNotFoundException;
import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.DemoAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;
import java.util.UUID;

@Service
public class AlertService {

    @Value("${chromaguard.demo.thresholds.warning-ppm-hr:15.0}")
    private double warningThresholdPpmHr;
    @Value("${chromaguard.demo.thresholds.critical-ppm-hr:20.0}")
    private double criticalThresholdPpmHr;

    private final AlertRepository alertRepository;
    private final DemoAuditLogRepository auditLogRepository;

    public AlertService(AlertRepository alertRepository, DemoAuditLogRepository auditLogRepository) {
        this.alertRepository = alertRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<AlertDto> getAlerts(LocalDateTime startDate, LocalDateTime endDate,
                                   String zoneId, String workerId,
                                   DemoStatus severity, Boolean isAcknowledged) {
        return alertRepository.findWithFilters(startDate, endDate, zoneId, workerId, severity, isAcknowledged)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<AlertDto> getAlertsForDataset(String activeVersion, LocalDateTime startDate, LocalDateTime endDate,
                                               String zoneId, String workerId, DemoStatus severity, Boolean isAcknowledged) {
        return alertRepository.findWithActiveDatasetFilters(activeVersion, startDate, endDate, zoneId, workerId, severity, isAcknowledged)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    public AlertDto getAlertById(String alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));
        return toDto(alert);
    }

    @Transactional
    public AlertDto acknowledgeAlert(String alertId, AcknowledgeAlertRequestDto request) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));

        // Invoke encapsulated domain method on Alert entity
        alert.acknowledge(request.getAcknowledgedBy(), request.getActionNotes(), LocalDateTime.now());

        Alert saved = alertRepository.save(alert);


        auditLogRepository.save(new DemoAuditLog(
                "ALERT_ACKNOWLEDGED",
                String.format("Alert %s (Worker %s, Zone %s) acknowledged: %s",
                        alertId, saved.getWorker().getId(), saved.getZone().getId(), saved.getActionNotes()),
                saved.getAcknowledgedBy(),
                LocalDateTime.now()
        ));

        return toDto(saved);
    }

    public long getUnacknowledgedCount() {
        return alertRepository.countByIsAcknowledgedFalse();
    }

    /** Persist an alert when a newly received cumulative dose reaches an incident threshold. */
    @Transactional
    public Optional<AlertDto> createThresholdAlert(ExposureRecord record) {
        DemoStatus severity = record.getDemoStatus();
        if (severity == null || !severity.isIncidentLevel()) return Optional.empty();

        boolean alreadyCoveredThisShift = alertRepository.findByWorkerIdOrderByTimestampDesc(record.getWorker().getId()).stream()
                .filter(existing -> existing.getExposureRecord() != null)
                .filter(existing -> existing.getZone().getId().equals(record.getZone().getId()))
                .filter(existing -> existing.getTimestamp().toLocalDate().equals(record.getTimestamp().toLocalDate()))
                .filter(existing -> existing.getExposureRecord().getShift().getId().equals(record.getShift().getId()))
                .anyMatch(existing -> existing.getDemoSeverity().getSeverityRank() >= severity.getSeverityRank());
        if (alreadyCoveredThisShift) return Optional.empty();

        double limit = severity == DemoStatus.CRITICAL ? criticalThresholdPpmHr : warningThresholdPpmHr;
        Alert alert = new Alert(
                "A" + UUID.randomUUID().toString().replace("-", "").substring(0, 31),
                record,
                record.getWorker(),
                record.getZone(),
                record.getTimestamp(),
                severity,
                record.getIllustrativeCumulativeDose(),
                limit,
                false,
                null,
                null,
                null
        );
        return Optional.of(toDto(alertRepository.save(alert)));
    }

    public AlertDto toDto(Alert a) {
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
}
