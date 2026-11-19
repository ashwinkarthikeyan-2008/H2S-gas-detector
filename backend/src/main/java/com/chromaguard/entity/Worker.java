package com.chromaguard.entity;

import com.chromaguard.domain.Identifiable;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "workers")
public class Worker implements Identifiable<String> {

    @Id
    @Column(name = "worker_id", length = 32)
    private String id;

    @Column(name = "synthetic_name", nullable = false, length = 128)
    private String syntheticName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_zone_id", nullable = false)
    private IndustrialZone assignedZone;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "preferred_shift_id", nullable = false)
    private Shift preferredShift;

    @Column(name = "role", nullable = false, length = 128)
    private String role;

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears;

    @Column(name = "badge_id", nullable = false, length = 64)
    private String badgeId;

    public Worker() {
    }

    public Worker(String id, String syntheticName, IndustrialZone assignedZone, Shift preferredShift, String role, Integer experienceYears, String badgeId) {
        this.id = id;
        this.syntheticName = syntheticName;
        this.assignedZone = assignedZone;
        this.preferredShift = preferredShift;
        this.role = role;
        this.experienceYears = experienceYears;
        this.badgeId = badgeId;
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

    public IndustrialZone getAssignedZone() {
        return assignedZone;
    }

    public void setAssignedZone(IndustrialZone assignedZone) {
        this.assignedZone = assignedZone;
    }

    public Shift getPreferredShift() {
        return preferredShift;
    }

    public void setPreferredShift(Shift preferredShift) {
        this.preferredShift = preferredShift;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getBadgeId() {
        return badgeId;
    }

    public void setBadgeId(String badgeId) {
        this.badgeId = badgeId;
    }

    /**
     * Domain encapsulation: Checks if worker has senior technician tenure (>= 5 years).
     */
    public boolean isSeniorPersonnel() {
        return this.experienceYears != null && this.experienceYears >= 5;
    }

    /**
     * Domain encapsulation: Checks if worker is stationed in a specific industrial zone.
     */
    public boolean isStationedIn(String zoneId) {
        return this.assignedZone != null && this.assignedZone.getId().equals(zoneId);
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Worker worker = (Worker) o;
        return Objects.equals(id, worker.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
