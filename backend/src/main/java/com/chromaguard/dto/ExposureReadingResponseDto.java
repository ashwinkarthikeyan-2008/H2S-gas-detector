package com.chromaguard.dto;

public class ExposureReadingResponseDto {
    private final ExposureRecordDto reading;
    private final AlertDto alert;
    private final boolean alertGenerated;

    public ExposureReadingResponseDto(ExposureRecordDto reading, AlertDto alert) {
        this.reading = reading;
        this.alert = alert;
        this.alertGenerated = alert != null;
    }

    public ExposureRecordDto getReading() { return reading; }
    public AlertDto getAlert() { return alert; }
    public boolean isAlertGenerated() { return alertGenerated; }
}
