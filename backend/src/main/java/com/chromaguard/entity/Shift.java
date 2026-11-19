package com.chromaguard.entity;

import com.chromaguard.domain.Identifiable;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "shifts")
public class Shift implements Identifiable<String> {

    @Id
    @Column(name = "shift_id", length = 32)
    private String id;

    @Column(name = "shift_name", nullable = false, length = 64)
    private String shiftName;

    @Column(name = "start_time", nullable = false, length = 16)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 16)
    private String endTime;

    @Column(name = "duration_hours", nullable = false)
    private Integer durationHours;

    public Shift() {
    }

    public Shift(String id, String shiftName, String startTime, String endTime, Integer durationHours) {
        this.id = id;
        this.shiftName = shiftName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.durationHours = durationHours;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getShiftName() {
        return shiftName;
    }

    public void setShiftName(String shiftName) {
        this.shiftName = shiftName;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public Integer getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }

    /**
     * Resolves the strongly-typed {@link ShiftType} matching this entity's shiftName.
     * Demonstrates encapsulation and bridge between JPA string mapping and rich domain enums.
     */
    public ShiftType getShiftType() {
        return ShiftType.fromShiftName(this.shiftName);
    }

    public boolean isNightShift() {
        return getShiftType().isNightShift();
    }


    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Shift shift = (Shift) o;
        return Objects.equals(id, shift.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
