package com.chromaguard;

import com.chromaguard.dto.*;
import com.chromaguard.entity.*;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.service.AnalyticsService;
import com.chromaguard.service.ActiveDatasetService;
import com.chromaguard.service.ExposureCalculationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Analytics Service Statistical Unit Tests & Edge Cases")
class AnalyticsServiceTest {

    private AnalyticsService analyticsService;
    private ExposureRecordRepository exposureRecordRepository;
    private ExposureCalculationService calculationService;
    private ActiveDatasetService activeDatasetService;

    // Hand-calculated fixture entities
    private IndustrialZone zone1;
    private IndustrialZone zone2;
    private Shift shiftMorning;
    private Shift shiftAfternoon;
    private Worker worker1;
    private Worker worker2;

    @BeforeEach
    void setUp() {
        exposureRecordRepository = Mockito.mock(ExposureRecordRepository.class);
        calculationService = new ExposureCalculationService(8.0, 15.0, 20.0);
        activeDatasetService = Mockito.mock(ActiveDatasetService.class);
        analyticsService = new AnalyticsService(exposureRecordRepository, calculationService, activeDatasetService);

        zone1 = new IndustrialZone("ZONE-01", "CCU", "Catalyst Cracking Unit", RiskTier.MEDIUM, 3.2, "Moderate");
        zone2 = new IndustrialZone("ZONE-02", "AGR", "Acid Gas Recovery", RiskTier.CRITICAL, 11.4, "High");

        shiftMorning = new Shift("SHIFT-M", "Morning Shift", "06:00:00", "14:00:00", 8);
        shiftAfternoon = new Shift("SHIFT-A", "Afternoon Shift", "14:00:00", "22:00:00", 8);

        worker1 = new Worker("W-101", "Marcus Vance", zone1, shiftMorning, "Tech", 10, "CG-BDG-01");
        worker2 = new Worker("W-102", "Elena Reyes", zone2, shiftAfternoon, "Specialist", 8, "CG-BDG-02");
    }

    private List<ExposureRecord> createHandCalculatedFixture() {
        // Hand-calculated dataset: 4 records
        // Record 1: W1, Z1, ShiftM, 2026-09-01T06:00, Value = 4.0  (NORMAL)
        // Record 2: W1, Z1, ShiftM, 2026-09-01T10:00, Value = 6.0  (NORMAL)
        // Record 3: W2, Z2, ShiftA, 2026-09-02T14:00, Value = 16.0 (WARNING)
        // Record 4: W2, Z2, ShiftA, 2026-09-02T18:00, Value = 22.0 (CRITICAL)
        return List.of(
                new ExposureRecord("EXP-1", worker1, zone1, shiftMorning, LocalDateTime.of(2026, 9, 1, 6, 0),
                        220, 210, 200, 4.0, 16.0, DemoStatus.NORMAL, "SIMULATED", "V1"),
                new ExposureRecord("EXP-2", worker1, zone1, shiftMorning, LocalDateTime.of(2026, 9, 1, 10, 0),
                        210, 200, 190, 6.0, 24.0, DemoStatus.NORMAL, "SIMULATED", "V1"),
                new ExposureRecord("EXP-3", worker2, zone2, shiftAfternoon, LocalDateTime.of(2026, 9, 2, 14, 0),
                        140, 130, 110, 16.0, 64.0, DemoStatus.WARNING, "SIMULATED", "V1"),
                new ExposureRecord("EXP-4", worker2, zone2, shiftAfternoon, LocalDateTime.of(2026, 9, 2, 18, 0),
                        100, 90, 80, 22.0, 88.0, DemoStatus.CRITICAL, "SIMULATED", "V1")
        );
    }

