package com.chromaguard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RegisterRequestDto {
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Name must be 100 characters or fewer")
    private String fullName;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 32, message = "Username must be between 3 and 32 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 10, max = 72, message = "Password must be between 10 and 72 characters")
    private String password;

    @NotNull(message = "Account type is required")
    private String role;

    private String zoneId;

    private String shiftId;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getZoneId() { return zoneId; }
    public void setZoneId(String zoneId) { this.zoneId = zoneId; }
    public String getShiftId() { return shiftId; }
    public void setShiftId(String shiftId) { this.shiftId = shiftId; }
}
