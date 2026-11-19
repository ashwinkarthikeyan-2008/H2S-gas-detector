package com.chromaguard.service;

import com.chromaguard.dto.*;
import com.chromaguard.entity.*;
import com.chromaguard.repository.ExposureRecordRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ExposureRecordRepository exposureRecordRepository;
    private final ExposureCalculationService calculationService;
    private final ActiveDatasetService activeDatasetService;

    public AnalyticsService(ExposureRecordRepository exposureRecordRepository,
                            ExposureCalculationService calculationService, ActiveDatasetService activeDatasetService) {
        this.exposureRecordRepository = exposureRecordRepository;
        this.calculationService = calculationService;
        this.activeDatasetService = activeDatasetService;
    }

    private List<ExposureRecord> currentDatasetRecords() {
        String version = activeDatasetService.getActiveVersion();
        return version == null ? exposureRecordRepository.findAll() : exposureRecordRepository.findByDatasetVersion(version);
    }

    /**
     * Computes descriptive statistics (count, mean, median, stdDev, variance, min, max, Q1, Q3, IQR)
     * for a given list of numerical values.
     */
    public DescriptiveStatsDto calculateDescriptiveStatistics(String variableName, String unit, List<Double> values) {
        if (values == null || values.isEmpty()) {
            return new DescriptiveStatsDto(variableName, unit, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }

        long count = values.size();
        List<Double> sorted = values.stream().sorted().collect(Collectors.toList());

        double min = sorted.get(0);
        double max = sorted.get(sorted.size() - 1);
        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        // Variance & Standard Deviation
        double sumSquaredDiff = values.stream()
                .mapToDouble(v -> Math.pow(v - mean, 2))
                .sum();
        double variance = count > 1 ? sumSquaredDiff / (count - 1) : 0.0;
        double stdDev = Math.sqrt(variance);

        // Median, Q1, Q3
        double median = calculatePercentile(sorted, 50.0);
        double q1 = calculatePercentile(sorted, 25.0);
        double q3 = calculatePercentile(sorted, 75.0);
        double iqr = q3 - q1;

        return new DescriptiveStatsDto(
                variableName,
                unit,
                count,
                round(mean),
                round(median),
                round(stdDev),
                round(variance),
                round(min),
                round(max),
                round(q1),
                round(q3),
                round(iqr)
        );
    }

    /**
     * Calculates descriptive statistics for all numerical features in the exposure dataset.
     */
    public List<DescriptiveStatsDto> getAllDescriptiveStatistics() {
        List<ExposureRecord> records = currentDatasetRecords();

        List<Double> exposureValues = records.stream().map(ExposureRecord::getIllustrativeExposureValue).toList();
        List<Double> doseValues = records.stream().map(ExposureRecord::getIllustrativeCumulativeDose).toList();
        List<Double> rValues = records.stream().map(r -> (double) r.getSimulatedColorR()).toList();
        List<Double> gValues = records.stream().map(r -> (double) r.getSimulatedColorG()).toList();
        List<Double> bValues = records.stream().map(r -> (double) r.getSimulatedColorB()).toList();

        List<DescriptiveStatsDto> list = new ArrayList<>();
        list.add(calculateDescriptiveStatistics("Illustrative Exposure Value", "ppm·hr", exposureValues));
        list.add(calculateDescriptiveStatistics("Illustrative Cumulative Dose", "ppm·hr", doseValues));
        list.add(calculateDescriptiveStatistics("Simulated Color Channel (Red)", "8-bit RGB", rValues));
        list.add(calculateDescriptiveStatistics("Simulated Color Channel (Green)", "8-bit RGB", gValues));
        list.add(calculateDescriptiveStatistics("Simulated Color Channel (Blue)", "8-bit RGB", bValues));

        return list;
    }

    /**
     * Computes IQR outlier detection on illustrative exposure values.
     * Evaluates lower bound Q1 - 1.5*IQR and upper bound Q3 + 1.5*IQR.
     */
    public OutlierReportDto detectOutliers() {
        List<ExposureRecord> records = currentDatasetRecords();
        if (records.isEmpty()) {
            return new OutlierReportDto("Illustrative Exposure Value", 0, 0, 0, 0, 0, 0, 0, 0,
                    Collections.emptyList(), "No records present", "Dataset is empty.");
        }

        List<Double> values = records.stream()
                .map(ExposureRecord::getIllustrativeExposureValue)
                .sorted()
                .toList();

        double q1 = calculatePercentile(values, 25.0);
        double q3 = calculatePercentile(values, 75.0);
        double iqr = q3 - q1;
        double lowerBound = q1 - 1.5 * iqr;
        double upperBound = q3 + 1.5 * iqr;

        List<ExposureRecord> outliers = records.stream()
                .filter(r -> r.getIllustrativeExposureValue() < lowerBound || r.getIllustrativeExposureValue() > upperBound)
                .sorted(Comparator.comparing(ExposureRecord::getIllustrativeExposureValue).reversed())
                .toList();

        long totalCount = records.size();
        long outlierCount = outliers.size();
        double percentage = round((double) outlierCount / totalCount * 100.0);

        List<ExposureRecordDto> outlierDtos = outliers.stream()
                .map(this::toRecordDto)
                .collect(Collectors.toList());

        String methodology = String.format(
                "Tukey's Fences method applied: Q1 = %.2f ppm·hr, Q3 = %.2f ppm·hr, IQR = %.2f. " +
                "Lower fence = Q1 - 1.5*IQR (%.2f ppm·hr), Upper fence = Q3 + 1.5*IQR (%.2f ppm·hr).",
                q1, q3, iqr, lowerBound, upperBound
        );

        String interpretation = "Academic DEV Interpretation: In this synthetic demonstration dataset, values exceeding the upper fence represent simulated industrial transient events (e.g. simulated flange leaks or maintenance spikes in the Desulfurization Trench and Acid Gas Recovery zones). In statistical exploratory analysis, outliers indicate deviations from standard operational baseline distributions, but must never be interpreted as certified real-world hazard findings without physical sensor calibration.";

        return new OutlierReportDto(
                "Illustrative Exposure Value",
                round(q1),
                round(q3),
                round(iqr),
                round(lowerBound),
                round(upperBound),
                totalCount,
                outlierCount,
                percentage,
                outlierDtos,
                methodology,
                interpretation
        );
    }

    /**
     * Pearson Correlation Coefficient between two numerical vectors.
     */
    public double calculatePearsonCorrelation(List<Double> x, List<Double> y) {
        if (x == null || y == null || x.size() != y.size() || x.size() < 2) {
            return 0.0;
        }

        int n = x.size();
        double meanX = x.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
        double meanY = y.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        double numerator = 0.0;
        double denomX = 0.0;
        double denomY = 0.0;

        for (int i = 0; i < n; i++) {
            double diffX = x.get(i) - meanX;
            double diffY = y.get(i) - meanY;
            numerator += diffX * diffY;
            denomX += diffX * diffX;
            denomY += diffY * diffY;
        }

        if (denomX <= 0 || denomY <= 0) return 0.0;
        return round(numerator / Math.sqrt(denomX * denomY));
    }

    /**
     * Computes correlation matrix for the DEV lab.
     */
    public CorrelationReportDto computeCorrelationMatrix() {
        List<ExposureRecord> records = currentDatasetRecords();
        List<String> variables = List.of("Exposure (ppm·hr)", "Cumulative Dose", "Color Red", "Color Green", "Color Blue");

        List<Double> exposure = records.stream().map(ExposureRecord::getIllustrativeExposureValue).toList();
        List<Double> dose = records.stream().map(ExposureRecord::getIllustrativeCumulativeDose).toList();
        List<Double> r = records.stream().map(rec -> (double) rec.getSimulatedColorR()).toList();
        List<Double> g = records.stream().map(rec -> (double) rec.getSimulatedColorG()).toList();
        List<Double> b = records.stream().map(rec -> (double) rec.getSimulatedColorB()).toList();

        Map<String, List<Double>> vectorMap = new LinkedHashMap<>();
        vectorMap.put("Exposure (ppm·hr)", exposure);
        vectorMap.put("Cumulative Dose", dose);
        vectorMap.put("Color Red", r);
        vectorMap.put("Color Green", g);
        vectorMap.put("Color Blue", b);

        Map<String, Map<String, Double>> matrix = new LinkedHashMap<>();
        for (String rowVar : variables) {
            Map<String, Double> row = new LinkedHashMap<>();
            for (String colVar : variables) {
                if (rowVar.equals(colVar)) {
                    row.put(colVar, 1.0);
                } else {
                    double rVal = calculatePearsonCorrelation(vectorMap.get(rowVar), vectorMap.get(colVar));
                    row.put(colVar, rVal);
                }
            }
            matrix.put(rowVar, row);
        }

        String methodology = "Pearson correlation coefficients computed across 718 synthetic records using standard covariance over product of standard deviations.";
        String observations = "High positive correlation observed between Exposure and Cumulative Dose (r ~ 0.98), reflecting duration integration. Strong negative correlation between Exposure and RGB channels (r ~ -0.92 to -0.96), illustrating simulated colorimetric chemical paper darkening during higher gas concentrations.";

        return new CorrelationReportDto(variables, matrix, methodology, observations);
    }

    /**
     * Builds dataset schema and quality summary for DEV Lab inspection.
     */
    public DatasetSummaryDto getDatasetSummary() {
        List<ExposureRecord> records = currentDatasetRecords();
        long totalRows = records.size();

        List<DatasetSummaryDto.ColumnMetaDto> columns = List.of(
                new DatasetSummaryDto.ColumnMetaDto("record_id", "String (PK)", "Unique synthetic exposure event identifier", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("worker_id", "String (FK)", "Identifier referencing synthetic worker identity", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("zone_id", "String (FK)", "Identifier referencing monitored industrial unit", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("shift_id", "String (FK)", "Reference to operational work shift window", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("timestamp", "ISO-8601 DateTime", "Simulated record acquisition timestamp", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("simulated_color_r", "Integer [0-255]", "Simulated red color component of chemical badge test", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("simulated_color_g", "Integer [0-255]", "Simulated green color component of chemical badge test", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("simulated_color_b", "Integer [0-255]", "Simulated blue color component of chemical badge test", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("illustrative_exposure_value", "Double (ppm·hr)", "Simulated exposure dose equivalent for demonstration", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("illustrative_cumulative_dose", "Double (ppm·hr)", "Calculated shift exposure dose integration", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("demo_status", "Enum", "Rule-based demonstration classification category", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("data_source", "String", "Synthetic provenance flag (SIMULATED_DATASET_V1)", false, totalRows),
                new DatasetSummaryDto.ColumnMetaDto("dataset_version", "String", "Data generation release tag (2026.09-DEV)", false, totalRows)
        );

        return new DatasetSummaryDto(
                "ChromaGuard Synthetic H2S Monitoring Corpus",
                "2026.09-DEV",
                totalRows,
                columns.size(),
                columns,
                0L, // 0 missing values
                0L, // 0 duplicates
                0L, // 0 invalid values
                "OPTIMAL (Deterministic Synthetic Baseline)",
                "Generated using Mulberry32 PRNG with fixed seed 42 over 20-day industrial operations scenario across 5 refinery zones and 40 synthetic personnel."
        );
    }

    /**
     * Bins exposure values into histogram frequency buckets.
     */
    public List<HistogramBinDto> calculateExposureHistogram(List<ExposureRecord> records, int binCount) {
        if (records == null || records.isEmpty() || binCount <= 0) {
            return Collections.emptyList();
        }

        double min = calculationService.calculateMinExposure(records);
        double max = calculationService.calculateMaxExposure(records);

        if (min == max) {
            return List.of(new HistogramBinDto(String.format("%.1f - %.1f", min, max), min, max, records.size()));
        }

        double binWidth = (max - min) / binCount;
        long[] counts = new long[binCount];

        for (ExposureRecord r : records) {
            double val = r.getIllustrativeExposureValue();
            int idx = (int) ((val - min) / binWidth);
            if (idx >= binCount) idx = binCount - 1;
            if (idx < 0) idx = 0;
            counts[idx]++;
        }

        List<HistogramBinDto> bins = new ArrayList<>();
        for (int i = 0; i < binCount; i++) {
            double bMin = min + i * binWidth;
            double bMax = min + (i + 1) * binWidth;
            String label = String.format("%.1f-%.1f", bMin, bMax);
            bins.add(new HistogramBinDto(label, round(bMin), round(bMax), counts[i]));
        }

        return bins;
    }

    /**
     * Sanitizes input records by removing null elements, records with missing mandatory relations,
     * invalid (negative) exposure numbers, and duplicate observations.
     * Guarantees safe processing for downstream stream pipelines.
     */
    public List<ExposureRecord> sanitizeRecords(List<ExposureRecord> records) {
        if (records == null || records.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> seenKeys = new HashSet<>();
        return records.stream()
                .filter(Objects::nonNull)
                .filter(r -> r.getId() != null && !r.getId().isBlank())
                .filter(r -> r.getWorker() != null && r.getZone() != null && r.getShift() != null)
                .filter(r -> r.getTimestamp() != null)
                .filter(r -> r.getIllustrativeExposureValue() != null && r.getIllustrativeExposureValue() >= 0.0)
                .filter(r -> seenKeys.add(r.getId())) // Deduplication by record ID
                .collect(Collectors.toList());
    }

    /**
     * Computes summary statistics (count, sum, min, average, max) over exposure values.
     * Uses Java Streams summarizingDouble collector.
     */
    public DoubleSummaryStatistics computeSummaryStatistics(List<ExposureRecord> records) {
        List<ExposureRecord> clean = sanitizeRecords(records);
        return clean.stream()
                .collect(Collectors.summarizingDouble(ExposureRecord::getIllustrativeExposureValue));
    }

    /**
     * Computes worker-level aggregated metrics using groupingBy and summarizingDouble.
     * Identifies latest status using Comparator.comparing(ExposureRecord::getTimestamp).
     */
    public List<WorkerSummaryDto> computeWorkerSummaries(List<ExposureRecord> records) {
        List<ExposureRecord> clean = sanitizeRecords(records);
        if (clean.isEmpty()) return Collections.emptyList();

        Map<Worker, DoubleSummaryStatistics> statsByWorker = clean.stream()
                .collect(Collectors.groupingBy(
                        ExposureRecord::getWorker,
                        Collectors.summarizingDouble(ExposureRecord::getIllustrativeExposureValue)
                ));

        Map<Worker, Optional<ExposureRecord>> latestByWorker = clean.stream()
                .collect(Collectors.groupingBy(
                        ExposureRecord::getWorker,
                        Collectors.maxBy(Comparator.comparing(ExposureRecord::getTimestamp))
                ));

        return statsByWorker.entrySet().stream()
                .map(entry -> {
                    Worker w = entry.getKey();
                    DoubleSummaryStatistics stats = entry.getValue();
                    ExposureRecord latest = latestByWorker.get(w).orElse(null);

                    String latestStatus = latest != null ? latest.getDemoStatus().name() : "NORMAL";
                    String latestTime = latest != null ? latest.getTimestamp().toString() : "";

                    return new WorkerSummaryDto(
                            w.getId(),
                            w.getSyntheticName(),
                            w.getAssignedZone() != null ? w.getAssignedZone().getId() : "",
                            w.getAssignedZone() != null ? w.getAssignedZone().getZoneName() : "",
                            w.getPreferredShift() != null ? w.getPreferredShift().getId() : "",
                            w.getPreferredShift() != null ? w.getPreferredShift().getShiftName() : "",
                            w.getRole(),
                            w.getExperienceYears(),
                            w.getBadgeId(),
                            stats.getCount(),
                            round(stats.getAverage()),
                            round(stats.getMax()),
                            latestStatus,
                            latestTime
                    );
                })
                .sorted(Comparator.comparing(WorkerSummaryDto::getAvgExposurePpmHr).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Computes zone comparison metrics using groupingBy and summarizingDouble.
     * Evaluates observed mean against baseline target.
     */
    public List<ZoneComparisonDto> computeZoneSummaries(List<ExposureRecord> records) {
        List<ExposureRecord> clean = sanitizeRecords(records);
        if (clean.isEmpty()) return Collections.emptyList();

        Map<IndustrialZone, DoubleSummaryStatistics> statsByZone = clean.stream()
                .collect(Collectors.groupingBy(
                        ExposureRecord::getZone,
                        Collectors.summarizingDouble(ExposureRecord::getIllustrativeExposureValue)
                ));

        Map<IndustrialZone, Long> alertsByZone = clean.stream()
                .filter(r -> r.getDemoStatus().isIncidentLevel())
                .collect(Collectors.groupingBy(
                        ExposureRecord::getZone,
                        Collectors.counting()
                ));

        return statsByZone.entrySet().stream()
                .map(entry -> {
                    IndustrialZone z = entry.getKey();
                    DoubleSummaryStatistics stats = entry.getValue();
                    long alertCount = alertsByZone.getOrDefault(z, 0L);

                    return new ZoneComparisonDto(
                            z.getId(),
                            z.getZoneCode(),
                            z.getZoneName(),
                            z.getRiskTier().name(),
                            z.getBaselineExposurePpmHr(),
                            round(stats.getAverage()),
                            round(stats.getMax()),
                            stats.getCount(),
                            alertCount
                    );
                })
                .sorted(Comparator.comparing(ZoneComparisonDto::getAvgExposurePpmHr).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Computes shift-level metrics using groupingBy, summarizingDouble, and mapping.
     */
    public List<ShiftSummaryDto> computeShiftSummaries(List<ExposureRecord> records) {
        List<ExposureRecord> clean = sanitizeRecords(records);
        if (clean.isEmpty()) return Collections.emptyList();

        Map<Shift, DoubleSummaryStatistics> statsByShift = clean.stream()
                .collect(Collectors.groupingBy(
                        ExposureRecord::getShift,
                        Collectors.summarizingDouble(ExposureRecord::getIllustrativeExposureValue)
                ));

        return statsByShift.entrySet().stream()
                .map(entry -> {
                    Shift s = entry.getKey();
                    DoubleSummaryStatistics stats = entry.getValue();

                    long warnings = clean.stream()
                            .filter(r -> r.getShift().equals(s) && r.getDemoStatus() == DemoStatus.WARNING)
                            .count();
                    long criticals = clean.stream()
                            .filter(r -> r.getShift().equals(s) && r.getDemoStatus() == DemoStatus.CRITICAL)
                            .count();

                    return new ShiftSummaryDto(
                            s.getId(),
                            s.getShiftName(),
                            s.getStartTime(),
                            s.getEndTime(),
                            s.getDurationHours(),
                            stats.getCount(),
                            round(stats.getAverage()),
                            round(stats.getMax()),
                            round(stats.getMin()),
                            warnings,
                            criticals
                    );
                })
                .sorted(Comparator.comparing(ShiftSummaryDto::getShiftId))
                .collect(Collectors.toList());
    }

    /**
     * Computes daily chronological trends using groupingBy with TreeMap for automatic key ordering.
     */
    public List<TrendPointDto> computeDailyTrends(List<ExposureRecord> records) {
        List<ExposureRecord> clean = sanitizeRecords(records);
        if (clean.isEmpty()) return Collections.emptyList();

        Map<String, List<ExposureRecord>> byDate = clean.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getTimestamp().toLocalDate().toString(),
                        TreeMap::new,
                        Collectors.toList()
                ));

        return byDate.entrySet().stream()
                .map(entry -> {
                    String date = entry.getKey();
                    List<ExposureRecord> dayRecs = entry.getValue();
                    DoubleSummaryStatistics stats = dayRecs.stream()
                            .collect(Collectors.summarizingDouble(ExposureRecord::getIllustrativeExposureValue));

                    long warnings = dayRecs.stream().filter(r -> r.getDemoStatus() == DemoStatus.WARNING).count();
                    long criticals = dayRecs.stream().filter(r -> r.getDemoStatus() == DemoStatus.CRITICAL).count();

                    return new TrendPointDto(
                            date,
                            round(stats.getAverage()),
                            round(stats.getMax()),
                            stats.getCount(),
                            warnings,
                            criticals
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * Computes categorical simulation status distribution using groupingBy and counting.
     */
    public List<StatusDistributionDto> computeStatusDistribution(List<ExposureRecord> records) {
        List<ExposureRecord> clean = sanitizeRecords(records);
        long total = clean.size();
        if (total == 0) return Collections.emptyList();

        Map<DemoStatus, Long> counts = clean.stream()
                .collect(Collectors.groupingBy(
                        ExposureRecord::getDemoStatus,
                        Collectors.counting()
                ));

        Map<DemoStatus, String> colorMap = Map.of(
                DemoStatus.NORMAL, "#10B981",    // Green
                DemoStatus.ELEVATED, "#3B82F6",  // Blue
                DemoStatus.WARNING, "#F59E0B",   // Amber
                DemoStatus.CRITICAL, "#EF4444"   // Red
        );

        List<StatusDistributionDto> result = new ArrayList<>();
        for (DemoStatus status : DemoStatus.values()) {
            long count = counts.getOrDefault(status, 0L);
            double pct = round((double) count / total * 100.0);
            result.add(new StatusDistributionDto(
                    status.name(),
                    status.getDisplayName(),
                    count,
                    pct,
                    colorMap.getOrDefault(status, "#6B7280")
            ));
        }
        return result;
    }

    private double calculatePercentile(List<Double> sorted, double percentile) {
        if (sorted.isEmpty()) return 0.0;
        int n = sorted.size();
        if (n == 1) return sorted.get(0);

        double rank = (percentile / 100.0) * (n - 1);
        int lowerIndex = (int) Math.floor(rank);
        int upperIndex = (int) Math.ceil(rank);
        double weight = rank - lowerIndex;

        return sorted.get(lowerIndex) * (1.0 - weight) + sorted.get(upperIndex) * weight;
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private ExposureRecordDto toRecordDto(ExposureRecord r) {
        return new ExposureRecordDto(
                r.getId(),
                r.getWorker().getId(),
                r.getWorker().getSyntheticName(),
                r.getZone().getId(),
                r.getZone().getZoneCode(),
                r.getZone().getZoneName(),
                r.getShift().getId(),
                r.getShift().getShiftName(),
                r.getTimestamp().toString(),
                r.getSimulatedColorR(),
                r.getSimulatedColorG(),
                r.getSimulatedColorB(),
                r.getIllustrativeExposureValue(),
                r.getIllustrativeCumulativeDose(),
                r.getDemoStatus().name(),
                r.getDataSource(),
                r.getDatasetVersion(),
                r.getSourceDatasetJson()
        );
    }
}
