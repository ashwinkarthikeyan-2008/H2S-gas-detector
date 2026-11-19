package com.chromaguard.dto;

public class ExposureRecordDto {
    private String id;
    private String workerId;
    private String workerName;
    private String zoneId;
    private String zoneCode;
    private String zoneName;
    private String shiftId;
    private String shiftName;
    private String timestamp;
    private int simulatedColorR;
    private int simulatedColorG;
    private int simulatedColorB;
    private double illustrativeExposureValue;
    private double illustrativeCumulativeDose;
    private String demoStatus;
    private String dataSource;
    private String datasetVersion;
    private String sourceDatasetJson;

    public ExposureRecordDto() {
    }

    public ExposureRecordDto(String id, String workerId, String workerName, String zoneId,
                             String zoneCode, String zoneName, String shiftId, String shiftName,
                             String timestamp, int simulatedColorR, int simulatedColorG,
                             int simulatedColorB, double illustrativeExposureValue,
                             double illustrativeCumulativeDose, String demoStatus,
                             String dataSource, String datasetVersion, String sourceDatasetJson) {
        this.id = id;
        this.workerId = workerId;
        this.workerName = workerName;
        this.zoneId = zoneId;
        this.zoneCode = zoneCode;
        this.zoneName = zoneName;
        this.shiftId = shiftId;
        this.shiftName = shiftName;
        this.timestamp = timestamp;
        this.simulatedColorR = simulatedColorR;
        this.simulatedColorG = simulatedColorG;
        this.simulatedColorB = simulatedColorB;
        this.illustrativeExposureValue = illustrativeExposureValue;
        this.illustrativeCumulativeDose = illustrativeCumulativeDose;
        this.demoStatus = demoStatus;
        this.dataSource = dataSource;
        this.datasetVersion = datasetVersion;
        this.sourceDatasetJson = sourceDatasetJson;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getWorkerId() {
        return workerId;
    }

    public void setWorkerId(String workerId) {
        this.workerId = workerId;
    }

    public String getWorkerName() {
        return workerName;
    }

    public void setWorkerName(String workerName) {
        this.workerName = workerName;
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

    public String getShiftId() {
        return shiftId;
    }

    public void setShiftId(String shiftId) {
        this.shiftId = shiftId;
    }

    public String getShiftName() {
        return shiftName;
    }

    public void setShiftName(String shiftName) {
        this.shiftName = shiftName;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public int getSimulatedColorR() {
        return simulatedColorR;
    }

    public void setSimulatedColorR(int simulatedColorR) {
        this.simulatedColorR = simulatedColorR;
    }

    public int getSimulatedColorG() {
        return simulatedColorG;
    }

    public void setSimulatedColorG(int simulatedColorG) {
        this.simulatedColorG = simulatedColorG;
    }

    public int getSimulatedColorB() {
        return simulatedColorB;
    }

    public void setSimulatedColorB(int simulatedColorB) {
        this.simulatedColorB = simulatedColorB;
    }

    public double getIllustrativeExposureValue() {
        return illustrativeExposureValue;
    }

    public void setIllustrativeExposureValue(double illustrativeExposureValue) {
        this.illustrativeExposureValue = illustrativeExposureValue;
    }

    public double getIllustrativeCumulativeDose() {
        return illustrativeCumulativeDose;
    }

    public void setIllustrativeCumulativeDose(double illustrativeCumulativeDose) {
        this.illustrativeCumulativeDose = illustrativeCumulativeDose;
    }

    public String getDemoStatus() {
        return demoStatus;
    }

    public void setDemoStatus(String demoStatus) {
        this.demoStatus = demoStatus;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public String getDatasetVersion() {
        return datasetVersion;
    }

    public void setDatasetVersion(String datasetVersion) {
        this.datasetVersion = datasetVersion;
    }

    public String getSourceDatasetJson() {
        return sourceDatasetJson;
    }

    public void setSourceDatasetJson(String sourceDatasetJson) {
        this.sourceDatasetJson = sourceDatasetJson;
    }
}
