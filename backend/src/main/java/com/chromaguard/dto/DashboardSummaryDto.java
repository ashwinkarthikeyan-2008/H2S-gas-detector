package com.chromaguard.dto;

public class DashboardSummaryDto {
    private long totalWorkers;
    private long totalRecords;
    private double avgExposurePpmHr;
    private double maxExposurePpmHr;
    private double minExposurePpmHr;
    private long warningRecords;
    private long criticalRecords;
    private long elevatedRecords;
    private long normalRecords;
    private long totalAlerts;
    private long unacknowledgedAlerts;
    private String simulatedMode;

    public DashboardSummaryDto() {
    }

    public DashboardSummaryDto(long totalWorkers, long totalRecords, double avgExposurePpmHr,
                               double maxExposurePpmHr, double minExposurePpmHr, long warningRecords,
                               long criticalRecords, long elevatedRecords, long normalRecords,
                               long totalAlerts, long unacknowledgedAlerts, String simulatedMode) {
        this.totalWorkers = totalWorkers;
        this.totalRecords = totalRecords;
        this.avgExposurePpmHr = avgExposurePpmHr;
        this.maxExposurePpmHr = maxExposurePpmHr;
        this.minExposurePpmHr = minExposurePpmHr;
        this.warningRecords = warningRecords;
        this.criticalRecords = criticalRecords;
        this.elevatedRecords = elevatedRecords;
        this.normalRecords = normalRecords;
        this.totalAlerts = totalAlerts;
        this.unacknowledgedAlerts = unacknowledgedAlerts;
        this.simulatedMode = simulatedMode;
    }

    public long getTotalWorkers() {
        return totalWorkers;
    }

    public void setTotalWorkers(long totalWorkers) {
        this.totalWorkers = totalWorkers;
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

    public double getMinExposurePpmHr() {
        return minExposurePpmHr;
    }

    public void setMinExposurePpmHr(double minExposurePpmHr) {
        this.minExposurePpmHr = minExposurePpmHr;
    }

    public long getWarningRecords() {
        return warningRecords;
    }

    public void setWarningRecords(long warningRecords) {
        this.warningRecords = warningRecords;
    }

    public long getCriticalRecords() {
        return criticalRecords;
    }

    public void setCriticalRecords(long criticalRecords) {
        this.criticalRecords = criticalRecords;
    }

    public long getElevatedRecords() {
        return elevatedRecords;
    }

    public void setElevatedRecords(long elevatedRecords) {
        this.elevatedRecords = elevatedRecords;
    }

    public long getNormalRecords() {
        return normalRecords;
    }

    public void setNormalRecords(long normalRecords) {
        this.normalRecords = normalRecords;
    }

    public long getTotalAlerts() {
        return totalAlerts;
    }

    public void setTotalAlerts(long totalAlerts) {
        this.totalAlerts = totalAlerts;
    }

    public long getUnacknowledgedAlerts() {
        return unacknowledgedAlerts;
    }

    public void setUnacknowledgedAlerts(long unacknowledgedAlerts) {
        this.unacknowledgedAlerts = unacknowledgedAlerts;
    }

    public String getSimulatedMode() {
        return simulatedMode;
    }

    public void setSimulatedMode(String simulatedMode) {
        this.simulatedMode = simulatedMode;
    }
}
