package com.chromaguard;

import com.chromaguard.domain.Auditable;
import com.chromaguard.domain.ExposureReport;
import com.chromaguard.domain.Identifiable;
import com.chromaguard.domain.ZoneExposureSummary;
import com.chromaguard.domain.ExposureRecordComparators;
import com.chromaguard.domain.report.AbstractReportFormatter;
import com.chromaguard.domain.report.CsvReportFormatter;
import com.chromaguard.domain.report.JsonReportFormatter;
import com.chromaguard.domain.report.ReportFormatter;
import com.chromaguard.dto.ExposureReportDto;
import com.chromaguard.entity.*;
import com.chromaguard.exception.ChromaGuardDomainException;
import com.chromaguard.exception.InvalidExposureDataException;
import com.chromaguard.exception.ThresholdExceededException;
import com.chromaguard.util.CollectionAnalyticsUtil;
import com.chromaguard.util.TemporalAnalyticsUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;


@DisplayName("Domain Model & OOP Architecture Unit Tests")
class DomainModelOopTest {

    @Test
    @DisplayName("1. Encapsulation: ExposureReport defensive copying prevents outside collection mutation")
    void testEncapsulationAndDefensiveCopying() {
        List<ZoneExposureSummary> summaries = new ArrayList<>();
        summaries.add(new ZoneExposureSummary("Z-01", "Cat Cracker", 100, 3.2, 7.5, 3.2, 2));

        ExposureReport report = new ExposureReport(
                "REP-001",
                "Quarterly Review",
                LocalDateTime.now(),
                LocalDateTime.now().minusDays(20),
                LocalDateTime.now(),
                100,
                92,
                6,
                2,
                4.5,
                18.2,
                summaries,
                List.of()
        );

        // Mutating original caller list must NOT affect internal report state
        summaries.add(new ZoneExposureSummary("Z-02", "Acid Gas", 50, 6.0, 12.0, 7.8, 5));
        assertEquals(1, report.getZoneSummaries().size(), "Report list must be decoupled from caller collection");

        // Attempting to mutate getter collection must throw UnsupportedOperationException
        assertThrows(UnsupportedOperationException.class, () ->
                report.getZoneSummaries().add(new ZoneExposureSummary("Z-03", "Tank Farm", 20, 2.0, 5.0, 8.5, 0))
        );
    }

    @Test
    @DisplayName("2. Constructors & Validation: ExposureRecord throws InvalidExposureDataException for invalid inputs")
    void testConstructorValidationAndDomainExceptions() {
        IndustrialZone zone = new IndustrialZone("ZONE-01", "CCU", "Cat Cracker", RiskTier.MEDIUM, 3.2, "Test unit");
        Shift shift = new Shift("SHIFT-M", "Morning", "06:00:00", "14:00:00", 8);
        Worker worker = new Worker("W-101", "John Doe", zone, shift, "Technician", 5, "CG-BDG-100");

        // Negative exposure value rejected
        InvalidExposureDataException expEx = assertThrows(InvalidExposureDataException.class, () ->
                new ExposureRecord("EXP-999", worker, zone, shift, LocalDateTime.now(),
                        200, 200, 200, -1.5, 10.0, DemoStatus.NORMAL, "SIMULATED", "V1")
        );
        assertEquals("illustrativeExposureValue", expEx.getFieldName());

        // Out-of-bounds RGB channel (> 255) rejected
        InvalidExposureDataException rgbEx = assertThrows(InvalidExposureDataException.class, () ->
                new ExposureRecord("EXP-998", worker, zone, shift, LocalDateTime.now(),
                        300, 200, 200, 5.0, 10.0, DemoStatus.NORMAL, "SIMULATED", "V1")
        );
        assertEquals("simulatedColorR", rgbEx.getFieldName());

        // Valid values succeed
        assertDoesNotThrow(() ->
                new ExposureRecord("EXP-997", worker, zone, shift, LocalDateTime.now(),
                        220, 210, 195, 4.2, 12.0, DemoStatus.NORMAL, "SIMULATED", "V1")
        );
    }

