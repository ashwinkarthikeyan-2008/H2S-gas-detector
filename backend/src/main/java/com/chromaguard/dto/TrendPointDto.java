package com.chromaguard.dto;

public class TrendPointDto {
    private String date;
    private double avgExposurePpmHr;
    private double maxExposurePpmHr;
    private long recordCount;
    private long warningCount;
    private long criticalCount;

    public TrendPointDto() {
    }

    public TrendPointDto(String date, double avgExposurePpmHr, double maxExposurePpmHr,
                         long recordCount, long warningCount, long criticalCount) {
        this.date = date;
        this.avgExposurePpmHr = avgExposurePpmHr;
        this.maxExposurePpmHr = maxExposurePpmHr;
        this.recordCount = recordCount;
        this.warningCount = warningCount;
        this.criticalCount = criticalCount;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
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

    public long getRecordCount() {
        return recordCount;
    }

    public void setRecordCount(long recordCount) {
        this.recordCount = recordCount;
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
