package com.chromaguard.dto;

public class LoginResponseDto {
    private String token;
    private String username;
    private String role;
    private String fullName;
    private String associatedWorkerId;
    private String message;
    private String email;
    private String phoneNumber;

    public LoginResponseDto() {
    }

    public LoginResponseDto(String token, String username, String role, String fullName, String associatedWorkerId, String message) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.fullName = fullName;
        this.associatedWorkerId = associatedWorkerId;
        this.message = message;
    }

    public LoginResponseDto(String token, String username, String role, String fullName, String associatedWorkerId,
                            String message, String email, String phoneNumber) {
        this(token, username, role, fullName, associatedWorkerId, message);
        this.email = email;
        this.phoneNumber = phoneNumber;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAssociatedWorkerId() {
        return associatedWorkerId;
    }

    public void setAssociatedWorkerId(String associatedWorkerId) {
        this.associatedWorkerId = associatedWorkerId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
