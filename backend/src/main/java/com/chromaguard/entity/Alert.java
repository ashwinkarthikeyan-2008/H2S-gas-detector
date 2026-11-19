package com.chromaguard.entity;

import com.chromaguard.domain.Auditable;
import com.chromaguard.domain.Identifiable;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "alerts", indexes = {
    @Index(name = "idx_alert_severity", columnList = "demo_severity"),
    @Index(name = "idx_alert_ack", columnList = "is_acknowledged"),
    @Index(name = "idx_alert_timestamp", columnList = "alert_timestamp")
})
public class Alert implements Identifiable<String>, Auditable {

    @Id
    @Column(name = "alert_id", length = 32)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "record_id", nullable = false)
    private ExposureRecord exposureRecord;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "zone_id", nullable = false)
    private IndustrialZone zone;

    @Column(name = "alert_timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "demo_severity", nullable = false, length = 16)
    private DemoStatus demoSeverity;

    @Column(name = "trigger_value_ppm_hr", nullable = false)
    private Double triggerValuePpmHr;

    @Column(name = "threshold_limit_ppm_hr", nullable = false)
    private Double thresholdLimitPpmHr;

    @Column(name = "is_acknowledged", nullable = false)
    private Boolean isAcknowledged;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "acknowledged_by", length = 128)
    private String acknowledgedBy;

    @Column(name = "action_notes", length = 512)
    private String actionNotes;

    public Alert() {
        this.isAcknowledged = false;
    }

    public Alert(String id, ExposureRecord exposureRecord, Worker worker, IndustrialZone zone,
                 LocalDateTime timestamp, DemoStatus demoSeverity, Double triggerValuePpmHr,
                 Double thresholdLimitPpmHr, Boolean isAcknowledged, LocalDateTime acknowledgedAt,
                 String acknowledgedBy, String actionNotes) {
        this.id = id;
        this.exposureRecord = exposureRecord;
        this.worker = worker;
        this.zone = zone;
        this.timestamp = timestamp;
        this.demoSeverity = demoSeverity;
        this.triggerValuePpmHr = triggerValuePpmHr;
        this.thresholdLimitPpmHr = thresholdLimitPpmHr;
        this.isAcknowledged = isAcknowledged != null ? isAcknowledged : false;
        this.acknowledgedAt = acknowledgedAt;
        this.acknowledgedBy = acknowledgedBy;
        this.actionNotes = actionNotes;
    }

    public Alert(String id, Worker worker, IndustrialZone zone,
                 LocalDateTime timestamp, DemoStatus demoSeverity, Double triggerValuePpmHr,
                 Double thresholdLimitPpmHr) {
        this(id, null, worker, zone, timestamp, demoSeverity, triggerValuePpmHr, thresholdLimitPpmHr, false, null, null, null);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ExposureRecord getExposureRecord() {
        return exposureRecord;
    }

    public void setExposureRecord(ExposureRecord exposureRecord) {
        this.exposureRecord = exposureRecord;
    }

    public Worker getWorker() {
        return worker;
    }

    public void setWorker(Worker worker) {
        this.worker = worker;
    }

    public IndustrialZone getZone() {
        return zone;
    }

    public void setZone(IndustrialZone zone) {
        this.zone = zone;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public DemoStatus getDemoSeverity() {
        return demoSeverity;
    }

    public void setDemoSeverity(DemoStatus demoSeverity) {
        this.demoSeverity = demoSeverity;
    }

    public Double getTriggerValuePpmHr() {
        return triggerValuePpmHr;
    }

    public void setTriggerValuePpmHr(Double triggerValuePpmHr) {
        this.triggerValuePpmHr = triggerValuePpmHr;
    }

    public Double getThresholdLimitPpmHr() {
        return thresholdLimitPpmHr;
    }

    public void setThresholdLimitPpmHr(Double thresholdLimitPpmHr) {
        this.thresholdLimitPpmHr = thresholdLimitPpmHr;
    }

    public Boolean getIsAcknowledged() {
        return isAcknowledged;
    }

    public void setIsAcknowledged(Boolean isAcknowledged) {
        this.isAcknowledged = isAcknowledged;
    }

    public LocalDateTime getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(LocalDateTime acknowledgedAt) {
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

    /**
     * Domain encapsulation: Acknowledges the safety incident and sets immutable audit trail.
     * Demonstrates rich domain modeling over anemic setter mutation.
     */
    public void acknowledge(String acknowledgedBy, String actionNotes, LocalDateTime acknowledgedAt) {
        this.isAcknowledged = true;
        this.acknowledgedBy = (acknowledgedBy != null && !acknowledgedBy.isBlank())
                ? acknowledgedBy : "admin@chromaguard.internal";
        this.actionNotes = actionNotes;
        this.acknowledgedAt = acknowledgedAt != null ? acknowledgedAt : LocalDateTime.now();
    }

    public void acknowledge(String acknowledgedBy, LocalDateTime acknowledgedAt) {
        acknowledge(acknowledgedBy, null, acknowledgedAt);
    }

    public boolean isAcknowledged() {
        return Boolean.TRUE.equals(this.isAcknowledged);
    }

    /**
     * Domain encapsulation: Calculates how far above the threshold limit the trigger reading was.
     */
    public double getExceedanceMargin() {
        if (this.triggerValuePpmHr == null || this.thresholdLimitPpmHr == null) {
            return 0.0;
        }
        return Math.max(0.0, this.triggerValuePpmHr - this.thresholdLimitPpmHr);
    }

    /**
     * Domain encapsulation: Checks if this alert is pending acknowledgment.
     */
    public boolean isUnacknowledged() {
        return !Boolean.TRUE.equals(this.isAcknowledged);
    }

    /**
     * Domain encapsulation: Checks if this alert is of critical severity.
     */
    public boolean isCriticalAlert() {
        return this.demoSeverity == DemoStatus.CRITICAL;
    }

    @Override
    public String getDataSource() {
        return "SIMULATED_ALERT_ENGINE";
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Alert alert = (Alert) o;
        return Objects.equals(id, alert.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