    @Test
    @DisplayName("3. Rich Enums: DemoStatus, RiskTier, and UserRole business logic methods")
    void testRichEnums() {
        // DemoStatus tests
        assertEquals(DemoStatus.CRITICAL, DemoStatus.fromExposureValue(22.5, 15.0, 20.0, 8.0));
        assertEquals(DemoStatus.WARNING, DemoStatus.fromExposureValue(17.5, 15.0, 20.0, 8.0));
        assertEquals(DemoStatus.ELEVATED, DemoStatus.fromExposureValue(10.0, 15.0, 20.0, 8.0));
        assertEquals(DemoStatus.NORMAL, DemoStatus.fromExposureValue(3.5, 15.0, 20.0, 8.0));

        assertTrue(DemoStatus.CRITICAL.isIncidentLevel());
        assertTrue(DemoStatus.WARNING.isIncidentLevel());
        assertFalse(DemoStatus.NORMAL.isIncidentLevel());
        assertEquals(4, DemoStatus.CRITICAL.getSeverityRank());

        // RiskTier tests
        assertTrue(RiskTier.CRITICAL.isHighOrCritical());
        assertTrue(RiskTier.HIGH.isHighOrCritical());
        assertFalse(RiskTier.LOW.isHighOrCritical());
        assertEquals(4.0, RiskTier.CRITICAL.getRiskMultiplier());

        // UserRole RBAC tests
        assertTrue(UserRole.ROLE_ADMIN.canAcknowledgeAlerts());
        assertTrue(UserRole.ROLE_ADMIN.canResetSystem());
        assertFalse(UserRole.ROLE_WORKER.canAcknowledgeAlerts());
        assertFalse(UserRole.ROLE_AUDITOR.canResetSystem());
    }

    @Test
    @DisplayName("4. Generic Interfaces: Identifiable<ID> and Auditable contract compliance")
    void testInterfacesAndGenerics() {
        IndustrialZone zone = new IndustrialZone("ZONE-01", "CCU", "Cracking Unit", RiskTier.LOW, 1.8, "Desc");
        Shift shift = new Shift("SHIFT-A", "Afternoon", "14:00:00", "22:00:00", 8);
        Worker worker = new Worker("W-102", "Jane Smith", zone, shift, "Inspector", 8, "CG-BDG-101");
        LocalDateTime eventTime = LocalDateTime.of(2026, 9, 15, 14, 30);

        ExposureRecord record = new ExposureRecord("EXP-100", worker, zone, shift, eventTime,
                180, 170, 160, 8.5, 34.0, DemoStatus.ELEVATED, "SIMULATED_TEST", "V1");

        // Verify Identifiable<String>
        Identifiable<String> identifiableRecord = record;
        assertEquals("EXP-100", identifiableRecord.getId());

        Identifiable<String> identifiableWorker = worker;
        assertEquals("W-102", identifiableWorker.getId());

        // Verify Auditable
        Auditable auditableRecord = record;
        assertEquals(eventTime, auditableRecord.getTimestamp());
        assertEquals("SIMULATED_TEST", auditableRecord.getDataSource());
    }

