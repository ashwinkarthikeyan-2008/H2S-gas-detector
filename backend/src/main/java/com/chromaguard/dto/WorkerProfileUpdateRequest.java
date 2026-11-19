package com.chromaguard.dto;

public class WorkerProfileUpdateRequest {
    private String syntheticName;
    private String role;
    private Integer experienceYears;
    private String badgeId;

    public String getSyntheticName() { return syntheticName; }
    public void setSyntheticName(String syntheticName) { this.syntheticName = syntheticName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public String getBadgeId() { return badgeId; }
    public void setBadgeId(String badgeId) { this.badgeId = badgeId; }
}
