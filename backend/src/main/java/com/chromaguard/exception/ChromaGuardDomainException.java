package com.chromaguard.exception;

import java.time.LocalDateTime;

/**
 * Abstract base exception for all ChromaGuard business logic and domain rule violations.
 * Demonstrates:
 * - Inheritance in exception hierarchies (subclassing RuntimeException)
 * - Encapsulation of domain error metadata (error code, creation timestamp)
 * - Polymorphic exception handling across Spring controllers and service layers
 */
public abstract class ChromaGuardDomainException extends RuntimeException {

    private final String errorCode;
    private final LocalDateTime timestamp;

    protected ChromaGuardDomainException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.timestamp = LocalDateTime.now();
    }

    protected ChromaGuardDomainException(String errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.timestamp = LocalDateTime.now();
    }

    public String getErrorCode() {
        return errorCode;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
}
