package com.chromaguard.controller;

import com.chromaguard.dto.ExposureRecordDto;
import com.chromaguard.dto.ExposureReadingRequestDto;
import com.chromaguard.dto.ExposureReadingResponseDto;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.entity.IndustrialZone;
import com.chromaguard.entity.Shift;
import com.chromaguard.entity.Worker;
import com.chromaguard.exception.ResourceNotFoundException;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.repository.IndustrialZoneRepository;
import com.chromaguard.repository.ShiftRepository;
import com.chromaguard.repository.WorkerRepository;
import com.chromaguard.service.AlertService;
import com.chromaguard.service.CurrentUserService;
import com.chromaguard.service.ExposureCalculationService;
import com.chromaguard.service.ActiveDatasetService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/exposure-records")
@CrossOrigin(origins = "*")
public class ExposureRecordController {

    private final ExposureRecordRepository exposureRecordRepository;
    private final CurrentUserService currentUserService;
    private final WorkerRepository workerRepository;
    private final IndustrialZoneRepository zoneRepository;
    private final ShiftRepository shiftRepository;
    private final ExposureCalculationService exposureCalculationService;
    private final AlertService alertService;
    private final ActiveDatasetService activeDatasetService;

    public ExposureRecordController(ExposureRecordRepository exposureRecordRepository, CurrentUserService currentUserService,
                                    WorkerRepository workerRepository, IndustrialZoneRepository zoneRepository,
                                    ShiftRepository shiftRepository, ExposureCalculationService exposureCalculationService,
                                    AlertService alertService, ActiveDatasetService activeDatasetService) {
        this.exposureRecordRepository = exposureRecordRepository;
        this.currentUserService = currentUserService;
        this.workerRepository = workerRepository;
        this.zoneRepository = zoneRepository;
        this.shiftRepository = shiftRepository;
        this.exposureCalculationService = exposureCalculationService;
        this.alertService = alertService;
        this.activeDatasetService = activeDatasetService;
    }

    /**
     * Accept a cumulative dose reading and automatically persist a warning/critical alert
     * when the configured threshold is crossed. Workers are bound to their own assignment.
     */
    @PostMapping
    public ResponseEntity<ExposureReadingResponseDto> submitReading(
            @Valid @RequestBody ExposureReadingRequestDto request,
            Authentication authentication) {
        Worker worker;
        IndustrialZone zone;
        Shift shift;
        if (currentUserService.isWorker(authentication)) {
            String ownWorkerId = currentUserService.workerId(authentication);
            worker = ownWorkerId == null ? null : workerRepository.findById(ownWorkerId).orElse(null);
            if (worker == null || worker.getAssignedZone() == null || worker.getPreferredShift() == null) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This worker account is not linked to a complete assignment.");
            }
            zone = worker.getAssignedZone();
            shift = worker.getPreferredShift();
        } else {
            if (request.getWorkerId() == null || request.getZoneId() == null || request.getShiftId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Admin readings require workerId, zoneId, and shiftId.");
            }
            worker = workerRepository.findById(request.getWorkerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", request.getWorkerId()));
            zone = zoneRepository.findById(request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("IndustrialZone", "id", request.getZoneId()));
            shift = shiftRepository.findById(request.getShiftId())
                    .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", request.getShiftId()));
        }

        double dose = request.getDosePpmHr();
        DemoStatus status = exposureCalculationService.evaluateStatus(dose);
        var reading = new ExposureRecord(
                "E" + UUID.randomUUID().toString().replace("-", "").substring(0, 31),
                worker, zone, shift, LocalDateTime.now(), 0, 0, 0,
                dose, dose, status, "AUTHENTICATED_READING", "LIVE_V1");
        ExposureRecord saved = exposureRecordRepository.save(reading);
        var alert = alertService.createThresholdAlert(saved).orElse(null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ExposureReadingResponseDto(toDto(saved), alert));
    }

    @GetMapping
    public ResponseEntity<List<ExposureRecordDto>> getRecords(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) String workerId,
            @RequestParam(required = false) DemoStatus demoStatus,
            @RequestParam(required = false, defaultValue = "0") int limit) {

        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        List<ExposureRecord> records = exposureRecordRepository.findWithActiveDatasetFilters(
                activeDatasetService.getActiveVersion(), startDt, endDt, zoneId, shiftId, workerId, demoStatus);

        var stream = records.stream();
        if (limit > 0) stream = stream.limit(limit);
        List<ExposureRecordDto> dtos = stream.map(this::toDto).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExposureRecordDto> getRecordById(@PathVariable String id, Authentication authentication) {
        ExposureRecord record = exposureRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ExposureRecord", "id", id));
        if (currentUserService.isWorker(authentication)
                && !record.getWorker().getId().equals(currentUserService.workerId(authentication))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Workers may only view their own exposure records.");
        }
        return ResponseEntity.ok(toDto(record));
    }

    private ExposureRecordDto toDto(ExposureRecord r) {
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
}
