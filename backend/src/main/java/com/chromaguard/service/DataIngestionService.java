package com.chromaguard.service;

import com.chromaguard.entity.*;
import com.chromaguard.repository.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class DataIngestionService {

    private static final Logger log = LoggerFactory.getLogger(DataIngestionService.class);

    private final IndustrialZoneRepository zoneRepository;
    private final ShiftRepository shiftRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${chromaguard.demo.datasets.zones-path:data/datasets/zones.csv}")
    private String zonesPath;

    @Value("${chromaguard.demo.datasets.shifts-path:data/datasets/shifts.csv}")
    private String shiftsPath;

    public DataIngestionService(IndustrialZoneRepository zoneRepository,
                                ShiftRepository shiftRepository,
                                UserAccountRepository userAccountRepository,
                                PasswordEncoder passwordEncoder) {
        this.zoneRepository = zoneRepository;
        this.shiftRepository = shiftRepository;
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onApplicationReady() {
        // Keep only the lookup catalogs required by worker registration. Demo workers,
        // exposure records, and alerts must come from actual registered worker activity.
        if (zoneRepository.count() == 0) ingestZones();
        if (shiftRepository.count() == 0) ingestShifts();
        seedDefaultAdminAccount();
        log.info("Reference zones/shifts ready. Synthetic worker and exposure datasets are not loaded.");
    }

    private Map<String, IndustrialZone> ingestZones() {
        Map<String, IndustrialZone> map = new HashMap<>();
        try (Reader reader = new InputStreamReader(new ClassPathResource(zonesPath).getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            for (CSVRecord record : parser) {
                String id = record.get("zone_id").trim();
                String code = record.get("zone_code").trim();
                String name = record.get("zone_name").trim();
                RiskTier riskTier = RiskTier.valueOf(record.get("risk_tier").trim());
                Double baseline = Double.valueOf(record.get("baseline_exposure_ppm_hr").trim());
                String desc = record.get("description").trim();

                IndustrialZone zone = new IndustrialZone(id, code, name, riskTier, baseline, desc);
                zoneRepository.save(zone);
                map.put(id, zone);
            }
            log.info("Ingested {} industrial zones", map.size());
        } catch (Exception e) {
            log.error("Failed to ingest zones: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to ingest zones: " + e.getMessage(), e);
        }
        return map;
    }

    private Map<String, Shift> ingestShifts() {
        Map<String, Shift> map = new HashMap<>();
        try (Reader reader = new InputStreamReader(new ClassPathResource(shiftsPath).getInputStream(), StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            for (CSVRecord record : parser) {
                String id = record.get("shift_id").trim();
                String name = record.get("shift_name").trim();
                String start = record.get("start_time").trim();
                String end = record.get("end_time").trim();
                Integer duration = Integer.valueOf(record.get("duration_hours").trim());

                Shift shift = new Shift(id, name, start, end, duration);
                shiftRepository.save(shift);
                map.put(id, shift);
            }
            log.info("Ingested {} shifts", map.size());
        } catch (Exception e) {
            log.error("Failed to ingest shifts: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to ingest shifts: " + e.getMessage(), e);
        }
        return map;
    }

    private void seedDefaultAdminAccount() {
        if (!userAccountRepository.existsByUsername("admin")) {
            userAccountRepository.save(new UserAccount(
                    "admin",
                    passwordEncoder.encode("admin123"),
                    UserRole.ROLE_ADMIN,
                    "Lead Plant Safety Director",
                    null
            ));
        }
        log.info("Ensured default admin account exists; worker accounts are created through registration");
    }

}
