package com.chromaguard.util;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Utility class demonstrating modern Java 8+ Date and Time API (java.time) concepts.
 * Replaces legacy java.util.Date / Calendar with immutable, thread-safe temporal abstractions
 * such as LocalDateTime, LocalDate, LocalTime, Duration, and ChronoUnit.
 */
public final class TemporalAnalyticsUtil {

    private TemporalAnalyticsUtil() {
        // Utility class private constructor prevents instantiation
    }

    /**
     * Calculates the exact duration in decimal hours between two LocalDateTime instances.
     * Demonstrates Duration and ChronoUnit calculations.
     */
    public static double calculateHoursBetween(LocalDateTime startInclusive, LocalDateTime endExclusive) {
        if (startInclusive == null || endExclusive == null) {
            return 0.0;
        }
        Duration duration = Duration.between(startInclusive, endExclusive);
        return duration.toMillis() / 3_600_000.0;
    }

    /**
     * Generates a continuous, unmodifiable stream/list of calendar dates between start and end inclusive.
     * Demonstrates Stream.iterate with LocalDate.plusDays.
     */
    public static List<LocalDate> generateDailyDateBuckets(LocalDate startInclusive, LocalDate endInclusive) {
        if (startInclusive == null || endInclusive == null) {
            return Collections.emptyList();
        }
        if (startInclusive.isAfter(endInclusive)) {
            return Collections.emptyList();
        }
        long daysBetween = ChronoUnit.DAYS.between(startInclusive, endInclusive);
        return Stream.iterate(startInclusive, date -> date.plusDays(1))
                .limit(daysBetween + 1)
                .collect(Collectors.toUnmodifiableList());
    }

    /**
     * Determines whether a given event timestamp falls within a defined shift operational window.
     * Handles both normal daytime shifts (e.g., 06:00 to 14:00) and overnight shifts that cross midnight
     * (e.g., 22:00 to 06:00).
     */
    public static boolean isWithinShiftWindow(LocalDateTime timestamp, LocalTime shiftStart, LocalTime shiftEnd) {
        Objects.requireNonNull(timestamp, "Timestamp cannot be null");
        Objects.requireNonNull(shiftStart, "Shift start cannot be null");
        Objects.requireNonNull(shiftEnd, "Shift end cannot be null");

        LocalTime eventTime = timestamp.toLocalTime();

        // Standard daytime shift (e.g. 06:00 -> 14:00)
        if (!shiftStart.isAfter(shiftEnd)) {
            return !eventTime.isBefore(shiftStart) && eventTime.isBefore(shiftEnd);
        }

        // Overnight shift (crosses midnight, e.g. 22:00 -> 06:00)
        return !eventTime.isBefore(shiftStart) || eventTime.isBefore(shiftEnd);
    }

    /**
     * Truncates a timestamp to the top of the hour (setting minutes, seconds, nanos to 0).
     * Demonstrates ChronoUnit.HOURS.truncatedTo.
     */
    public static LocalDateTime truncateToHour(LocalDateTime timestamp) {
        if (timestamp == null) {
            return null;
        }
        return timestamp.truncatedTo(ChronoUnit.HOURS);
    }
}
