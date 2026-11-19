package com.chromaguard.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "live_sensor_readings", indexes = {
        @Index(name = "idx_live_sensor_worker_time", columnList = "worker_id, reading_timestamp")
})
public class LiveSensorReading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @Column(name = "reading_timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "h2s_ppm")
    private Double h2sPpm;

    @Column(name = "mq2_raw")
    private Double mq2Raw;

    @Column(name = "mq2_ppm")
    private Double mq2Ppm;

    @Column(name = "temperature_c")
    private Double temperatureC;

    @Column(name = "humidity_percent")
    private Double humidityPercent;

    @Column(name = "battery_percent")
    private Double batteryPercent;

    protected LiveSensorReading() {
    }

    public LiveSensorReading(Worker worker, LocalDateTime timestamp, Double h2sPpm, Double mq2Raw,
                             Double mq2Ppm, Double temperatureC, Double humidityPercent, Double batteryPercent) {
        this.worker = worker;
        this.timestamp = timestamp;
        this.h2sPpm = h2sPpm;
        this.mq2Raw = mq2Raw;
        this.mq2Ppm = mq2Ppm;
        this.temperatureC = temperatureC;
        this.humidityPercent = humidityPercent;
        this.batteryPercent = batteryPercent;
    }

    public Long getId() { return id; }
    public Worker getWorker() { return worker; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public Double getH2sPpm() { return h2sPpm; }
    public Double getMq2Raw() { return mq2Raw; }
    public Double getMq2Ppm() { return mq2Ppm; }
    public Double getTemperatureC() { return temperatureC; }
    public Double getHumidityPercent() { return humidityPercent; }
    public Double getBatteryPercent() { return batteryPercent; }
}
