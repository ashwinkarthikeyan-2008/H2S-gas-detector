package com.chromaguard.service;

import com.chromaguard.dto.DemoResetResponseDto;
import com.chromaguard.entity.DemoAuditLog;
import com.chromaguard.entity.UserRole;
import com.chromaguard.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class DemoResetService {

    private static final Logger log = LoggerFactory.getLogger(DemoResetService.class);

    private final AlertRepository alertRepository;
    private final ExposureRecordRepository exposureRecordRepository;
    private final WorkerRepository workerRepository;
    private final ShiftRepository shiftRepository;
    private final IndustrialZoneRepository zoneRepository;
    private final DemoAuditLogRepository auditLogRepository;
    private final UserAccountRepository userAccountRepository;

    public DemoResetService(AlertRepository alertRepository,
                            ExposureRecordRepository exposureRecordRepository,
                            WorkerRepository workerRepository,
                            ShiftRepository shiftRepository,
                            IndustrialZoneRepository zoneRepository,
                            DemoAuditLogRepository auditLogRepository,
                            UserAccountRepository userAccountRepository) {
        this.alertRepository = alertRepository;
        this.exposureRecordRepository = exposureRecordRepository;
        this.workerRepository = workerRepository;
        this.shiftRepository = shiftRepository;
        this.zoneRepository = zoneRepository;
        this.auditLogRepository = auditLogRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public DemoResetResponseDto resetDemoState(String triggeredBy) {
        log.warn("Demo reset requested by {}", triggeredBy);

        // Delete existing entities in dependency order
        alertRepository.deleteAllInBatch();
        exposureRecordRepository.deleteAllInBatch();
        workerRepository.deleteAllInBatch();
        userAccountRepository.findAll().stream()
                .filter(account -> account.getRole() == UserRole.ROLE_WORKER)
                .forEach(userAccountRepository::delete);

        long zoneCount = zoneRepository.count();
        long shiftCount = shiftRepository.count();
        long workerCount = workerRepository.count();
        long recordCount = exposureRecordRepository.count();
        long alertCount = alertRepository.count();

        // Record in audit log
        auditLogRepository.save(new DemoAuditLog(
                "DEMO_RESET",
                String.format("Worker data cleared: %d profiles, %d records, %d alerts. Retained %d zone and %d shift choices.",
                        workerCount, recordCount, alertCount, zoneCount, shiftCount),
                triggeredBy != null ? triggeredBy : "admin",
                LocalDateTime.now()
        ));

        log.info("Worker dataset cleared: {} worker profiles, {} records, {} alerts", workerCount, recordCount, alertCount);

        return new DemoResetResponseDto(
                true,
                "Worker profiles, exposure records, alerts, and worker accounts have been cleared. Zone and shift choices remain available for registration.",
                LocalDateTime.now().toString(),
                zoneCount,
                shiftCount,
                workerCount,
                recordCount,
                alertCount
        );
    }
}