    @Test
    @DisplayName("Verify summary statistics against hand-calculated values")
    void testComputeSummaryStatisticsAgainstHandCalculation() {
        List<ExposureRecord> records = createHandCalculatedFixture();

        DoubleSummaryStatistics stats = analyticsService.computeSummaryStatistics(records);

        // Hand Calculations:
        // Count: 4
        // Sum: 4.0 + 6.0 + 16.0 + 22.0 = 48.0
        // Min: 4.0
        // Max: 22.0
        // Average: 48.0 / 4 = 12.0
        assertEquals(4, stats.getCount());
        assertEquals(48.0, stats.getSum(), 0.001);
        assertEquals(4.0, stats.getMin(), 0.001);
        assertEquals(22.0, stats.getMax(), 0.001);
        assertEquals(12.0, stats.getAverage(), 0.001);
    }

    @Test
    @DisplayName("Verify integrated cumulative dose formula: D = sum(C_i * delta_t * eta)")
    void testComputeIntegratedCumulativeDoseFormula() {
        List<ExposureRecord> records = createHandCalculatedFixture();

        // Formula: D = sum(C_i * shift_hours * duty_factor)
        // With duty_factor = 0.5 and shift_hours = 8:
        // Dose = (4.0*8*0.5) + (6.0*8*0.5) + (16.0*8*0.5) + (22.0*8*0.5)
        //      = 16.0 + 24.0 + 64.0 + 88.0 = 192.0
        double dose = calculationService.computeIntegratedCumulativeDose(records, 0.5);
        assertEquals(192.0, dose, 0.001);
    }

    @Test
    @DisplayName("Verify worker summaries stream grouping against hand-calculated values")
    void testComputeWorkerSummariesAgainstHandCalculation() {
        List<ExposureRecord> records = createHandCalculatedFixture();

        List<WorkerSummaryDto> summaries = analyticsService.computeWorkerSummaries(records);
        assertEquals(2, summaries.size());

        // Sorted by average exposure descending: W-102 (Elena) should be first
        WorkerSummaryDto first = summaries.get(0);
        assertEquals("W-102", first.getId());
        assertEquals(2, first.getTotalRecords());
        assertEquals(19.0, first.getAvgExposurePpmHr(), 0.01); // (16 + 22) / 2
        assertEquals(22.0, first.getMaxExposurePpmHr(), 0.01);
        assertEquals("CRITICAL", first.getLatestDemoStatus());

        WorkerSummaryDto second = summaries.get(1);
        assertEquals("W-101", second.getId());
        assertEquals(2, second.getTotalRecords());
        assertEquals(5.0, second.getAvgExposurePpmHr(), 0.01); // (4 + 6) / 2
        assertEquals(6.0, second.getMaxExposurePpmHr(), 0.01);
        assertEquals("NORMAL", second.getLatestDemoStatus());
    }

    @Test
    @DisplayName("Verify zone summaries stream grouping against hand-calculated values")
    void testComputeZoneSummariesAgainstHandCalculation() {
        List<ExposureRecord> records = createHandCalculatedFixture();

        List<ZoneComparisonDto> summaries = analyticsService.computeZoneSummaries(records);
        assertEquals(2, summaries.size());

        // ZONE-02 (AGR): Avg = 19.0, Max = 22.0, Alerts = 2 (Warning + Critical)
        ZoneComparisonDto z2 = summaries.stream().filter(z -> z.getZoneId().equals("ZONE-02")).findFirst().orElseThrow();
        assertEquals(19.0, z2.getAvgExposurePpmHr(), 0.01);
        assertEquals(22.0, z2.getMaxExposurePpmHr(), 0.01);
        assertEquals(2, z2.getRecordCount());
        assertEquals(2, z2.getAlertCount());

        // ZONE-01 (CCU): Avg = 5.0, Max = 6.0, Alerts = 0
        ZoneComparisonDto z1 = summaries.stream().filter(z -> z.getZoneId().equals("ZONE-01")).findFirst().orElseThrow();
        assertEquals(5.0, z1.getAvgExposurePpmHr(), 0.01);
        assertEquals(6.0, z1.getMaxExposurePpmHr(), 0.01);
        assertEquals(2, z1.getRecordCount());
        assertEquals(0, z1.getAlertCount());
    }

