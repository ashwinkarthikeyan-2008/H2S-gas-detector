package com.chromaguard.dto;

public class WorkerSummaryDto {
    private String id;
    private String syntheticName;
    private String assignedZoneId;
    private String assignedZoneName;
    private String preferredShiftId;
    private String preferredShiftName;
    private String role;
    private int experienceYears;
    private String badgeId;
    private long totalRecords;
    private double avgExposurePpmHr;
    private double maxExposurePpmHr;
    private String latestDemoStatus;
    private String latestTimestamp;

    public WorkerSummaryDto() {
    }

    public WorkerSummaryDto(String id, String syntheticName, String assignedZoneId, String assignedZoneName,
                            String preferredShiftId, String preferredShiftName, String role, int experienceYears,
                            String badgeId, long totalRecords, double avgExposurePpmHr, double maxExposurePpmHr,
                            String latestDemoStatus, String latestTimestamp) {
        this.id = id;
        this.syntheticName = syntheticName;
        this.assignedZoneId = assignedZoneId;
        this.assignedZoneName = assignedZoneName;
        this.preferredShiftId = preferredShiftId;
        this.preferredShiftName = preferredShiftName;
        this.role = role;
        this.experienceYears = experienceYears;
        this.badgeId = badgeId;
        this.totalRecords = totalRecords;
        this.avgExposurePpmHr = avgExposurePpmHr;
        this.maxExposurePpmHr = maxExposurePpmHr;
        this.latestDemoStatus = latestDemoStatus;
        this.latestTimestamp = latestTimestamp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSyntheticName() {
        return syntheticName;
    }

    public void setSyntheticName(String syntheticName) {
        this.syntheticName = syntheticName;
    }

    public String getAssignedZoneId() {
        return assignedZoneId;
    }

    public void setAssignedZoneId(String assignedZoneId) {
        this.assignedZoneId = assignedZoneId;
    }

    public String getAssignedZoneName() {
        return assignedZoneName;
    }

    public void setAssignedZoneName(String assignedZoneName) {
        this.assignedZoneName = assignedZoneName;
    }

    public String getPreferredShiftId() {
        return preferredShiftId;
    }

    public void setPreferredShiftId(String preferredShiftId) {
        this.preferredShiftId = preferredShiftId;
    }

    public String getPreferredShiftName() {
        return preferredShiftName;
    }

    public void setPreferredShiftName(String preferredShiftName) {
        this.preferredShiftName = preferredShiftName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(int experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getBadgeId() {
        return badgeId;
    }

    public void setBadgeId(String badgeId) {
        this.badgeId = badgeId;
    }

    public long getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(long totalRecords) {
        this.totalRecords = totalRecords;
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

    public String getLatestDemoStatus() {
        return latestDemoStatus;
    }

    public void setLatestDemoStatus(String latestDemoStatus) {
        this.latestDemoStatus = latestDemoStatus;
    }

    public String getLatestTimestamp() {
        return latestTimestamp;
    }

    public void setLatestTimestamp(String latestTimestamp) {
        this.latestTimestamp = latestTimestamp;
    }
}
