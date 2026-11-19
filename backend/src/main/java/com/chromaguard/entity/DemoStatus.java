package com.chromaguard.entity;

/**
 * Enumeration of illustrative exposure demonstration statuses.
 * Explicitly identified as simulation categories, not official OSHA regulatory tiers.
 * Demonstrates Java rich enums with state, helper predicates, and threshold evaluation.
 */
public enum DemoStatus {
    NORMAL("Normal Demo Level", "< 8.0 ppm·hr", 1, false),
    ELEVATED("Elevated Demo Level", "8.0 - 14.99 ppm·hr", 2, false),
    WARNING("Warning Demo Level", "15.0 - 19.99 ppm·hr", 3, true),
    CRITICAL("Critical Demo Level", ">= 20.0 ppm·hr", 4, true);

    private final String displayName;
    private final String rangeDescription;
    private final int severityRank;
    private final boolean incidentLevel;

    DemoStatus(String displayName, String rangeDescription, int severityRank, boolean incidentLevel) {
        this.displayName = displayName;
        this.rangeDescription = rangeDescription;
        this.severityRank = severityRank;
        this.incidentLevel = incidentLevel;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getRangeDescription() {
        return rangeDescription;
    }

    public int getSeverityRank() {
        return severityRank;
    }

    public boolean isIncidentLevel() {
        return incidentLevel;
    }

    public boolean isCritical() {
        return this == CRITICAL;
    }

    public static DemoStatus fromExposureValue(double exposurePpmHr, double warningThreshold, double criticalThreshold, double elevatedThreshold) {
        if (exposurePpmHr >= criticalThreshold) {
            return CRITICAL;
        } else if (exposurePpmHr >= warningThreshold) {
            return WARNING;
        } else if (exposurePpmHr >= elevatedThreshold) {
            return ELEVATED;
        } else {
            return NORMAL;
        }
    }
}
