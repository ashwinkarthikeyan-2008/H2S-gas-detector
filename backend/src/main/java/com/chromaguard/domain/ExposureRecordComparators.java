package com.chromaguard.domain;

import com.chromaguard.entity.ExposureRecord;
import java.util.Comparator;

/**
 * Reusable Comparator strategies for {@link ExposureRecord}.
 * Demonstrates:
 * - Difference between Comparable (natural ordering) and Comparator (alternative strategies)
 * - Method references (ExposureRecord::getIllustrativeExposureValue)
 * - Lambda expressions
 * - Chained sorting criteria via Comparator.thenComparing
 * - Null-safe reverse orderings
 */
public final class ExposureRecordComparators {

    private ExposureRecordComparators() {
        // Suppress default constructor for non-instantiable utility class
    }

    /**
     * Sorts exposure records by illustrative exposure value in descending order (highest hazard first).
     */
    public static final Comparator<ExposureRecord> BY_EXPOSURE_DESC =
            Comparator.comparingDouble(ExposureRecord::getIllustrativeExposureValue).reversed()
                    .thenComparing(ExposureRecord::getId);

    /**
     * Sorts exposure records by cumulative dose in descending order.
     */
    public static final Comparator<ExposureRecord> BY_CUMULATIVE_DOSE_DESC =
            Comparator.comparingDouble(ExposureRecord::getIllustrativeCumulativeDose).reversed()
                    .thenComparing(ExposureRecord::getId);

    /**
     * Sorts exposure records by timestamp in descending order (newest telemetry first).
     */
    public static final Comparator<ExposureRecord> BY_TIMESTAMP_DESC =
            Comparator.comparing(ExposureRecord::getTimestamp).reversed()
                    .thenComparing(ExposureRecord::getId);

    /**
     * Multi-criteria sorting: Groups records alphabetically by Worker name, then chronologically by timestamp.
     */
    public static final Comparator<ExposureRecord> BY_WORKER_THEN_TIMESTAMP =
            Comparator.comparing((ExposureRecord r) -> r.getWorker().getSyntheticName())
                    .thenComparing(ExposureRecord::getTimestamp)
                    .thenComparing(ExposureRecord::getId);

    /**
     * Sorts by demo severity rank descending, then exposure value descending.
     */
    public static final Comparator<ExposureRecord> BY_SEVERITY_THEN_EXPOSURE =
            Comparator.comparing((ExposureRecord r) -> r.getDemoStatus().getSeverityRank()).reversed()
                    .thenComparing(Comparator.comparingDouble(ExposureRecord::getIllustrativeExposureValue).reversed())
                    .thenComparing(ExposureRecord::getId);
}
