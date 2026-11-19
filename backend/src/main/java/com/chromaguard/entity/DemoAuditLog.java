package com.chromaguard.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "demo_audit_logs")
public class DemoAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", nullable = false, length = 64)
    private String actionType;

    @Column(name = "details", nullable = false, length = 512)
    private String details;

    @Column(name = "executed_by", nullable = false, length = 128)
    private String executedBy;

    @Column(name = "logged_at", nullable = false)
    private LocalDateTime loggedAt;

    public DemoAuditLog() {
    }

    public DemoAuditLog(String actionType, String details, String executedBy, LocalDateTime loggedAt) {
        this.actionType = actionType;
        this.details = details;
        this.executedBy = executedBy;
        this.loggedAt = loggedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getExecutedBy() {
        return executedBy;
    }

    public void setExecutedBy(String executedBy) {
        this.executedBy = executedBy;
    }

    public LocalDateTime getLoggedAt() {
        return loggedAt;
    }

    public void setLoggedAt(LocalDateTime loggedAt) {
        this.loggedAt = loggedAt;
    }
}
