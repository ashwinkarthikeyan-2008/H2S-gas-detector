package com.chromaguard;

import com.chromaguard.util.DeterministicDataExportUtil;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Deterministic Dataset Integrity & JSON Export Verification")
class DeterministicDatasetTest {

    private static final String DATASETS_DIR = "src/main/resources/data/datasets/";

    @Test
    @DisplayName("Export CSV datasets to JSON and generate DEV hygiene demonstration fixtures")
    void testExportJsonAndGenerateDevFixtures() throws Exception {
        File dir = new File(DATASETS_DIR);
        assertTrue(dir.exists(), "Datasets directory must exist");

        // Convert 5 primary CSVs to JSON
        DeterministicDataExportUtil.convertCsvToJson(new File(dir, "zones.csv"), new File(dir, "zones.json"));
        DeterministicDataExportUtil.convertCsvToJson(new File(dir, "shifts.csv"), new File(dir, "shifts.json"));
        DeterministicDataExportUtil.convertCsvToJson(new File(dir, "workers.csv"), new File(dir, "workers.json"));
        DeterministicDataExportUtil.convertCsvToJson(new File(dir, "exposure_records.csv"), new File(dir, "exposure_records.json"));
        DeterministicDataExportUtil.convertCsvToJson(new File(dir, "alerts.csv"), new File(dir, "alerts.json"));

        assertTrue(new File(dir, "zones.json").exists());
        assertTrue(new File(dir, "shifts.json").exists());
        assertTrue(new File(dir, "workers.json").exists());
        assertTrue(new File(dir, "exposure_records.json").exists());
        assertTrue(new File(dir, "alerts.json").exists());

        // Generate DEV Hygiene Demo Fixture 1: Missing values (intentional nulls)
        File missingFile = new File(dir, "dev_missing_values_sample.csv");
        try (FileWriter writer = new FileWriter(missingFile, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(
                     "record_id", "worker_id", "zone_id", "timestamp", "simulated_color_r",
                     "illustrative_exposure_value", "data_source", "defect_type"
             ).build())) {
            printer.printRecord("DEV-MISS-01", "W-101", "ZONE-01", "2026-09-01T06:00:00", "", "2.18", "SIMULATED_DEMO_DEFECT", "MISSING_RGB_R");
            printer.printRecord("DEV-MISS-02", "W-102", "ZONE-02", "2026-09-01T14:00:00", "207", "", "SIMULATED_DEMO_DEFECT", "MISSING_EXPOSURE_VAL");
            printer.printRecord("DEV-MISS-03", "", "ZONE-03", "2026-09-01T22:00:00", "176", "10.05", "SIMULATED_DEMO_DEFECT", "MISSING_WORKER_FK");
        }
        assertTrue(missingFile.exists());

        // Generate DEV Hygiene Demo Fixture 2: Duplicate records (intentional key collisions)
        File duplicateFile = new File(dir, "dev_duplicate_records_sample.csv");
        try (FileWriter writer = new FileWriter(duplicateFile, StandardCharsets.UTF_8);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT.builder().setHeader(
                     "record_id", "worker_id", "timestamp", "illustrative_exposure_value", "is_duplicate"
             ).build())) {
            printer.printRecord("EXP-00001", "W-101", "2026-09-01T06:00:00.000+00:00", "2.18", "ORIGINAL");
            printer.printRecord("EXP-00001", "W-101", "2026-09-01T06:00:00.000+00:00", "2.18", "DUPLICATE_ENTRY");
            printer.printRecord("EXP-00002", "W-102", "2026-09-01T14:00:00.000+00:00", "6.31", "ORIGINAL");
            printer.printRecord("EXP-00002-CLONE", "W-102", "2026-09-01T14:00:00.000+00:00", "6.31", "COMPOSITE_COLLISION");
        }
        assertTrue(duplicateFile.exists());
    }

    @Test
    @DisplayName("Verify referential integrity across all deterministic entities")
    void testVerifyReferentialIntegrity() throws Exception {
        Set<String> zoneIds = new HashSet<>();
        try (Reader reader = new FileReader(DATASETS_DIR + "zones.csv", StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            for (CSVRecord record : parser) {
                zoneIds.add(record.get("zone_id").trim());
            }
        }
        assertEquals(5, zoneIds.size(), "Should have exactly 5 industrial zones");

        Set<String> shiftIds = new HashSet<>();
        try (Reader reader = new FileReader(DATASETS_DIR + "shifts.csv", StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            for (CSVRecord record : parser) {
                shiftIds.add(record.get("shift_id").trim());
            }
        }
        assertEquals(3, shiftIds.size(), "Should have exactly 3 operational shifts");

        Set<String> workerIds = new HashSet<>();
        try (Reader reader = new FileReader(DATASETS_DIR + "workers.csv", StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            for (CSVRecord record : parser) {
                String workerId = record.get("worker_id").trim();
                String assignedZone = record.get("assigned_zone_id").trim();
                String prefShift = record.get("preferred_shift_id").trim();

                workerIds.add(workerId);
                assertTrue(zoneIds.contains(assignedZone), "Worker zone must exist: " + assignedZone);
                assertTrue(shiftIds.contains(prefShift), "Worker shift must exist: " + prefShift);
            }
        }
        assertEquals(40, workerIds.size(), "Should have exactly 40 fictional workers");

        Set<String> recordIds = new HashSet<>();
        try (Reader reader = new FileReader(DATASETS_DIR + "exposure_records.csv", StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            for (CSVRecord record : parser) {
                String recordId = record.get("record_id").trim();
                String workerId = record.get("worker_id").trim();
                String zoneId = record.get("zone_id").trim();
                String shiftId = record.get("shift_id").trim();
                double exposure = Double.parseDouble(record.get("illustrative_exposure_value").trim());
                double dose = Double.parseDouble(record.get("illustrative_cumulative_dose").trim());
                int r = Integer.parseInt(record.get("simulated_color_r").trim());
                int g = Integer.parseInt(record.get("simulated_color_g").trim());
                int b = Integer.parseInt(record.get("simulated_color_b").trim());

                recordIds.add(recordId);
                assertTrue(workerIds.contains(workerId), "Record worker must exist: " + workerId);
                assertTrue(zoneIds.contains(zoneId), "Record zone must exist: " + zoneId);
                assertTrue(shiftIds.contains(shiftId), "Record shift must exist: " + shiftId);
                assertTrue(exposure >= 0, "Exposure must be non-negative");
                assertTrue(dose >= 0, "Dose must be non-negative");
                assertTrue(r >= 0 && r <= 255, "Color R must be 0-255");
                assertTrue(g >= 0 && g <= 255, "Color G must be 0-255");
                assertTrue(b >= 0 && b <= 255, "Color B must be 0-255");
            }
        }
        assertEquals(718, recordIds.size(), "Should have exactly 718 unique exposure records");

        try (Reader reader = new FileReader(DATASETS_DIR + "alerts.csv", StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            int alertCount = 0;
            for (CSVRecord record : parser) {
                String recordId = record.get("record_id").trim();
                String workerId = record.get("worker_id").trim();
                String zoneId = record.get("zone_id").trim();

                assertTrue(recordIds.contains(recordId), "Alert record must exist: " + recordId);
                assertTrue(workerIds.contains(workerId), "Alert worker must exist: " + workerId);
                assertTrue(zoneIds.contains(zoneId), "Alert zone must exist: " + zoneId);
                alertCount++;
            }
            assertEquals(40, alertCount, "Should have exactly 40 simulated alerts");
        }
    }
}
