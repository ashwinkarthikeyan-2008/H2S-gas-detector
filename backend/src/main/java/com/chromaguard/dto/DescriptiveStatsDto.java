package com.chromaguard.dto;

public class DescriptiveStatsDto {
    private String variableName;
    private String unit;
    private long count;
    private double mean;
    private double median;
    private double stdDev;
    private double variance;
    private double min;
    private double max;
    private double q1;
    private double q3;
    private double iqr;

    public DescriptiveStatsDto() {
    }

    public DescriptiveStatsDto(String variableName, String unit, long count, double mean,
                               double median, double stdDev, double variance, double min,
                               double max, double q1, double q3, double iqr) {
        this.variableName = variableName;
        this.unit = unit;
        this.count = count;
        this.mean = mean;
        this.median = median;
        this.stdDev = stdDev;
        this.variance = variance;
        this.min = min;
        this.max = max;
        this.q1 = q1;
        this.q3 = q3;
        this.iqr = iqr;
    }

    public String getVariableName() {
        return variableName;
    }

    public void setVariableName(String variableName) {
        this.variableName = variableName;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }

    public double getMean() {
        return mean;
    }

    public void setMean(double mean) {
        this.mean = mean;
    }

    public double getMedian() {
        return median;
    }

    public void setMedian(double median) {
        this.median = median;
    }

    public double getStdDev() {
        return stdDev;
    }

    public void setStdDev(double stdDev) {
        this.stdDev = stdDev;
    }

    public double getVariance() {
        return variance;
    }

    public void setVariance(double variance) {
        this.variance = variance;
    }

    public double getMin() {
        return min;
    }

    public void setMin(double min) {
        this.min = min;
    }

    public double getMax() {
        return max;
    }

    public void setMax(double max) {
        this.max = max;
    }

    public double getQ1() {
        return q1;
    }

    public void setQ1(double q1) {
        this.q1 = q1;
    }

    public double getQ3() {
        return q3;
    }

    public void setQ3(double q3) {
        this.q3 = q3;
    }

    public double getIqr() {
        return iqr;
    }

    public void setIqr(double iqr) {
        this.iqr = iqr;
    }
}
