package com.chromaguard.exception;

import java.time.LocalDateTime;

/**
 * Domain-specific exception thrown when an exposure measurement exceeds
 * warning or critical safety thresholds during calculation.
 * Extends {@link ChromaGuardDomainException} as part of the domain exception hierarchy.
 */
public class ThresholdExceededException extends ChromaGuardDomainException {

    public static final String ERROR_CODE = "ERR_THRESHOLD_EXCEEDED";

    private final String workerId;
    private final String zoneId;
    private final double observedExposure;
    private final double thresholdLimit;
    private final LocalDateTime eventTime;

    public ThresholdExceededException(String workerId, String zoneId, double observedExposure, double thresholdLimit,
            LocalDateTime eventTime) {
        super(ERROR_CODE, String.format(
                "Safety threshold exceeded in %s for worker %s: observed %.2f ppm·hr (limit: %.2f ppm·hr) at %s",
                zoneId, workerId, observedExposure, thresholdLimit, eventTime));

        this.workerId = workerId;
        this.zoneId = zoneId;
        this.observedExposure = observedExposure;
        this.thresholdLimit = thresholdLimit;
        this.eventTime = eventTime;
    }

    public String getWorkerId() {
        return workerId;
    }

    public String getZoneId() {
        return zoneId;
    }

    public double getObservedExposure() {
        return observedExposure;
    }

    public double getThresholdLimit() {
        return thresholdLimit;
    }

    public LocalDateTime getEventTime() {
        return eventTime;
    }
}
