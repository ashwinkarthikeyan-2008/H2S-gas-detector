package com.chromaguard.dto;

public class DemoResetResponseDto {
    private boolean success;
    private String message;
    private String resetTimestamp;
    private long zonesLoaded;
    private long shiftsLoaded;
    private long workersLoaded;
    private long recordsLoaded;
    private long alertsLoaded;

    public DemoResetResponseDto() {
    }

    public DemoResetResponseDto(boolean success, String message, String resetTimestamp,
                                long zonesLoaded, long shiftsLoaded, long workersLoaded,
                                long recordsLoaded, long alertsLoaded) {
        this.success = success;
        this.message = message;
        this.resetTimestamp = resetTimestamp;
        this.zonesLoaded = zonesLoaded;
        this.shiftsLoaded = shiftsLoaded;
        this.workersLoaded = workersLoaded;
        this.recordsLoaded = recordsLoaded;
        this.alertsLoaded = alertsLoaded;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getResetTimestamp() {
        return resetTimestamp;
    }

    public void setResetTimestamp(String resetTimestamp) {
        this.resetTimestamp = resetTimestamp;
    }

    public long getZonesLoaded() {
        return zonesLoaded;
    }

    public void setZonesLoaded(long zonesLoaded) {
        this.zonesLoaded = zonesLoaded;
    }

    public long getShiftsLoaded() {
        return shiftsLoaded;
    }

    public void setShiftsLoaded(long shiftsLoaded) {
        this.shiftsLoaded = shiftsLoaded;
    }

    public long getWorkersLoaded() {
        return workersLoaded;
    }

    public void setWorkersLoaded(long workersLoaded) {
        this.workersLoaded = workersLoaded;
    }

    public long getRecordsLoaded() {
        return recordsLoaded;
    }

    public void setRecordsLoaded(long recordsLoaded) {
        this.recordsLoaded = recordsLoaded;
    }

    public long getAlertsLoaded() {
        return alertsLoaded;
    }

    public void setAlertsLoaded(long alertsLoaded) {
        this.alertsLoaded = alertsLoaded;
    }
}
