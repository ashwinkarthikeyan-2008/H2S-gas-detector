package com.chromaguard.domain.report;

import com.chromaguard.domain.ExposureReport;

/**
 * Strategy interface demonstrating polymorphism for rendering
 * domain {@link ExposureReport} models into diverse presentation formats.
 */
public interface ReportFormatter {

    /**
     * Formats the given domain report into a specific string output format.
     *
     * @param report the domain exposure report
     * @return serialized text representation
     */
    String format(ExposureReport report);

    /**
     * @return standard MIME content type (e.g., application/json, text/csv)
     */
    String getContentType();
}
