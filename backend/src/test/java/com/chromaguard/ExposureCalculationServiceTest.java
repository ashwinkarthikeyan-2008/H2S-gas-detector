package com.chromaguard;

import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.service.ExposureCalculationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Exposure Calculation Service Unit Tests")
class ExposureCalculationServiceTest {

    private ExposureCalculationService calculationService;

    @BeforeEach
    void setUp() {
        // Elevated: 8.0, Warning: 15.0, Critical: 20.0
        calculationService = new ExposureCalculationService(8.0, 15.0, 20.0);
    }

    @Test
    @DisplayName("Should classify demo status based on threshold boundaries")
    void testEvaluateStatus() {
        assertEquals(DemoStatus.NORMAL, calculationService.evaluateStatus(4.5));
        assertEquals(DemoStatus.NORMAL, calculationService.evaluateStatus(7.99));
        assertEquals(DemoStatus.ELEVATED, calculationService.evaluateStatus(8.0));
        assertEquals(DemoStatus.ELEVATED, calculationService.evaluateStatus(14.99));
        assertEquals(DemoStatus.WARNING, calculationService.evaluateStatus(15.0));
        assertEquals(DemoStatus.WARNING, calculationService.evaluateStatus(19.99));
        assertEquals(DemoStatus.CRITICAL, calculationService.evaluateStatus(20.0));
        assertEquals(DemoStatus.CRITICAL, calculationService.evaluateStatus(28.5));
    }

    @Test
    @DisplayName("Should compute cumulative dose with shift hours and duty factor")
    void testComputeCumulativeDose() {
        // Exposure 5.0 ppm·hr, 8 hours, duty factor 1.0 -> 40.0
        double dose = calculationService.computeCumulativeDose(5.0, 8, 1.0);
        assertEquals(40.0, dose, 0.001);

        // Edge case: 0 exposure or 0 hours
        assertEquals(0.0, calculationService.computeCumulativeDose(0.0, 8, 1.0));
        assertEquals(0.0, calculationService.computeCumulativeDose(5.0, 0, 1.0));
        assertEquals(0.0, calculationService.computeCumulativeDose(-2.0, 8, 1.0));
    }

    @Test
    @DisplayName("Should calculate mean, min, and max accurately")
    void testAggregations() {
        List<ExposureRecord> records = new ArrayList<>();
        ExposureRecord r1 = new ExposureRecord();
        r1.setIllustrativeExposureValue(4.0);
        ExposureRecord r2 = new ExposureRecord();
        r2.setIllustrativeExposureValue(10.0);
        ExposureRecord r3 = new ExposureRecord();
        r3.setIllustrativeExposureValue(16.0);

        records.add(r1);
        records.add(r2);
        records.add(r3);

        assertEquals(10.0, calculationService.calculateMeanExposure(records), 0.001);
        assertEquals(4.0, calculationService.calculateMinExposure(records), 0.001);
        assertEquals(16.0, calculationService.calculateMaxExposure(records), 0.001);

        // Empty list check
        assertEquals(0.0, calculationService.calculateMeanExposure(Collections.emptyList()));
        assertEquals(0.0, calculationService.calculateMinExposure(Collections.emptyList()));
        assertEquals(0.0, calculationService.calculateMaxExposure(Collections.emptyList()));
    }
}
