package com.chromaguard.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

/** A measured cumulative dose sample submitted by a worker device or administrator. */
public class ExposureReadingRequestDto {
    private String workerId;
    private String zoneId;
    private String shiftId;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    private Double dosePpmHr;

    public String getWorkerId() { return workerId; }
    public void setWorkerId(String workerId) { this.workerId = workerId; }
    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }
    public String getShiftId() { return shiftId; }
    public void setShiftId(String shiftId) { this.shiftId = shiftId; }
    public Double getDosePpmHr() { return dosePpmHr; }
    public void setDosePpmHr(Double dosePpmHr) { this.dosePpmHr = dosePpmHr; }
}