    @Test
    @DisplayName("Verify shift summaries stream grouping against hand-calculated values")
    void testComputeShiftSummariesAgainstHandCalculation() {
        List<ExposureRecord> records = createHandCalculatedFixture();

        List<ShiftSummaryDto> summaries = analyticsService.computeShiftSummaries(records);
        assertEquals(2, summaries.size());

        ShiftSummaryDto morning = summaries.stream().filter(s -> s.getShiftId().equals("SHIFT-M")).findFirst().orElseThrow();
        assertEquals(2, morning.getRecordCount());
        assertEquals(5.0, morning.getAvgExposurePpmHr(), 0.01);
        assertEquals(6.0, morning.getMaxExposurePpmHr(), 0.01);
        assertEquals(4.0, morning.getMinExposurePpmHr(), 0.01);
        assertEquals(0, morning.getWarningCount());
        assertEquals(0, morning.getCriticalCount());

        ShiftSummaryDto afternoon = summaries.stream().filter(s -> s.getShiftId().equals("SHIFT-A")).findFirst().orElseThrow();
        assertEquals(2, afternoon.getRecordCount());
        assertEquals(19.0, afternoon.getAvgExposurePpmHr(), 0.01);
        assertEquals(22.0, afternoon.getMaxExposurePpmHr(), 0.01);
        assertEquals(16.0, afternoon.getMinExposurePpmHr(), 0.01);
        assertEquals(1, afternoon.getWarningCount());
        assertEquals(1, afternoon.getCriticalCount());
    }

    @Test
    @DisplayName("Verify daily trends chronological stream grouping against hand-calculated values")
    void testComputeDailyTrendsAgainstHandCalculation() {
        List<ExposureRecord> records = createHandCalculatedFixture();

        List<TrendPointDto> trends = analyticsService.computeDailyTrends(records);
        assertEquals(2, trends.size());

        TrendPointDto day1 = trends.get(0);
        assertEquals("2026-09-01", day1.getDate());
        assertEquals(2, day1.getRecordCount());
        assertEquals(5.0, day1.getAvgExposurePpmHr(), 0.01);
        assertEquals(6.0, day1.getMaxExposurePpmHr(), 0.01);

        TrendPointDto day2 = trends.get(1);
        assertEquals("2026-09-02", day2.getDate());
        assertEquals(2, day2.getRecordCount());
        assertEquals(19.0, day2.getAvgExposurePpmHr(), 0.01);
        assertEquals(22.0, day2.getMaxExposurePpmHr(), 0.01);
        assertEquals(1, day2.getWarningCount());
        assertEquals(1, day2.getCriticalCount());
    }

    @Test
    @DisplayName("Verify demo-status distribution counting and percentages")
    void testComputeStatusDistributionAgainstHandCalculation() {
        List<ExposureRecord> records = createHandCalculatedFixture();

        List<StatusDistributionDto> dist = analyticsService.computeStatusDistribution(records);
        assertEquals(4, dist.size()); // NORMAL, ELEVATED, WARNING, CRITICAL

        StatusDistributionDto normal = dist.stream().filter(d -> d.getStatus().equals("NORMAL")).findFirst().orElseThrow();
        assertEquals(2, normal.getCount());
        assertEquals(50.0, normal.getPercentage(), 0.01);

        StatusDistributionDto elevated = dist.stream().filter(d -> d.getStatus().equals("ELEVATED")).findFirst().orElseThrow();
        assertEquals(0, elevated.getCount());
        assertEquals(0.0, elevated.getPercentage(), 0.01);

        StatusDistributionDto warning = dist.stream().filter(d -> d.getStatus().equals("WARNING")).findFirst().orElseThrow();
        assertEquals(1, warning.getCount());
        assertEquals(25.0, warning.getPercentage(), 0.01);

        StatusDistributionDto critical = dist.stream().filter(d -> d.getStatus().equals("CRITICAL")).findFirst().orElseThrow();
        assertEquals(1, critical.getCount());
        assertEquals(25.0, critical.getPercentage(), 0.01);
    }

