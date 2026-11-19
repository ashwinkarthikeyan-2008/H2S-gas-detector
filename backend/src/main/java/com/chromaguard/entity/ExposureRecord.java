package com.chromaguard.entity;

import com.chromaguard.domain.Auditable;
import com.chromaguard.domain.Identifiable;
import com.chromaguard.exception.InvalidExposureDataException;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "exposure_records", indexes = {
    @Index(name = "idx_record_timestamp", columnList = "record_timestamp"),
    @Index(name = "idx_record_worker", columnList = "worker_id"),
    @Index(name = "idx_record_zone", columnList = "zone_id"),
    @Index(name = "idx_record_status", columnList = "demo_status")
})
public class ExposureRecord implements Identifiable<String>, Auditable, Comparable<ExposureRecord> {


    @Id
    @Column(name = "record_id", length = 32)
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "worker_id", nullable = false)
    private Worker worker;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "zone_id", nullable = false)
    private IndustrialZone zone;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @Column(name = "record_timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "simulated_color_r", nullable = false)
    private Integer simulatedColorR;

    @Column(name = "simulated_color_g", nullable = false)
    private Integer simulatedColorG;

    @Column(name = "simulated_color_b", nullable = false)
    private Integer simulatedColorB;

    /**
     * Illustrative exposure measurement expressed in ppm·hr.
     * Simulated test parameter for demonstration only.
     */
    @Column(name = "illustrative_exposure_value", nullable = false)
    private Double illustrativeExposureValue;

    /**
     * Illustrative cumulative dose calculation.
     */
    @Column(name = "illustrative_cumulative_dose", nullable = false)
    private Double illustrativeCumulativeDose;

    @Enumerated(EnumType.STRING)
    @Column(name = "demo_status", nullable = false, length = 16)
    private DemoStatus demoStatus;

    @Column(name = "data_source", nullable = false, length = 64)
    private String dataSource;

    @Column(name = "dataset_version", nullable = false, length = 32)
    private String datasetVersion;

    @Lob
    @Column(name = "source_dataset_json")
    private String sourceDatasetJson;

    public ExposureRecord() {
    }

    public ExposureRecord(String id, Worker worker, IndustrialZone zone, Shift shift,
                          LocalDateTime timestamp, Integer simulatedColorR, Integer simulatedColorG,
                          Integer simulatedColorB, Double illustrativeExposureValue,
                          Double illustrativeCumulativeDose, DemoStatus demoStatus,
                          String dataSource, String datasetVersion) {
        validateExposure(illustrativeExposureValue);
        validateColor("simulatedColorR", simulatedColorR);
        validateColor("simulatedColorG", simulatedColorG);
        validateColor("simulatedColorB", simulatedColorB);

        this.id = id;
        this.worker = worker;
        this.zone = zone;
        this.shift = shift;
        this.timestamp = timestamp;
        this.simulatedColorR = simulatedColorR;
        this.simulatedColorG = simulatedColorG;
        this.simulatedColorB = simulatedColorB;
        this.illustrativeExposureValue = illustrativeExposureValue;
        this.illustrativeCumulativeDose = illustrativeCumulativeDose;
        this.demoStatus = demoStatus;
        this.dataSource = dataSource;
        this.datasetVersion = datasetVersion;
    }

    private void validateExposure(Double val) {
        if (val != null && val < 0.0) {
            throw new InvalidExposureDataException("illustrativeExposureValue", val, "Exposure value must be non-negative");
        }
    }

    private void validateColor(String name, Integer c) {
        if (c != null && (c < 0 || c > 255)) {
            throw new InvalidExposureDataException(name, c, "RGB channel value must be within [0, 255]");
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Worker getWorker() {
        return worker;
    }

    public void setWorker(Worker worker) {
        this.worker = worker;
    }

    public IndustrialZone getZone() {
        return zone;
    }

    public void setZone(IndustrialZone zone) {
        this.zone = zone;
    }

    public Shift getShift() {
        return shift;
    }

    public void setShift(Shift shift) {
        this.shift = shift;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Integer getSimulatedColorR() {
        return simulatedColorR;
    }

    public void setSimulatedColorR(Integer simulatedColorR) {
        this.simulatedColorR = simulatedColorR;
    }

    public Integer getSimulatedColorG() {
        return simulatedColorG;
    }

    public void setSimulatedColorG(Integer simulatedColorG) {
        this.simulatedColorG = simulatedColorG;
    }

    public Integer getSimulatedColorB() {
        return simulatedColorB;
    }

    public void setSimulatedColorB(Integer simulatedColorB) {
        this.simulatedColorB = simulatedColorB;
    }

    public Double getIllustrativeExposureValue() {
        return illustrativeExposureValue;
    }

    public void setIllustrativeExposureValue(Double illustrativeExposureValue) {
        this.illustrativeExposureValue = illustrativeExposureValue;
    }

    public Double getIllustrativeCumulativeDose() {
        return illustrativeCumulativeDose;
    }

    public void setIllustrativeCumulativeDose(Double illustrativeCumulativeDose) {
        this.illustrativeCumulativeDose = illustrativeCumulativeDose;
    }

    public DemoStatus getDemoStatus() {
        return demoStatus;
    }

    public void setDemoStatus(DemoStatus demoStatus) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ExposureRecord that = (ExposureRecord) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    /**
     * Natural chronological ordering: Sorts primarily by timestamp, tie-broken by record ID.
     * Demonstrates implementation of the Comparable<T> interface.
     */
    @Override
    public int compareTo(ExposureRecord other) {
        if (other == null) return 1;
        int timeCompare = this.timestamp.compareTo(other.timestamp);
        if (timeCompare != 0) {
            return timeCompare;
        }
        return this.id.compareTo(other.id);
    }

    /**
     * Encapsulated domain logic: checks whether this record exceeded a given regulatory threshold limit.
     */
    public boolean isExceedingThreshold(double thresholdPpmHr) {
        return this.illustrativeExposureValue != null && this.illustrativeExposureValue >= thresholdPpmHr;
    }

    /**
     * Encapsulated domain logic: calculates simulated photometric optical darkness index [0, 255].
     * Demonstrates encapsulation of optical badge physics calculations within the domain entity.
     */
    public int getPhotometricDarknessIndex() {
        int avgRgb = (this.simulatedColorR + this.simulatedColorG + this.simulatedColorB) / 3;
        return Math.max(0, 255 - avgRgb);
    }
}

