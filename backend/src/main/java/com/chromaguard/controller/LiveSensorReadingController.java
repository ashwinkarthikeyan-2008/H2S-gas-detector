package com.chromaguard.controller;

import com.chromaguard.dto.LiveSensorReadingDto;
import com.chromaguard.dto.LiveSensorReadingRequestDto;
import com.chromaguard.entity.LiveSensorReading;
import com.chromaguard.exception.ResourceNotFoundException;
import com.chromaguard.repository.LiveSensorReadingRepository;
import com.chromaguard.repository.WorkerRepository;
import com.chromaguard.service.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/live-sensor-readings")
public class LiveSensorReadingController {
    private static final int MAX_PAGE_SIZE = 100;

    private final LiveSensorReadingRepository readings;
    private final WorkerRepository workers;
    private final CurrentUserService currentUserService;

    public LiveSensorReadingController(LiveSensorReadingRepository readings, WorkerRepository workers,
                                       CurrentUserService currentUserService) {
        this.readings = readings;
        this.workers = workers;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ResponseEntity<LiveSensorReadingDto> saveReading(
            @Valid @RequestBody LiveSensorReadingRequestDto request,
            Authentication authentication) {
        if (currentUserService.isWorker(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can assign shared-device readings to workers.");
        }
        if (!request.hasSensorValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one numeric sensor value is required.");
        }

        var worker = workers.findById(request.getWorkerId())
                .orElseThrow(() -> new ResourceNotFoundException("Worker", "id", request.getWorkerId()));
        var saved = readings.save(new LiveSensorReading(
                worker,
                LocalDateTime.now(),
                request.getH2sPpm(),
                request.getMq2Raw(),
                request.getMq2Ppm(),
                request.getTemperatureC(),
                request.getHumidityPercent(),
                request.getBatteryPercent()
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(toDto(saved));
    }

    @GetMapping("/workers/{workerId}")
    public ResponseEntity<List<LiveSensorReadingDto>> getWorkerReadings(
            @PathVariable String workerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        if (currentUserService.isWorker(authentication)
                && !workerId.equals(currentUserService.workerId(authentication))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Workers may only view their own live sensor readings.");
        }
        if (page < 0 || size < 1 || size > MAX_PAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Page must be non-negative and size must be between 1 and " + MAX_PAGE_SIZE + ".");
        }

        List<LiveSensorReadingDto> result = readings
                .findByWorkerIdOrderByTimestampDesc(workerId, PageRequest.of(page, size))
                .map(this::toDto)
                .getContent();
        return ResponseEntity.ok(result);
    }

    private LiveSensorReadingDto toDto(LiveSensorReading reading) {
        return new LiveSensorReadingDto(
                reading.getId(),
                reading.getWorker().getId(),
                reading.getWorker().getSyntheticName(),
                reading.getTimestamp().toString(),
                reading.getH2sPpm(),
                reading.getMq2Raw(),
                reading.getMq2Ppm(),
                reading.getTemperatureC(),
                reading.getHumidityPercent(),
                reading.getBatteryPercent()
        );
    }
}
