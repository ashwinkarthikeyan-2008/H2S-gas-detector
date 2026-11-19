package com.chromaguard.util;

import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.ToDoubleFunction;
import java.util.stream.Collectors;

/**
 * Reusable generic collection and analytical utility demonstrating:
 * - Generic methods with type parameter inference
 * - Upper bounded type parameters: {@code <T extends Number & Comparable<T>>}
 * - Wildcard bounds: {@code Comparator<? super T>}
 * - Functional interfaces: Function, Predicate, ToDoubleFunction
 * - Streams API with grouping, partitioning, and statistical collectors
 */
public final class CollectionAnalyticsUtil {

    private CollectionAnalyticsUtil() {
        // Non-instantiable utility class
    }

    /**
     * Safely paginates any collection of type {@code T}.
     * Demonstrates generic method and defensive bounds checking.
     */
    public static <T> List<T> paginate(List<T> source, int page, int pageSize) {
        if (source == null || source.isEmpty() || pageSize <= 0 || page <= 0) {
            return Collections.emptyList();
        }
        int fromIndex = (page - 1) * pageSize;
        if (fromIndex >= source.size()) {
            return Collections.emptyList();
        }
        int toIndex = Math.min(fromIndex + pageSize, source.size());
        return Collections.unmodifiableList(source.subList(fromIndex, toIndex));
    }

    /**
     * Groups a collection of elements into a Map keyed by a generic classifier function.
     * Demonstrates Java Streams {@code Collectors.groupingBy} with generics.
     */
    public static <T, K> Map<K, List<T>> groupByKey(Collection<T> items, Function<? super T, ? extends K> classifier) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyMap();
        }
        return items.stream()
                .collect(Collectors.groupingBy(classifier, LinkedHashMap::new, Collectors.toList()));
    }

    /**
     * Partitions a collection into matching vs non-matching sub-lists based on a generic predicate.
     * Demonstrates Java Streams {@code Collectors.partitioningBy}.
     */
    public static <T> Map<Boolean, List<T>> partitionBy(Collection<T> items, Predicate<? super T> predicate) {
        if (items == null || items.isEmpty()) {
            return Map.of(Boolean.TRUE, List.of(), Boolean.FALSE, List.of());
        }
        return items.stream()
                .collect(Collectors.partitioningBy(predicate));
    }

    /**
     * Finds the maximum element in a collection using a generic comparator.
     * Demonstrates {@code Optional<T>} and wildcard bounds {@code Comparator<? super T>}.
     */
    public static <T> Optional<T> findMax(Collection<T> items, Comparator<? super T> comparator) {
        if (items == null || items.isEmpty()) {
            return Optional.empty();
        }
        return items.stream().max(comparator);
    }

    /**
     * Computes the arithmetic mean over any collection of bounded numbers.
     * Demonstrates upper bounded generic types {@code <N extends Number>}.
     */
    public static <N extends Number> double calculateMean(Collection<N> numbers) {
        if (numbers == null || numbers.isEmpty()) {
            return 0.0;
        }
        return numbers.stream()
                .mapToDouble(Number::doubleValue)
                .average()
                .orElse(0.0);
    }

    /**
     * Calculates a moving average over a sequence of domain items.
     * Demonstrates {@code ToDoubleFunction<T>} and sliding window algorithm.
     */
    public static <T> List<Double> calculateMovingAverage(List<T> items, ToDoubleFunction<? super T> extractor, int windowSize) {
        if (items == null || items.isEmpty() || windowSize <= 0) {
            return Collections.emptyList();
        }
        List<Double> result = new ArrayList<>();
        double currentSum = 0.0;

        for (int i = 0; i < items.size(); i++) {
            currentSum += extractor.applyAsDouble(items.get(i));
            if (i >= windowSize) {
                currentSum -= extractor.applyAsDouble(items.get(i - windowSize));
                result.add(currentSum / windowSize);
            } else {
                result.add(currentSum / (i + 1));
            }
        }
        return Collections.unmodifiableList(result);
    }

    /**
     * Identifies duplicate items within a collection using a generic Set.
     * Demonstrates {@code Set.add()} returning false upon duplicate collision.
     */
    public static <T> Set<T> findDuplicates(Collection<T> items) {
        if (items == null || items.isEmpty()) {
            return Collections.emptySet();
        }
        Set<T> seen = new HashSet<>();
        Set<T> duplicates = new LinkedHashSet<>();
        for (T item : items) {
            if (!seen.add(item)) {
                duplicates.add(item);
            }
        }
        return Collections.unmodifiableSet(duplicates);
    }
}
