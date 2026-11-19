package com.chromaguard.dto;

public class LiveSensorReadingDto {
    private Long id;
    private String workerId;
    private String workerName;
    private String timestamp;
    private Double h2sPpm;
    private Double mq2Raw;
    private Double mq2Ppm;
    private Double temperatureC;
    private Double humidityPercent;
    private Double batteryPercent;

    public LiveSensorReadingDto() {
    }

    public LiveSensorReadingDto(Long id, String workerId, String workerName, String timestamp, Double h2sPpm,
                                Double mq2Raw, Double mq2Ppm, Double temperatureC, Double humidityPercent,
                                Double batteryPercent) {
        this.id = id;
        this.workerId = workerId;
        this.workerName = workerName;
        this.timestamp = timestamp;
        this.h2sPpm = h2sPpm;
        this.mq2Raw = mq2Raw;
        this.mq2Ppm = mq2Ppm;
        this.temperatureC = temperatureC;
        this.humidityPercent = humidityPercent;
        this.batteryPercent = batteryPercent;
    }

    public Long getId() { return id; }
    public String getWorkerId() { return workerId; }
    public String getWorkerName() { return workerName; }
    public String getTimestamp() { return timestamp; }
    public Double getH2sPpm() { return h2sPpm; }
    public Double getMq2Raw() { return mq2Raw; }
    public Double getMq2Ppm() { return mq2Ppm; }
    public Double getTemperatureC() { return temperatureC; }
    public Double getHumidityPercent() { return humidityPercent; }
    public Double getBatteryPercent() { return batteryPercent; }
}