    @Test
    @DisplayName("5. Composition: Worker and Alert aggregate relationships")
    void testComposition() {
        IndustrialZone zone = new IndustrialZone("ZONE-04", "DT", "Desulf Trench", RiskTier.CRITICAL, 11.4, "Culvert");
        Shift shift = new Shift("SHIFT-N", "Night", "22:00:00", "06:00:00", 8);
        Worker worker = new Worker("W-103", "Marcus Vance", zone, shift, "Lead Tech", 12, "CG-BDG-102");

        // Worker is composed of Zone and Shift
        assertEquals("ZONE-04", worker.getAssignedZone().getId());
        assertEquals("SHIFT-N", worker.getPreferredShift().getId());

        LocalDateTime now = LocalDateTime.now();
        ExposureRecord exp = new ExposureRecord("EXP-050", worker, zone, shift, now,
                120, 110, 95, 18.5, 65.0, DemoStatus.WARNING, "SIM", "V1");

        Alert alert = new Alert("ALT-001", exp, worker, zone, now,
                DemoStatus.WARNING, 18.5, 15.0, false, null, null, null);

        // Alert is composed of ExposureRecord, Worker, and Zone
        assertEquals("EXP-050", alert.getExposureRecord().getId());
        assertEquals("W-103", alert.getWorker().getId());
        assertEquals("ZONE-04", alert.getZone().getId());
    }

    @Test
    @DisplayName("6. Polymorphism: Strategy pattern formatting ExposureReport via JSON and CSV formatters")
    void testPolymorphicReportFormatting() {
        List<ZoneExposureSummary> summaries = List.of(
                new ZoneExposureSummary("ZONE-01", "Catalyst Cracking", 50, 3.2, 7.8, 3.2, 1),
                new ZoneExposureSummary("ZONE-04", "Desulf Trench", 40, 12.1, 22.4, 11.4, 6)
        );

        ExposureReport report = new ExposureReport(
                "REP-TEST",
                "Academic Demonstration Safety Audit",
                LocalDateTime.of(2026, 9, 20, 12, 0),
                LocalDateTime.of(2026, 9, 1, 6, 0),
                LocalDateTime.of(2026, 9, 20, 22, 0),
                90,
                83,
                5,
                2,
                7.6,
                22.4,
                summaries,
                List.of()
        );

        // Test JSON Formatter strategy
        ReportFormatter jsonFormatter = new JsonReportFormatter();
        assertEquals("application/json", jsonFormatter.getContentType());
        String jsonOutput = jsonFormatter.format(report);
        assertTrue(jsonOutput.contains("\"reportId\" : \"REP-TEST\""));
        assertTrue(jsonOutput.contains("\"complianceRatePercent\" : 92.2"));
        assertTrue(jsonOutput.contains("Catalyst Cracking"));

        // Test CSV Formatter strategy
        ReportFormatter csvFormatter = new CsvReportFormatter();
        assertEquals("text/csv", csvFormatter.getContentType());
        String csvOutput = csvFormatter.format(report);
        assertTrue(csvOutput.contains("# ChromaGuard Industrial Exposure Executive Summary Report"));
        assertTrue(csvOutput.contains("ZONE-01,\"Catalyst Cracking\",50,3.20,7.80,3.20,1,true"));
        assertTrue(csvOutput.contains("ZONE-04,\"Desulf Trench\",40,12.10,22.40,11.40,6,false"));
    }

    @Test
    @DisplayName("7. DTO vs Domain Entity: ExposureReportDto maps cleanly from ExposureReport domain model")
    void testDtoSeparation() {
        ExposureReport domainReport = new ExposureReport(
                "REP-DTO-1",
                "Executive Briefing",
                LocalDateTime.of(2026, 9, 20, 18, 0),
                null,
                null,
                100,
                95,
                4,
                1,
                5.2,
                21.0,
                List.of(),
                List.of()
        );

        ExposureReportDto dto = ExposureReportDto.fromDomain(domainReport);
        assertEquals("REP-DTO-1", dto.reportId());
        assertEquals("Executive Briefing", dto.reportTitle());
        assertEquals(95.0, dto.complianceRate());
        assertEquals(100, dto.totalRecords());
        assertEquals(5.2, dto.meanExposurePpmHr());
    }

