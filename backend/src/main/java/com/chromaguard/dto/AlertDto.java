package com.chromaguard.dto;

public class AlertDto {
    private String id;
    private String recordId;
    private String workerId;
    private String workerName;
    private String zoneId;
    private String zoneCode;
    private String zoneName;
    private String timestamp;
    private String demoSeverity;
    private double triggerValuePpmHr;
    private double thresholdLimitPpmHr;
    private boolean isAcknowledged;
    private String acknowledgedAt;
    private String acknowledgedBy;
    private String actionNotes;

    public AlertDto() {
    }

    public AlertDto(String id, String recordId, String workerId, String workerName, String zoneId,
                    String zoneCode, String zoneName, String timestamp, String demoSeverity,
                    double triggerValuePpmHr, double thresholdLimitPpmHr, boolean isAcknowledged,
                    String acknowledgedAt, String acknowledgedBy, String actionNotes) {
        this.id = id;
        this.recordId = recordId;
        this.workerId = workerId;
        this.workerName = workerName;
        this.zoneId = zoneId;
        this.zoneCode = zoneCode;
        this.zoneName = zoneName;
        this.timestamp = timestamp;
        this.demoSeverity = demoSeverity;
        this.triggerValuePpmHr = triggerValuePpmHr;
        this.thresholdLimitPpmHr = thresholdLimitPpmHr;
        this.isAcknowledged = isAcknowledged;
        this.acknowledgedAt = acknowledgedAt;
        this.acknowledgedBy = acknowledgedBy;
        this.actionNotes = actionNotes;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRecordId() {
        return recordId;
    }

    public void setRecordId(String recordId) {
        this.recordId = recordId;
    }

    public String getWorkerId() {
        return workerId;
    }

    public void setWorkerId(String workerId) {
        this.workerId = workerId;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
    }

    public String getZoneId() {
        return zoneId;
    }

    public void setZoneId(String zoneId) {
        this.zoneId = zoneId;
    }

    public String getZoneCode() {
        return zoneCode;
    }

    public void setZoneCode(String zoneCode) {
        this.zoneCode = zoneCode;
    }

    public String getZoneName() {
        return zoneName;
    }

    public void setZoneName(String zoneName) {
        this.zoneName = zoneName;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getDemoSeverity() {
        return demoSeverity;
    }

    public void setDemoSeverity(String demoSeverity) {
        this.demoSeverity = demoSeverity;
    }

    public double getTriggerValuePpmHr() {
        return triggerValuePpmHr;
    }

    public void setTriggerValuePpmHr(double triggerValuePpmHr) {
        this.triggerValuePpmHr = triggerValuePpmHr;
    }

    public double getThresholdLimitPpmHr() {
        return thresholdLimitPpmHr;
    }

    public void setThresholdLimitPpmHr(double thresholdLimitPpmHr) {
        this.thresholdLimitPpmHr = thresholdLimitPpmHr;
    }

    public boolean isAcknowledged() {
        return isAcknowledged;
    }

    public void setAcknowledged(boolean acknowledged) {
        isAcknowledged = acknowledged;
    }

    public String getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(String acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }

    public String getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(String acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }

    public String getActionNotes() {
        return actionNotes;
    }

    public void setActionNotes(String actionNotes) {
        this.actionNotes = actionNotes;
    }
}
