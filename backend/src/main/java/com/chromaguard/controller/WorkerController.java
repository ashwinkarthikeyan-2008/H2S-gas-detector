package com.chromaguard.controller;

import com.chromaguard.dto.ExposureRecordDto;
import com.chromaguard.dto.WorkerDetailDto;
import com.chromaguard.dto.WorkerSummaryDto;
import com.chromaguard.dto.WorkerProfileUpdateRequest;
import com.chromaguard.service.WorkerService;
import com.chromaguard.service.CurrentUserService;
import com.chromaguard.repository.UserAccountRepository;
import com.chromaguard.entity.UserRole;
import com.chromaguard.entity.Worker;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workers")
@CrossOrigin(origins = "*")
public class WorkerController {

    private final WorkerService workerService;
    private final CurrentUserService currentUserService;
    private final UserAccountRepository userAccountRepository;

    public WorkerController(WorkerService workerService, CurrentUserService currentUserService, UserAccountRepository userAccountRepository) {
        this.workerService = workerService;
        this.currentUserService = currentUserService;
        this.userAccountRepository = userAccountRepository;
    }

    @GetMapping
    public ResponseEntity<List<WorkerSummaryDto>> getWorkers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) String shiftId,
            Authentication authentication) {
        if (currentUserService.isWorker(authentication)) {
            String ownWorkerId = currentUserService.workerId(authentication);
            return ResponseEntity.ok(ownWorkerId == null ? List.of() : List.of(workerService.getWorkerSummaryById(ownWorkerId)));
        }
        List<String> registeredWorkerIds = userAccountRepository.findAll().stream()
                .filter(account -> account.getRole() == UserRole.ROLE_WORKER)
                .map(account -> account.getAssociatedWorkerId())
                .filter(id -> id != null && !id.isBlank())
                .toList();
        List<WorkerSummaryDto> registeredWorkers = workerService.getAllWorkers(search, zoneId, shiftId).stream()
                .filter(worker -> registeredWorkerIds.contains(worker.getId()))
                .toList();
        return ResponseEntity.ok(registeredWorkers);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkerSummaryDto> getWorkerById(@PathVariable String id, Authentication authentication) {
        assertOwnWorker(id, authentication);
        return ResponseEntity.ok(workerService.getWorkerSummaryById(id));
    }

    @GetMapping("/{id}/detail")
    public ResponseEntity<WorkerDetailDto> getWorkerDetail(@PathVariable String id, Authentication authentication) {
        assertOwnWorker(id, authentication);
        return ResponseEntity.ok(workerService.getWorkerDetailById(id));
    }

    @PatchMapping("/{id}/profile")
    public ResponseEntity<WorkerSummaryDto> updateWorkerProfile(@PathVariable String id,
            @RequestBody WorkerProfileUpdateRequest request, Authentication authentication) {
        if (!currentUserService.isWorker(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only workers may update their own profile through this endpoint.");
        }
        assertOwnWorker(id, authentication);
        if (request.getSyntheticName() == null || request.getSyntheticName().isBlank()
                || request.getSyntheticName().trim().length() > 128
                || request.getRole() == null || request.getRole().isBlank() || request.getRole().trim().length() > 128
                || request.getExperienceYears() == null || request.getExperienceYears() < 0 || request.getExperienceYears() > 60
                || request.getBadgeId() == null || request.getBadgeId().isBlank() || request.getBadgeId().trim().length() > 64) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid name, role, experience (0–60 years), and badge ID.");
        }
        return ResponseEntity.ok(workerService.updateWorkerProfile(id, request));
    }

    @GetMapping("/{id}/exposure")
    public ResponseEntity<List<ExposureRecordDto>> getWorkerExposure(@PathVariable String id, Authentication authentication) {
        assertOwnWorker(id, authentication);
        return ResponseEntity.ok(workerService.getWorkerExposureRecords(id));
    }

    private void assertOwnWorker(String requestedId, Authentication authentication) {
        if (currentUserService.isWorker(authentication)
                && !requestedId.equals(currentUserService.workerId(authentication))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Workers may only view their own profile.");
        }
    }
}
