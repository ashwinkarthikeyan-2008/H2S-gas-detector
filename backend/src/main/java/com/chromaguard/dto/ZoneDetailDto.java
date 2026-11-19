package com.chromaguard.dto;

import java.util.List;
import java.util.Map;

/**
 * Data Transfer Object (DTO) conveying deep analytical profile, stationed personnel roster,
 * and recent safety incidents for an Industrial Zone.
 */
public record ZoneDetailDto(
        String id,
        String zoneCode,
        String zoneName,
        String riskTier,
        Double baselineExposurePpmHr,
        String description,
        long totalStationedWorkers,
        long totalExposureRecords,
        double observedMeanExposure,
        double observedMaxExposure,
        double baselineExcessPercentage,
        long incidentCount,
        Map<String, Long> statusBreakdown,
        List<WorkerSummaryDto> stationedWorkers,
        List<AlertDto> recentAlerts,
        String dataSource
) {}
