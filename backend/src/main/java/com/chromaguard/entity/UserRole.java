package com.chromaguard.entity;

/**
 * Role-Based Access Control (RBAC) enumeration.
 * Demonstrates Java rich enums with state, constructor, and domain capability checks.
 */
public enum UserRole {
    ROLE_ADMIN("Plant Safety Director", true, true),
    ROLE_WORKER("Field Operations Specialist", false, false),
    ROLE_AUDITOR("External Academic Reviewer", false, false);

    private final String title;
    private final boolean canAcknowledgeAlerts;
    private final boolean canResetSystem;

    UserRole(String title, boolean canAcknowledgeAlerts, boolean canResetSystem) {
        this.title = title;
        this.canAcknowledgeAlerts = canAcknowledgeAlerts;
        this.canResetSystem = canResetSystem;
    }

    public String getTitle() {
        return title;
    }

    public boolean canAcknowledgeAlerts() {
        return canAcknowledgeAlerts;
    }

    public boolean canResetSystem() {
        return canResetSystem;
    }
}
