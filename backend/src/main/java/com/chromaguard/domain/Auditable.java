package com.chromaguard.domain;

import java.time.LocalDateTime;

/**
 * Interface for time-series and event models that maintain an acquisition timestamp
 * and dataset provenance tracking.
 */
public interface Auditable {

    /**
     * @return the temporal point of record capture or event trigger
     */
    LocalDateTime getTimestamp();

    /**
     * @return origin marker describing data source provenance
     */
    String getDataSource();
}
