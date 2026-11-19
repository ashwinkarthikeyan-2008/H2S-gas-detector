package com.chromaguard.service;

import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Encapsulates exposure aggregation, cumulative dose computation,
 * and rule-based demonstration status evaluation.
 */
@Service
public class ExposureCalculationService {

    @Value("${chromaguard.demo.thresholds.elevated-ppm-hr:8.0}")
    private double elevatedThresholdPpmHr;

    @Value("${chromaguard.demo.thresholds.warning-ppm-hr:15.0}")
    private double warningThresholdPpmHr;

    @Value("${chromaguard.demo.thresholds.critical-ppm-hr:20.0}")
    private double criticalThresholdPpmHr;

    public ExposureCalculationService() {
    }

    public ExposureCalculationService(double elevatedThresholdPpmHr, double warningThresholdPpmHr, double criticalThresholdPpmHr) {
        this.elevatedThresholdPpmHr = elevatedThresholdPpmHr;
        this.warningThresholdPpmHr = warningThresholdPpmHr;
        this.criticalThresholdPpmHr = criticalThresholdPpmHr;
    }

    /**
     * Evaluates demo status based on configurable simulation thresholds.
     * Note: Purely rule-based simulation thresholds for educational demonstration.
     */
    public DemoStatus evaluateStatus(double exposurePpmHr) {
        return DemoStatus.fromExposureValue(exposurePpmHr, warningThresholdPpmHr, criticalThresholdPpmHr, elevatedThresholdPpmHr);
    }

    /**
     * Documented Aggregation Formula for Illustrative Cumulative Dose:
     * D = sum(C_i * delta_t_i * eta_i)
     *
     * Where:
     * - C_i: Instantaneous illustrative H2S exposure concentration (in ppm·hr equivalent)
     * - delta_t_i: Sampling duration interval in hours (default 8.0 hours for standard shift)
     * - eta_i: Operational duty factor / gas exposure presence fraction (0.0 < eta <= 1.0)
     *
     * ACADEMIC & SAFETY NOTICE:
     * This formula is an illustrative mathematical model for software demonstration only.
     * It does not represent validated toxicological uptake, biological clearance, or official OSHA PEL.
     */
    public double computeCumulativeDose(double exposurePpmHr, int shiftHours, double dutyFactor) {
        if (exposurePpmHr < 0 || shiftHours <= 0 || dutyFactor <= 0) return 0.0;
        double rawDose = exposurePpmHr * shiftHours * dutyFactor;
        return Math.round(rawDose * 100.0) / 100.0;
    }

    /**
     * Computes the cumulative integrated dose across a sequence of exposure intervals.
     * Integrates D = sum(C_i * delta_t_i * eta) using Java Streams.
     */
    public double computeIntegratedCumulativeDose(List<ExposureRecord> records, double dutyFactor) {
        if (records == null || records.isEmpty() || dutyFactor <= 0.0) return 0.0;
        double totalDose = records.stream()
                .filter(Objects::nonNull)
                .filter(r -> r.getIllustrativeExposureValue() != null && r.getIllustrativeExposureValue() >= 0.0)
                .mapToDouble(r -> {
                    int duration = (r.getShift() != null && r.getShift().getDurationHours() != null)
                            ? r.getShift().getDurationHours() : 8;
                    return r.getIllustrativeExposureValue() * duration * dutyFactor;
                })
                .sum();
        return Math.round(totalDose * 100.0) / 100.0;
    }

    /**
     * Calculates arithmetic mean of exposure values using Java Streams API.
     */
    public double calculateMeanExposure(List<ExposureRecord> records) {
        if (records == null || records.isEmpty()) return 0.0;
        return records.stream()
                .mapToDouble(ExposureRecord::getIllustrativeExposureValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Finds maximum exposure value using Java Streams API.
     */
    public double calculateMaxExposure(List<ExposureRecord> records) {
        if (records == null || records.isEmpty()) return 0.0;
        return records.stream()
                .mapToDouble(ExposureRecord::getIllustrativeExposureValue)
                .max()
                .orElse(0.0);
    }

    /**
     * Finds minimum exposure value using Java Streams API.
     */
    public double calculateMinExposure(List<ExposureRecord> records) {
        if (records == null || records.isEmpty()) return 0.0;
        return records.stream()
                .mapToDouble(ExposureRecord::getIllustrativeExposureValue)
                .min()
                .orElse(0.0);
    }

    /**
     * Groups exposure records by date string (YYYY-MM-DD).
     */
    public Map<String, List<ExposureRecord>> groupByDate(List<ExposureRecord> records) {
        if (records == null || records.isEmpty()) return Collections.emptyMap();
        return records.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getTimestamp().toLocalDate().toString(),
                        TreeMap::new,
                        Collectors.toList()
                ));
    }

    /**
     * Groups records by Industrial Zone ID.
     */
    public Map<String, List<ExposureRecord>> groupByZone(List<ExposureRecord> records) {
        if (records == null || records.isEmpty()) return Collections.emptyMap();
        return records.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getZone().getId(),
                        Collectors.toList()
                ));
    }

    /**
     * Groups records by Worker ID.
     */
    public Map<String, List<ExposureRecord>> groupByWorker(List<ExposureRecord> records) {
        if (records == null || records.isEmpty()) return Collections.emptyMap();
        return records.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getWorker().getId(),
                        Collectors.toList()
                ));
    }

    public double getElevatedThresholdPpmHr() {
        return elevatedThresholdPpmHr;
    }

    public double getWarningThresholdPpmHr() {
        return warningThresholdPpmHr;
    }

    public double getCriticalThresholdPpmHr() {
        return criticalThresholdPpmHr;
    }
}
