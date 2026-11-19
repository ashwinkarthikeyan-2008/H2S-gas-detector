package com.chromaguard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Email;

public class AdminProfileUpdateDto {
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Name must be 100 characters or fewer")
    private String fullName;

    @NotBlank(message = "Admin ID is required")
    @Size(min = 3, max = 32, message = "Admin ID must be between 3 and 32 characters")
    @Pattern(regexp = "[a-zA-Z0-9._-]+", message = "Admin ID may use letters, numbers, dot, underscore, and hyphen")
    private String username;

    @Email(message = "Enter a valid email address")
    @Size(max = 254, message = "Email must be 254 characters or fewer")
    private String email;

    @Size(max = 32, message = "Phone number must be 32 characters or fewer")
    private String phoneNumber;


    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
