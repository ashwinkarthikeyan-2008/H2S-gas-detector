package com.chromaguard.dto;

import java.util.List;

public class OutlierReportDto {
    private String variableName;
    private double q1;
    private double q3;
    private double iqr;
    private double lowerBound;
    private double upperBound;
    private long totalRecords;
    private long outlierCount;
    private double outlierPercentage;
    private List<ExposureRecordDto> outlierRecords;
    private String methodologyNotes;
    private String interpretationText;

    public OutlierReportDto() {
    }

    public OutlierReportDto(String variableName, double q1, double q3, double iqr,
                            double lowerBound, double upperBound, long totalRecords,
                            long outlierCount, double outlierPercentage,
                            List<ExposureRecordDto> outlierRecords, String methodologyNotes,
                            String interpretationText) {
        this.variableName = variableName;
        this.q1 = q1;
        this.q3 = q3;
        this.iqr = iqr;
        this.lowerBound = lowerBound;
        this.upperBound = upperBound;
        this.totalRecords = totalRecords;
        this.outlierCount = outlierCount;
        this.outlierPercentage = outlierPercentage;
        this.outlierRecords = outlierRecords;
        this.methodologyNotes = methodologyNotes;
        this.interpretationText = interpretationText;
    }

    public String getVariableName() {
        return variableName;
    }

    public void setVariableName(String variableName) {
        this.variableName = variableName;
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

    public double getLowerBound() {
        return lowerBound;
    }

    public void setLowerBound(double lowerBound) {
        this.lowerBound = lowerBound;
    }

    public double getUpperBound() {
        return upperBound;
    }

    public void setUpperBound(double upperBound) {
        this.upperBound = upperBound;
    }

    public long getTotalRecords() {
        return totalRecords;
    }

    public void setTotalRecords(long totalRecords) {
        this.totalRecords = totalRecords;
    }

    public long getOutlierCount() {
        return outlierCount;
    }

    public void setOutlierCount(long outlierCount) {
        this.outlierCount = outlierCount;
    }

    public double getOutlierPercentage() {
        return outlierPercentage;
    }

    public void setOutlierPercentage(double outlierPercentage) {
        this.outlierPercentage = outlierPercentage;
    }

    public List<ExposureRecordDto> getOutlierRecords() {
        return outlierRecords;
    }

    public void setOutlierRecords(List<ExposureRecordDto> outlierRecords) {
        this.outlierRecords = outlierRecords;
    }

    public String getMethodologyNotes() {
        return methodologyNotes;
    }

    public void setMethodologyNotes(String methodologyNotes) {
        this.methodologyNotes = methodologyNotes;
    }

    public String getInterpretationText() {
        return interpretationText;
    }

    public void setInterpretationText(String interpretationText) {
        this.interpretationText = interpretationText;
    }
}