    @Test
    @DisplayName("8. Custom Domain Exception: ThresholdExceededException encapsulates safety context")
    void testThresholdExceededException() {
        LocalDateTime timestamp = LocalDateTime.of(2026, 9, 5, 14, 0);
        ThresholdExceededException ex = new ThresholdExceededException("W-104", "ZONE-04", 23.51, 20.0, timestamp);

        assertEquals("W-104", ex.getWorkerId());
        assertEquals("ZONE-04", ex.getZoneId());
        assertEquals(23.51, ex.getObservedExposure());
        assertEquals(20.0, ex.getThresholdLimit());
        assertEquals(timestamp, ex.getEventTime());
        assertTrue(ex.getMessage().contains("observed 23.51 ppm·hr"));
    }

    @Test
    @DisplayName("9. Comparable<T>: ExposureRecord natural ordering compares chronologically by timestamp")
    void testComparableNaturalOrdering() {
        IndustrialZone zone = new IndustrialZone("ZONE-01", "CCU", "Cat Cracker", RiskTier.LOW, 3.0, "Unit");
        Shift shift = new Shift("SHIFT-M", "Morning", "06:00:00", "14:00:00", 8);
        Worker worker = new Worker("W-101", "Marcus Vance", zone, shift, "Operator", 4, "B-101");

        LocalDateTime t1 = LocalDateTime.of(2026, 9, 1, 6, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 9, 1, 14, 0);
        LocalDateTime t3 = LocalDateTime.of(2026, 9, 2, 6, 0);

        ExposureRecord r1 = new ExposureRecord("EXP-01", worker, zone, shift, t1, 200, 200, 200, 3.5, 10.0, DemoStatus.NORMAL, "SIM", "V1");
        ExposureRecord r2 = new ExposureRecord("EXP-02", worker, zone, shift, t2, 180, 180, 180, 7.2, 17.2, DemoStatus.NORMAL, "SIM", "V1");
        ExposureRecord r3 = new ExposureRecord("EXP-03", worker, zone, shift, t3, 140, 140, 140, 12.0, 29.2, DemoStatus.WARNING, "SIM", "V1");

        List<ExposureRecord> list = new ArrayList<>(List.of(r3, r1, r2));
        Collections.sort(list); // Uses Comparable<ExposureRecord> natural ordering

        assertEquals("EXP-01", list.get(0).getId(), "Earliest timestamp must be first");
        assertEquals("EXP-02", list.get(1).getId());
        assertEquals("EXP-03", list.get(2).getId(), "Latest timestamp must be last");
        assertTrue(r1.compareTo(r2) < 0);
        assertTrue(r3.compareTo(r2) > 0);
    }

    @Test
    @DisplayName("10. Comparator<T>: ExposureRecordComparators multi-criteria and reverse sorting strategies")
    void testExposureRecordComparators() {
        IndustrialZone zone1 = new IndustrialZone("ZONE-01", "CCU", "Cat Cracker", RiskTier.LOW, 3.0, "Unit");
        IndustrialZone zone2 = new IndustrialZone("ZONE-04", "DT", "Desulf Trench", RiskTier.CRITICAL, 11.4, "Unit");
        Shift shift = new Shift("SHIFT-M", "Morning", "06:00:00", "14:00:00", 8);
        Worker wA = new Worker("W-101", "Alice Vance", zone1, shift, "Operator", 6, "B-101");
        Worker wZ = new Worker("W-102", "Zachary Stone", zone2, shift, "Technician", 2, "B-102");

        ExposureRecord rLow = new ExposureRecord("EXP-LOW", wA, zone1, shift, LocalDateTime.of(2026, 9, 1, 6, 0),
                220, 220, 220, 2.1, 5.0, DemoStatus.NORMAL, "SIM", "V1");
        ExposureRecord rHigh = new ExposureRecord("EXP-HIGH", wZ, zone2, shift, LocalDateTime.of(2026, 9, 1, 8, 0),
                90, 80, 70, 21.4, 45.0, DemoStatus.CRITICAL, "SIM", "V1");
        ExposureRecord rMed = new ExposureRecord("EXP-MED", wA, zone1, shift, LocalDateTime.of(2026, 9, 2, 6, 0),
                160, 160, 160, 9.8, 14.8, DemoStatus.ELEVATED, "SIM", "V1");

        List<ExposureRecord> records = new ArrayList<>(List.of(rLow, rHigh, rMed));

        // 1. Sort by exposure descending
        records.sort(ExposureRecordComparators.BY_EXPOSURE_DESC);
        assertEquals("EXP-HIGH", records.get(0).getId());
        assertEquals("EXP-MED", records.get(1).getId());
        assertEquals("EXP-LOW", records.get(2).getId());

        // 2. Sort by worker name then timestamp
        records.sort(ExposureRecordComparators.BY_WORKER_THEN_TIMESTAMP);
        assertEquals("EXP-LOW", records.get(0).getId(), "Alice at 09-01");
        assertEquals("EXP-MED", records.get(1).getId(), "Alice at 09-02");
        assertEquals("EXP-HIGH", records.get(2).getId(), "Zachary");
    }

