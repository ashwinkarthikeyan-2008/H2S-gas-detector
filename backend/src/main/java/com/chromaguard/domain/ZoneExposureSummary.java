package com.chromaguard.domain;

import java.util.Objects;

/**
 * Value object representing aggregated exposure analytics for an industrial zone.
 * Demonstrates domain encapsulation and immutability.
 */
public class ZoneExposureSummary {

    private final String zoneId;
    private final String zoneName;
    private final int recordCount;
    private final double averageExposure;
    private final double maxExposure;
    private final double baselineTarget;
    private final long exceedanceCount;

    public ZoneExposureSummary(String zoneId, String zoneName, int recordCount,
                               double averageExposure, double maxExposure,
                               double baselineTarget, long exceedanceCount) {
        if (recordCount < 0) throw new IllegalArgumentException("Record count cannot be negative");
        this.zoneId = Objects.requireNonNull(zoneId, "zoneId must not be null");
        this.zoneName = Objects.requireNonNull(zoneName, "zoneName must not be null");
        this.recordCount = recordCount;
        this.averageExposure = averageExposure;
        this.maxExposure = maxExposure;
        this.baselineTarget = baselineTarget;
        this.exceedanceCount = exceedanceCount;
    }

    public String getZoneId() {
        return zoneId;
    }

    public String getZoneName() {
        return zoneName;
    }

    public int getRecordCount() {
        return recordCount;
    }

    public double getAverageExposure() {
        return averageExposure;
    }

    public double getMaxExposure() {
        return maxExposure;
    }

    public double getBaselineTarget() {
        return baselineTarget;
    }

    public long getExceedanceCount() {
        return exceedanceCount;
    }

    public boolean isWithinTargetBaseline() {
        return averageExposure <= baselineTarget;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ZoneExposureSummary that)) return false;
        return recordCount == that.recordCount &&
                Double.compare(that.averageExposure, averageExposure) == 0 &&
                Double.compare(that.maxExposure, maxExposure) == 0 &&
                Double.compare(that.baselineTarget, baselineTarget) == 0 &&
                exceedanceCount == that.exceedanceCount &&
                Objects.equals(zoneId, that.zoneId) &&
                Objects.equals(zoneName, that.zoneName);
    }

    @Override
    public int hashCode() {
        return Objects.hash(zoneId, zoneName, recordCount, averageExposure, maxExposure, baselineTarget, exceedanceCount);
    }

    @Override
    public String toString() {
        return String.format("ZoneExposureSummary[id=%s, name='%s', avg=%.2f, max=%.2f, exceedances=%d]",
                zoneId, zoneName, averageExposure, maxExposure, exceedanceCount);
    }
}
