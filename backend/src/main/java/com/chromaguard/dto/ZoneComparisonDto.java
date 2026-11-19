package com.chromaguard.dto;

public class ZoneComparisonDto {
    private String zoneId;
    private String zoneCode;
    private String zoneName;
    private String riskTier;
    private double baselineExposure;
    private double avgExposurePpmHr;
    private double maxExposurePpmHr;
    private long recordCount;
    private long alertCount;

    public ZoneComparisonDto() {
    }

    public ZoneComparisonDto(String zoneId, String zoneCode, String zoneName, String riskTier,
                             double baselineExposure, double avgExposurePpmHr, double maxExposurePpmHr,
                             long recordCount, long alertCount) {
        this.zoneId = zoneId;
        this.zoneCode = zoneCode;
        this.zoneName = zoneName;
        this.riskTier = riskTier;
        this.baselineExposure = baselineExposure;
        this.avgExposurePpmHr = avgExposurePpmHr;
        this.maxExposurePpmHr = maxExposurePpmHr;
        this.recordCount = recordCount;
        this.alertCount = alertCount;
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

    public String getRiskTier() {
        return riskTier;
    }

    public void setRiskTier(String riskTier) {
        this.riskTier = riskTier;
    }

    public double getBaselineExposure() {
        return baselineExposure;
    }

    public void setBaselineExposure(double baselineExposure) {
        this.baselineExposure = baselineExposure;
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

    public long getAlertCount() {
        return alertCount;
    }

    public void setAlertCount(long alertCount) {
        this.alertCount = alertCount;
    }
}