    @Test
    @DisplayName("11. Rich Enums: ShiftType domain rules, nocturnal multipliers, and reverse lookup")
    void testRichShiftTypeEnum() {
        assertEquals(ShiftType.MORNING, ShiftType.fromShiftName("Morning Shift"));
        assertEquals(ShiftType.AFTERNOON, ShiftType.fromShiftName("Evening / Afternoon"));
        assertEquals(ShiftType.NIGHT, ShiftType.fromShiftName("Night Crew"));
        assertEquals(ShiftType.MORNING, ShiftType.fromShiftName("Unknown")); // Fallback

        assertTrue(ShiftType.NIGHT.isNightShift());
        assertFalse(ShiftType.MORNING.isNightShift());
        assertEquals(1.25, ShiftType.NIGHT.getFatigueRiskMultiplier(), 0.001);

        Shift entity = new Shift("S-NIGHT", "Night Operational", "22:00:00", "06:00:00", 8);
        assertEquals(ShiftType.NIGHT, entity.getShiftType());
        assertTrue(entity.isNightShift());
    }

    @Test
    @DisplayName("12. Generics & Streams: CollectionAnalyticsUtil reusable generic statistics and pagination")
    void testCollectionAnalyticsUtilGenericsAndStreams() {
        List<Double> values = List.of(2.0, 4.0, 6.0, 8.0, 10.0);

        // Bounded type parameter calculateMean
        assertEquals(6.0, CollectionAnalyticsUtil.calculateMean(values), 0.001);
        assertEquals(0.0, CollectionAnalyticsUtil.calculateMean(List.of()));

        // Generic pagination
        List<String> items = List.of("A", "B", "C", "D", "E", "F", "G");
        List<String> page1 = CollectionAnalyticsUtil.paginate(items, 1, 3);
        List<String> page2 = CollectionAnalyticsUtil.paginate(items, 2, 3);
        List<String> page3 = CollectionAnalyticsUtil.paginate(items, 3, 3);
        List<String> page4 = CollectionAnalyticsUtil.paginate(items, 4, 3);

        assertEquals(List.of("A", "B", "C"), page1);
        assertEquals(List.of("D", "E", "F"), page2);
        assertEquals(List.of("G"), page3);
        assertTrue(page4.isEmpty());

        // Generic duplicate finder
        List<String> duplicatesInput = List.of("ID-1", "ID-2", "ID-1", "ID-3", "ID-2");
        Set<String> dupes = CollectionAnalyticsUtil.findDuplicates(duplicatesInput);
        assertEquals(Set.of("ID-1", "ID-2"), dupes);

        // Generic sliding window moving average
        List<Double> movingAvg = CollectionAnalyticsUtil.calculateMovingAverage(List.of(2.0, 4.0, 6.0, 8.0), v -> v, 2);
        assertEquals(4, movingAvg.size());
        assertEquals(2.0, movingAvg.get(0)); // 2/1
        assertEquals(3.0, movingAvg.get(1)); // (2+4)/2
        assertEquals(5.0, movingAvg.get(2)); // (4+6)/2
        assertEquals(7.0, movingAvg.get(3)); // (6+8)/2
    }

