package com.chromaguard.dto;

/**
 * Data Transfer Object (DTO) capturing aggregated exposure analytics across operational shifts.
 * Generated using Java Streams API groupingBy and summarizing collectors.
 */
public class ShiftSummaryDto {

    private String shiftId;
    private String shiftName;
    private String startTime;
    private String endTime;
    private int durationHours;
    private long recordCount;
    private double avgExposurePpmHr;
    private double maxExposurePpmHr;
    private double minExposurePpmHr;
    private long warningCount;
    private long criticalCount;

    public ShiftSummaryDto() {
    }

    public ShiftSummaryDto(String shiftId, String shiftName, String startTime, String endTime,
                           int durationHours, long recordCount, double avgExposurePpmHr,
                           double maxExposurePpmHr, double minExposurePpmHr,
                           long warningCount, long criticalCount) {
        this.shiftId = shiftId;
        this.shiftName = shiftName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationHours = durationHours;
        this.recordCount = recordCount;
        this.avgExposurePpmHr = avgExposurePpmHr;
        this.maxExposurePpmHr = maxExposurePpmHr;
        this.minExposurePpmHr = minExposurePpmHr;
        this.warningCount = warningCount;
        this.criticalCount = criticalCount;
    }

    public String getShiftId() {
        return shiftId;
    }

    public void setShiftId(String shiftId) {
        this.shiftId = shiftId;
    }

    public String getShiftName() {
        return shiftName;
    }

    public void setShiftName(String shiftName) {
        this.shiftName = shiftName;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public int getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(int durationHours) {
        this.durationHours = durationHours;
    }

    public long getRecordCount() {
        return recordCount;
    }

    public void setRecordCount(long recordCount) {
        this.recordCount = recordCount;
    }

    public double getAvgExposurePpmHr() {
        return avgExposurePpmHr;
    }

    public void setAvgExposurePpmHr(double avgExposurePpmHr) {
        this.avgExposurePpmHr = avgExposurePpmHr;
    }

    public double getMaxExposurePpmHr() {
        return maxExposurePpmHr;
    }

    public void setMaxExposurePpmHr(double maxExposurePpmHr) {
        this.maxExposurePpmHr = maxExposurePpmHr;
    }

    public double getMinExposurePpmHr() {
        return minExposurePpmHr;
    }

    public void setMinExposurePpmHr(double minExposurePpmHr) {
        this.minExposurePpmHr = minExposurePpmHr;
    }

    public long getWarningCount() {
        return warningCount;
    }

    public void setWarningCount(long warningCount) {
        this.warningCount = warningCount;
    }

    public long getCriticalCount() {
        return criticalCount;
    }

    public void setCriticalCount(long criticalCount) {
        this.criticalCount = criticalCount;
    }
}
