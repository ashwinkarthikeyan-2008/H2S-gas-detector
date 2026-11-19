package com.chromaguard.controller;

import com.chromaguard.dto.AcknowledgeAlertRequestDto;
import com.chromaguard.dto.AlertDto;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.Worker;
import com.chromaguard.repository.WorkerRepository;
import com.chromaguard.service.AlertService;
import com.chromaguard.service.CurrentUserService;
import com.chromaguard.service.ActiveDatasetService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    private final AlertService alertService;
    private final CurrentUserService currentUserService;
    private final WorkerRepository workerRepository;
    private final ActiveDatasetService activeDatasetService;

    public AlertController(AlertService alertService, CurrentUserService currentUserService, WorkerRepository workerRepository,
                           ActiveDatasetService activeDatasetService) {
        this.alertService = alertService;
        this.currentUserService = currentUserService;
        this.workerRepository = workerRepository;
        this.activeDatasetService = activeDatasetService;
    }

    @GetMapping
    public ResponseEntity<List<AlertDto>> getAlerts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus severity,
            @RequestParam(required = false) Boolean isAcknowledged,
            Authentication authentication) {

        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        if (currentUserService.isWorker(authentication)) {
            String ownWorkerId = currentUserService.workerId(authentication);
            Worker worker = ownWorkerId == null ? null : workerRepository.findById(ownWorkerId).orElse(null);
            if (worker == null || worker.getAssignedZone() == null) return ResponseEntity.ok(List.of());
            // A worker sees alerts for their assigned zone only, regardless of query parameters.
            zoneId = worker.getAssignedZone().getId();
            workerId = null;
        }

        return ResponseEntity.ok(alertService.getAlertsForDataset(activeDatasetService.getActiveVersion(), startDt, endDt,
                zoneId, workerId, severity, isAcknowledged));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertDto> getAlertById(@PathVariable String id, Authentication authentication) {
        AlertDto alert = alertService.getAlertById(id);
        if (currentUserService.isWorker(authentication)
                && !alert.getWorkerId().equals(currentUserService.workerId(authentication))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Workers may only view their own alerts.");
        }
        return ResponseEntity.ok(alert);
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<AlertDto> acknowledgeAlert(
            @PathVariable String id,
            @Valid @RequestBody AcknowledgeAlertRequestDto request,
            Authentication authentication) {
        if (currentUserService.isWorker(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators may acknowledge alerts.");
        }
        return ResponseEntity.ok(alertService.acknowledgeAlert(id, request));
    }
}
