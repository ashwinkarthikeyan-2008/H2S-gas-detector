package com.chromaguard.dto;

public class HistogramBinDto {
    private String binLabel;
    private double binMin;
    private double binMax;
    private long count;

    public HistogramBinDto() {
    }

    public HistogramBinDto(String binLabel, double binMin, double binMax, long count) {
        this.binLabel = binLabel;
        this.binMin = binMin;
        this.binMax = binMax;
        this.count = count;
    }

    public String getBinLabel() {
        return binLabel;
    }

    public void setBinLabel(String binLabel) {
        this.binLabel = binLabel;
    }

    public double getBinMin() {
        return binMin;
    }

    public void setBinMin(double binMin) {
        this.binMin = binMin;
    }

    public double getBinMax() {
        return binMax;
    }

    public void setBinMax(double binMax) {
        this.binMax = binMax;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