    @Test
    @DisplayName("13. Domain Encapsulation: Business rules inside IndustrialZone, Worker, and ExposureRecord")
    void testDomainEncapsulationMethods() {
        IndustrialZone zone = new IndustrialZone("ZONE-04", "DT", "Desulf Trench", RiskTier.CRITICAL, 10.0, "Desc");
        assertTrue(zone.isExceedingBaseline(12.5));
        assertFalse(zone.isExceedingBaseline(8.0));
        assertEquals(25.0, zone.calculateExcessPercentage(12.5), 0.01);
        assertTrue(zone.isHighOrCritical());

        Shift shift = new Shift("SHIFT-M", "Morning", "06:00:00", "14:00:00", 8);
        Worker worker = new Worker("W-101", "Marcus Vance", zone, shift, "Operator", 6, "B-101");
        assertTrue(worker.isSeniorPersonnel(), "6 years tenure is senior personnel (>= 5)");
        assertTrue(worker.isStationedIn("ZONE-04"));
        assertFalse(worker.isStationedIn("ZONE-01"));

        ExposureRecord record = new ExposureRecord("EXP-1", worker, zone, shift, LocalDateTime.now(),
                100, 100, 100, 16.5, 40.0, DemoStatus.CRITICAL, "SIM", "V1");
        assertTrue(record.isExceedingThreshold(15.0));
        assertFalse(record.isExceedingThreshold(20.0));
        assertEquals(155, record.getPhotometricDarknessIndex(), "255 - 100 = 155 optical darkness");
    }

    @Test
    @DisplayName("14. Template Method Pattern: AbstractReportFormatter enforces invariant validation before rendering")
    void testTemplateMethodReportFormatting() {
        AbstractReportFormatter csvFormatter = new CsvReportFormatter();
        AbstractReportFormatter jsonFormatter = new JsonReportFormatter();

        // Template method enforces non-null report
        assertThrows(NullPointerException.class, () -> csvFormatter.format(null));
        assertThrows(NullPointerException.class, () -> jsonFormatter.format(null));

        // Template method enforces reportId presence
        ExposureReport invalidReport = new ExposureReport(
                "",
                "Title",
                LocalDateTime.now(),
                null, null, 10, 10, 0, 0, 5.0, 10.0, List.of(), List.of()
        );
        assertThrows(IllegalArgumentException.class, () -> csvFormatter.format(invalidReport));
    }

    @Test
    @DisplayName("15. Domain Encapsulation: Alert acknowledge, exceedance margin, and status queries")
    void testAlertDomainEncapsulation() {
        IndustrialZone zone = new IndustrialZone("ZONE-04", "DT", "Desulf Trench", RiskTier.CRITICAL, 10.0, "Desc");
        Shift shift = new Shift("SHIFT-M", "Morning", "06:00:00", "14:00:00", 8);
        Worker worker = new Worker("W-101", "Marcus Vance", zone, shift, "Operator", 6, "B-101");

        Alert alert = new Alert("ALT-001", worker, zone, LocalDateTime.now(), DemoStatus.CRITICAL, 22.5, 15.0);
        assertTrue(alert.isUnacknowledged());
        assertTrue(alert.isCriticalAlert());
        assertEquals(7.5, alert.getExceedanceMargin(), 0.001);

        // Acknowledge domain operation
        LocalDateTime ackTime = LocalDateTime.now();
        alert.acknowledge("Safety Officer J. Doe", ackTime);
        assertFalse(alert.isUnacknowledged());
        assertTrue(alert.isAcknowledged());
        assertEquals("Safety Officer J. Doe", alert.getAcknowledgedBy());
        assertEquals(ackTime, alert.getAcknowledgedAt());
    }

