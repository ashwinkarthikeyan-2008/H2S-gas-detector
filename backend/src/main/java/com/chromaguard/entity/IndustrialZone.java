package com.chromaguard.entity;

import com.chromaguard.domain.Identifiable;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "industrial_zones")
public class IndustrialZone implements Identifiable<String> {

    @Id
    @Column(name = "zone_id", length = 32)
    private String id;

    @Column(name = "zone_code", nullable = false, length = 16)
    private String zoneCode;

    @Column(name = "zone_name", nullable = false, length = 128)
    private String zoneName;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_tier", nullable = false, length = 16)
    private RiskTier riskTier;

    @Column(name = "baseline_exposure_ppm_hr", nullable = false)
    private Double baselineExposurePpmHr;

    @Column(name = "description", length = 512)
    private String description;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public IndustrialZone() {
    }

    public IndustrialZone(String id, String zoneCode, String zoneName, RiskTier riskTier, Double baselineExposurePpmHr, String description) {
        this.id = id;
        this.zoneCode = zoneCode;
        this.zoneName = zoneName;
        this.riskTier = riskTier;
        this.baselineExposurePpmHr = baselineExposurePpmHr;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public RiskTier getRiskTier() {
        return riskTier;
    }

    public void setRiskTier(RiskTier riskTier) {
        this.riskTier = riskTier;
    }

    public Double getBaselineExposurePpmHr() {
        return baselineExposurePpmHr;
    }

    public void setBaselineExposurePpmHr(Double baselineExposurePpmHr) {
        this.baselineExposurePpmHr = baselineExposurePpmHr;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isActive() { return active; }

    public void setActive(boolean active) { this.active = active; }

    /**
     * Domain encapsulation: Checks if an observed exposure level exceeds this zone's baseline limit.
     */
    public boolean isExceedingBaseline(double observedExposurePpmHr) {
        return this.baselineExposurePpmHr != null && observedExposurePpmHr > this.baselineExposurePpmHr;
    }

    /**
     * Domain encapsulation: Calculates percentage of baseline excess (e.g. +25.0%).
     */
    public double calculateExcessPercentage(double observedExposurePpmHr) {
        if (this.baselineExposurePpmHr == null || this.baselineExposurePpmHr == 0.0) {
            return 0.0;
        }
        return ((observedExposurePpmHr - this.baselineExposurePpmHr) / this.baselineExposurePpmHr) * 100.0;
    }

    /**
     * Domain encapsulation: High or Critical risk classification helper.
     */
    public boolean isHighOrCritical() {
        return this.riskTier != null && this.riskTier.isHighOrCritical();
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        IndustrialZone that = (IndustrialZone) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
