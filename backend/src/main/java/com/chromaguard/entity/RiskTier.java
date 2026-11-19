package com.chromaguard.entity;

/**
 * Environmental risk classification for industrial zones.
 * Demonstrates Java rich enum with risk multipliers and safety classification helpers.
 */
public enum RiskTier {
    LOW(1.0, "Minimal atmospheric H2S accumulation risk"),
    MEDIUM(1.5, "Moderate operational risk; routine monitoring required"),
    HIGH(2.5, "Elevated risk; frequent sensor calibration required"),
    CRITICAL(4.0, "High hazard zone; continuous personal dosimeter monitoring mandated");

    private final double riskMultiplier;
    private final String description;

    RiskTier(double riskMultiplier, String description) {
        this.riskMultiplier = riskMultiplier;
        this.description = description;
    }

    public double getRiskMultiplier() {
        return riskMultiplier;
    }

    public String getDescription() {
        return description;
    }

    public boolean isHighOrCritical() {
        return this == HIGH || this == CRITICAL;
    }
}
