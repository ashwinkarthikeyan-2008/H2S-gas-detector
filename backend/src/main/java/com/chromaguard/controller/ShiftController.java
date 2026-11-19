package com.chromaguard.controller;

import com.chromaguard.entity.Shift;
import com.chromaguard.repository.ShiftRepository;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.service.ActiveDatasetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shifts")
@CrossOrigin(origins = "*")
public class ShiftController {

    private final ShiftRepository shiftRepository;
    private final ExposureRecordRepository exposureRecordRepository;
    private final ActiveDatasetService activeDatasetService;

    public ShiftController(ShiftRepository shiftRepository, ExposureRecordRepository exposureRecordRepository,
                           ActiveDatasetService activeDatasetService) {
        this.shiftRepository = shiftRepository;
        this.exposureRecordRepository = exposureRecordRepository;
        this.activeDatasetService = activeDatasetService;
    }

    @GetMapping
    public ResponseEntity<List<Shift>> getAllShifts() {
        String activeVersion = activeDatasetService.getActiveVersion();
        if (activeVersion == null) return ResponseEntity.ok(shiftRepository.findAll());
        java.util.Set<String> visibleShiftIds = exposureRecordRepository.findByDatasetVersion(activeVersion).stream()
                .map(record -> record.getShift().getId()).collect(java.util.stream.Collectors.toSet());
        return ResponseEntity.ok(shiftRepository.findAllById(visibleShiftIds));
    }
}
