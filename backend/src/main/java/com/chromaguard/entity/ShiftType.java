package com.chromaguard.entity;

/**
 * Rich domain enumeration representing petrochemical operational shifts.
 * Demonstrates:
 * - Enum instance variables and constructors
 * - Business methods encapsulating shift-specific risk factors
 * - Reverse lookup from string name with graceful fallback
 */
public enum ShiftType {
    MORNING("Morning", "06:00:00", "14:00:00", 8, false, 1.0),
    AFTERNOON("Afternoon", "14:00:00", "22:00:00", 8, false, 1.05),
    NIGHT("Night", "22:00:00", "06:00:00", 8, true, 1.25);

    private final String displayName;
    private final String standardStartTime;
    private final String standardEndTime;
    private final int standardDurationHours;
    private final boolean isNightShift;
    private final double fatigueRiskMultiplier;

    ShiftType(String displayName, String standardStartTime, String standardEndTime,
              int standardDurationHours, boolean isNightShift, double fatigueRiskMultiplier) {
        this.displayName = displayName;
        this.standardStartTime = standardStartTime;
        this.standardEndTime = standardEndTime;
        this.standardDurationHours = standardDurationHours;
        this.isNightShift = isNightShift;
        this.fatigueRiskMultiplier = fatigueRiskMultiplier;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getStandardStartTime() {
        return standardStartTime;
    }

    public String getStandardEndTime() {
        return standardEndTime;
    }

    public int getStandardDurationHours() {
        return standardDurationHours;
    }

    public boolean isNightShift() {
        return isNightShift;
    }

    public double getFatigueRiskMultiplier() {
        return fatigueRiskMultiplier;
    }

    /**
     * Resolves a {@link ShiftType} from an arbitrary shift name string.
     *
     * @param name text identifier
     * @return matching ShiftType, or MORNING if unrecognized
     */
    public static ShiftType fromShiftName(String name) {
        if (name == null || name.isBlank()) {
            return MORNING;
        }
        String clean = name.trim().toUpperCase();
        if (clean.contains("NIGHT")) return NIGHT;
        if (clean.contains("AFTERNOON") || clean.contains("EVENING")) return AFTERNOON;
        return MORNING;
    }
}