    @Test
    @DisplayName("16. Exception Hierarchy: ChromaGuardDomainException base type polymorphism")
    void testExceptionHierarchyPolymorphism() {
        LocalDateTime now = LocalDateTime.now();
        ThresholdExceededException thresholdEx = new ThresholdExceededException("W-101", "ZONE-04", 24.5, 15.0, now);
        InvalidExposureDataException invalidEx = new InvalidExposureDataException("simulatedColorR", 300, "Must be between 0 and 255");

        // Verify polymorphism via instanceof
        assertTrue(thresholdEx instanceof ChromaGuardDomainException);
        assertTrue(thresholdEx instanceof RuntimeException);
        assertTrue(invalidEx instanceof ChromaGuardDomainException);
        assertTrue(invalidEx instanceof RuntimeException);

        // Verify base exception metadata
        ChromaGuardDomainException domainEx1 = thresholdEx;
        ChromaGuardDomainException domainEx2 = invalidEx;
        assertEquals("ERR_THRESHOLD_EXCEEDED", domainEx1.getErrorCode());
        assertEquals("ERR_INVALID_EXPOSURE_DATA", domainEx2.getErrorCode());
        assertNotNull(domainEx1.getTimestamp());
        assertNotNull(domainEx2.getTimestamp());
    }

    @Test
    @DisplayName("17. Modern java.time API: TemporalAnalyticsUtil duration, date buckets, and shift window calculations")
    void testTemporalAnalyticsUtil() {
        LocalDateTime t1 = LocalDateTime.of(2026, 9, 1, 8, 0, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 9, 1, 14, 30, 0);

        // Duration calculation in hours
        double hours = TemporalAnalyticsUtil.calculateHoursBetween(t1, t2);
        assertEquals(6.5, hours, 0.001);

        // Calendar date bucketing with Streams
        LocalDate d1 = LocalDate.of(2026, 9, 1);
        LocalDate d2 = LocalDate.of(2026, 9, 5);
        List<LocalDate> buckets = TemporalAnalyticsUtil.generateDailyDateBuckets(d1, d2);
        assertEquals(5, buckets.size());
        assertEquals(LocalDate.of(2026, 9, 1), buckets.get(0));
        assertEquals(LocalDate.of(2026, 9, 5), buckets.get(4));

        // Daytime shift window check (06:00 to 14:00)
        LocalTime morningStart = LocalTime.of(6, 0);
        LocalTime morningEnd = LocalTime.of(14, 0);
        assertTrue(TemporalAnalyticsUtil.isWithinShiftWindow(LocalDateTime.of(2026, 9, 1, 8, 30), morningStart, morningEnd));
        assertFalse(TemporalAnalyticsUtil.isWithinShiftWindow(LocalDateTime.of(2026, 9, 1, 15, 0), morningStart, morningEnd));

        // Overnight shift window check (22:00 to 06:00)
        LocalTime nightStart = LocalTime.of(22, 0);
        LocalTime nightEnd = LocalTime.of(6, 0);
        assertTrue(TemporalAnalyticsUtil.isWithinShiftWindow(LocalDateTime.of(2026, 9, 1, 23, 15), nightStart, nightEnd));
        assertTrue(TemporalAnalyticsUtil.isWithinShiftWindow(LocalDateTime.of(2026, 9, 2, 2, 45), nightStart, nightEnd));
        assertFalse(TemporalAnalyticsUtil.isWithinShiftWindow(LocalDateTime.of(2026, 9, 1, 14, 0), nightStart, nightEnd));

        // Hour truncation
        LocalDateTime preciseTime = LocalDateTime.of(2026, 9, 1, 10, 42, 19, 500);
        LocalDateTime truncated = TemporalAnalyticsUtil.truncateToHour(preciseTime);
        assertEquals(LocalDateTime.of(2026, 9, 1, 10, 0, 0, 0), truncated);
    }
}