    @Test
    @DisplayName("Edge Case: sanitizeRecords safely handles nulls, empty lists, invalid numbers, and duplicates")
    void testSanitizeRecordsEdgeCases() {
        // Null and empty list safety
        assertTrue(analyticsService.sanitizeRecords(null).isEmpty());
        assertTrue(analyticsService.sanitizeRecords(List.of()).isEmpty());

        List<ExposureRecord> dirtyList = new ArrayList<>();
        dirtyList.add(null); // Null element

        // Valid record
        dirtyList.add(new ExposureRecord("EXP-OK-1", worker1, zone1, shiftMorning, LocalDateTime.now(),
                200, 200, 200, 5.0, 20.0, DemoStatus.NORMAL, "SIM", "V1"));

        // Duplicate with same ID
        dirtyList.add(new ExposureRecord("EXP-OK-1", worker1, zone1, shiftMorning, LocalDateTime.now(),
                200, 200, 200, 5.0, 20.0, DemoStatus.NORMAL, "SIM", "V1"));

        // Missing worker
        dirtyList.add(new ExposureRecord("EXP-BAD-1", null, zone1, shiftMorning, LocalDateTime.now(),
                200, 200, 200, 5.0, 20.0, DemoStatus.NORMAL, "SIM", "V1"));

        // Missing timestamp
        dirtyList.add(new ExposureRecord("EXP-BAD-2", worker1, zone1, shiftMorning, null,
                200, 200, 200, 5.0, 20.0, DemoStatus.NORMAL, "SIM", "V1"));

        List<ExposureRecord> clean = analyticsService.sanitizeRecords(dirtyList);
        assertEquals(1, clean.size(), "Only the single valid, unique record should survive");
        assertEquals("EXP-OK-1", clean.get(0).getId());
    }

    @Test
    @DisplayName("Edge Case: computeSummaryStatistics on empty data returns safe defaults without exception")
    void testSummaryStatisticsOnEmptyData() {
        DoubleSummaryStatistics stats = analyticsService.computeSummaryStatistics(List.of());
        assertEquals(0, stats.getCount());
        assertEquals(0.0, stats.getAverage(), 0.001);
        assertEquals(0.0, stats.getSum(), 0.001);
    }

    @Test
    @DisplayName("Should correctly calculate descriptive statistics for a known dataset")
    void testCalculateDescriptiveStatistics() {
        List<Double> values = List.of(2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0);

        DescriptiveStatsDto stats = analyticsService.calculateDescriptiveStatistics("TestVar", "units", values);

        assertEquals(8, stats.getCount());
        assertEquals(5.0, stats.getMean(), 0.01);
        assertEquals(4.5, stats.getMedian(), 0.01);
        assertEquals(2.0, stats.getMin(), 0.01);
        assertEquals(9.0, stats.getMax(), 0.01);
        assertTrue(stats.getStdDev() > 2.0 && stats.getStdDev() < 2.3);
        assertTrue(stats.getIqr() > 0);
    }

    @Test
    @DisplayName("Should calculate Pearson correlation accurately")
    void testPearsonCorrelation() {
        List<Double> x = List.of(1.0, 2.0, 3.0, 4.0, 5.0);
        List<Double> y = List.of(2.0, 4.0, 6.0, 8.0, 10.0); // Perfect linear correlation r = 1.0

        double r = analyticsService.calculatePearsonCorrelation(x, y);
        assertEquals(1.0, r, 0.001);

        List<Double> yInv = List.of(10.0, 8.0, 6.0, 4.0, 2.0); // Perfect negative correlation r = -1.0
        double rInv = analyticsService.calculatePearsonCorrelation(x, yInv);
        assertEquals(-1.0, rInv, 0.001);
    }

    @Test
    @DisplayName("Should create correct histogram bins")
    void testCalculateExposureHistogram() {
        List<ExposureRecord> records = new ArrayList<>();
        for (double v : new double[]{2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0}) {
            ExposureRecord r = new ExposureRecord();
            r.setIllustrativeExposureValue(v);
            records.add(r);
        }

        List<HistogramBinDto> bins = analyticsService.calculateExposureHistogram(records, 5);
        assertEquals(5, bins.size());
        long totalCount = bins.stream().mapToLong(HistogramBinDto::getCount).sum();
        assertEquals(10, totalCount);
    }
}
