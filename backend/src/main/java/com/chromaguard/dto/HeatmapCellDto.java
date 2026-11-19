package com.chromaguard.dto;

public class HeatmapCellDto {
    private String zoneCode;
    private String zoneName;
    private String date;
    private double avgExposurePpmHr;
    private long recordCount;

    public HeatmapCellDto() {
    }

    public HeatmapCellDto(String zoneCode, String zoneName, String date, double avgExposurePpmHr, long recordCount) {
        this.zoneCode = zoneCode;
        this.zoneName = zoneName;
        this.date = date;
        this.avgExposurePpmHr = avgExposurePpmHr;
        this.recordCount = recordCount;
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

    public long getRecordCount() {
        return recordCount;
    }

    public void setRecordCount(long recordCount) {
        this.recordCount = recordCount;
    }
}
