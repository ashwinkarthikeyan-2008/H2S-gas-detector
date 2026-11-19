package com.chromaguard.controller;

import com.chromaguard.dto.ExposureRecordDto;
import com.chromaguard.dto.ZoneDetailDto;
import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.IndustrialZone;
import com.chromaguard.service.ZoneService;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/zones")
@CrossOrigin(origins = "*")
@Validated
public class ZoneController {

    private final ZoneService zoneService;

    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @GetMapping
    public ResponseEntity<List<IndustrialZone>> getAllZones() {
        return ResponseEntity.ok(zoneService.getAllZones());
    }

    @GetMapping("/manage")
    public ResponseEntity<List<IndustrialZone>> getAllZonesForAdmin() {
        return ResponseEntity.ok(zoneService.getAllZonesForAdmin());
    }

    @PostMapping
    public ResponseEntity<IndustrialZone> createZone(@RequestBody IndustrialZone zone, Authentication authentication) {
        assertAdmin(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(zoneService.createZone(zone));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IndustrialZone> updateZone(@PathVariable String id, @RequestBody IndustrialZone zone, Authentication authentication) {
        assertAdmin(authentication);
        return ResponseEntity.ok(zoneService.updateZone(id, zone));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteZone(@PathVariable String id, Authentication authentication) {
        assertAdmin(authentication);
        zoneService.deleteZone(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Void> restoreZone(@PathVariable String id, Authentication authentication) {
        assertAdmin(authentication);
        zoneService.restoreZone(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<IndustrialZone> getZoneById(@PathVariable String id) {
        return ResponseEntity.ok(zoneService.getZoneById(id));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<ZoneDetailDto> getZoneDetail(@PathVariable String id) {
        return ResponseEntity.ok(zoneService.getZoneDetailById(id));
    }

    private void assertAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities().stream()
                .noneMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can manage zones.");
        }
    }

    @GetMapping("/{id}/records")
    public ResponseEntity<Page<ExposureRecordDto>> getZoneRecords(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Page index must not be negative") int page,
            @RequestParam(defaultValue = "20") @Min(value = 1, message = "Page size must be at least 1")
            @Max(value = 100, message = "Page size must not exceed 100") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String shiftId,
            @RequestParam(required = false) DemoStatus demoStatus) {

        Sort sort = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        LocalDateTime startDt = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDt = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<ExposureRecordDto> result = zoneService.getZoneRecordsPaged(id, startDt, endDt, shiftId, demoStatus, pageable);
        return ResponseEntity.ok(result);
    }
}
