package com.chromaguard.entity;

import com.chromaguard.domain.Identifiable;
import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "user_accounts")
public class UserAccount implements Identifiable<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", unique = true, nullable = false, length = 64)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 128)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 32)
    private UserRole role;

    @Column(name = "full_name", nullable = false, length = 128)
    private String fullName;

    @Column(name = "worker_id", length = 32)
    private String associatedWorkerId;

    @Column(name = "email", length = 254)
    private String email;

    @Column(name = "phone_number", length = 32)
    private String phoneNumber;


    public UserAccount() {
    }

    public UserAccount(String username, String passwordHash, UserRole role, String fullName, String associatedWorkerId) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.fullName = fullName;
        this.associatedWorkerId = associatedWorkerId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
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

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserAccount that = (UserAccount) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
