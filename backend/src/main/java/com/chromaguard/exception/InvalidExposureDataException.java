package com.chromaguard.exception;

/**
 * Domain-specific exception thrown when a numerical exposure measurement
 * or optical sensor reading violates physical or model constraints.
 * Extends {@link ChromaGuardDomainException} as part of the domain exception hierarchy.
 */
public class InvalidExposureDataException extends ChromaGuardDomainException {

    public static final String ERROR_CODE = "ERR_INVALID_EXPOSURE_DATA";

    private final String fieldName;
    private final Object rejectedValue;

    public InvalidExposureDataException(String fieldName, Object rejectedValue, String message) {
        super(ERROR_CODE, String.format("Invalid exposure data on '%s' [value: %s]: %s", fieldName, rejectedValue, message));
        this.fieldName = fieldName;
        this.rejectedValue = rejectedValue;
    }


    public String getFieldName() {
        return fieldName;
    }

    public Object getRejectedValue() {
        return rejectedValue;
    }
}
