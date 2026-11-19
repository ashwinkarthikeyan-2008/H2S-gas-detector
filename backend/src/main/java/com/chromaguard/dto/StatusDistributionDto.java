package com.chromaguard.dto;

public class StatusDistributionDto {
    private String status;
    private String displayName;
    private long count;
    private double percentage;
    private String color;

    public StatusDistributionDto() {
    }

    public StatusDistributionDto(String status, String displayName, long count, double percentage, String color) {
        this.status = status;
        this.displayName = displayName;
        this.count = count;
        this.percentage = percentage;
        this.color = color;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
