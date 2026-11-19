package com.chromaguard.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LiveSensorReadingRequestDto {
    @NotBlank
    @Size(max = 32)
    private String workerId;

    @DecimalMin("0.0")
    private Double h2sPpm;

    @DecimalMin("0.0")
    private Double mq2Raw;

    @DecimalMin("0.0")
    private Double mq2Ppm;

    @DecimalMin("-80.0")
    @DecimalMax("150.0")
    private Double temperatureC;

    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Double humidityPercent;

    @DecimalMin("0.0")
    @DecimalMax("100.0")
    private Double batteryPercent;

    public String getWorkerId() { return workerId; }
    public void setWorkerId(String workerId) { this.workerId = workerId; }
    public Double getH2sPpm() { return h2sPpm; }
    public void setH2sPpm(Double h2sPpm) { this.h2sPpm = h2sPpm; }
    public Double getMq2Raw() { return mq2Raw; }
    public void setMq2Raw(Double mq2Raw) { this.mq2Raw = mq2Raw; }
    public Double getMq2Ppm() { return mq2Ppm; }
    public void setMq2Ppm(Double mq2Ppm) { this.mq2Ppm = mq2Ppm; }
    public Double getTemperatureC() { return temperatureC; }
    public void setTemperatureC(Double temperatureC) { this.temperatureC = temperatureC; }
    public Double getHumidityPercent() { return humidityPercent; }
    public void setHumidityPercent(Double humidityPercent) { this.humidityPercent = humidityPercent; }
    public Double getBatteryPercent() { return batteryPercent; }
    public void setBatteryPercent(Double batteryPercent) { this.batteryPercent = batteryPercent; }

    public boolean hasSensorValue() {
        return h2sPpm != null || mq2Raw != null || mq2Ppm != null || temperatureC != null
                || humidityPercent != null || batteryPercent != null;
    }
}
