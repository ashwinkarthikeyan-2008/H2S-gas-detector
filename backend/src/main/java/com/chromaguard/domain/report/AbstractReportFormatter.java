package com.chromaguard.domain.report;

import com.chromaguard.domain.ExposureReport;
import java.util.Objects;

/**
 * Abstract base class demonstrating:
 * - Inheritance and abstract classes in domain architecture
 * - The Template Method design pattern
 * - Enforcing algorithm skeleton and input invariant validation in a final template method
 */
public abstract class AbstractReportFormatter implements ReportFormatter {

    /**
     * Template method defining the standard report serialization workflow:
     * 1. Validates report presence and metadata invariants
     * 2. Calls subclass primitive {@link #renderReport(ExposureReport)}
     *
     * Marked {@code final} to prevent subclasses from circumventing invariant checks.
     */
    @Override
    public final String format(ExposureReport report) {
        Objects.requireNonNull(report, "ExposureReport model cannot be null for formatting");
        if (report.getReportId() == null || report.getReportId().isBlank()) {
            throw new IllegalArgumentException("Report ID must not be blank");
        }
        return renderReport(report);
    }

    /**
     * Primitive hook method overridden by polymorphic subclasses (CSV, JSON).
     *
     * @param report the pre-validated domain report
     * @return serialized presentation output
     */
    protected abstract String renderReport(ExposureReport report);
}
