package com.chromaguard.service;

import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import com.chromaguard.entity.IndustrialZone;
import com.chromaguard.entity.Shift;
import com.chromaguard.entity.ShiftType;
import com.chromaguard.entity.Worker;
import com.chromaguard.entity.UserAccount;
import com.chromaguard.entity.UserRole;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.IndustrialZoneRepository;
import com.chromaguard.repository.ShiftRepository;
import com.chromaguard.repository.WorkerRepository;
import com.chromaguard.repository.UserAccountRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PushbackInputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.text.Normalizer;

@Service
public class DatasetImportService {
    private static final long MAX_FILE_BYTES = 100_000_000L;
    private static final int BATCH_SIZE = 1000;
    private static final Map<String, List<String>> HEADER_ALIASES = Map.of(
            "worker", List.of("workerid", "employeeid", "personnelid", "badgeid", "worker", "workername", "employeename", "personnelname", "fullname", "name"),
            "zone", List.of("zoneid", "zonecode", "zone", "zonename", "areaid", "area", "areaname", "blockid", "block", "blockname", "location", "locationname", "unit", "unitname"),
            "shift", List.of("shiftid", "shift", "shiftname", "workshift", "shifttype"),
            "workerName", List.of("workername", "employeename", "personnelname", "fullname"),
            "workerRole", List.of("workerrole", "jobrole", "role", "occupation"),
            "timestamp", List.of("timestamp", "datetime", "dateandtime", "recordedat", "readingtime", "measuredat", "sampletime", "createdat", "measurementtime", "collectedat", "dateofreading", "scantimestamp"),
            "date", List.of("date", "readingdate", "measurementdate", "recorddate", "sampledate", "datecollected", "collecteddate", "logdate", "dateofmeasurement", "shiftdate"),
            "time", List.of("time", "readingtimeonly", "measurementtimeonly"),
            "dose", List.of("doseppmhr", "doseppmh", "dose", "dosevalue", "ppmdose", "cumulativedose", "cumulativeppmhr", "exposureppmhr", "exposuredoseppmhr", "exposure", "exposuredose", "exposurevalue", "exposurelevel", "cumulativeexposure", "h2sppmhr", "h2sexposure", "h2sexposureppmhr", "gasedose", "ppmhr", "readingppmhr", "cumulativedoseppmhr"),
            "status", List.of("status", "demostatus", "severity", "exposurestatus", "safetystatus")
    );

    private final WorkerRepository workerRepository;
    private final IndustrialZoneRepository zoneRepository;
    private final ShiftRepository shiftRepository;
    private final ExposureRecordRepository exposureRecordRepository;
    private final ExposureCalculationService exposureCalculationService;
    private final AlertService alertService;
    private final ObjectMapper objectMapper;
    private final ActiveDatasetService activeDatasetService;
    private final AlertRepository alertRepository;
    private final UserAccountRepository userAccountRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public String getActiveDatasetVersion() { return activeDatasetService.getActiveVersion(); }

    @Transactional
    public Map<String, Object> clearActiveDataset() {
        long deletedAlerts = alertRepository.count();
        long deletedRecords = exposureRecordRepository.count();
        List<String> registeredWorkerIds = userAccountRepository.findAll().stream()
                .filter(account -> account.getRole() == UserRole.ROLE_WORKER)
                .map(UserAccount::getAssociatedWorkerId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();
        alertRepository.deleteAllInBatch();
        exposureRecordRepository.deleteAllInBatch();
        List<Worker> unregisteredWorkers = workerRepository.findAll().stream()
                .filter(worker -> !registeredWorkerIds.contains(worker.getId()))
                .toList();
        workerRepository.deleteAll(unregisteredWorkers);
        workerRepository.flush();
        activeDatasetService.clear();
        return Map.of("cleared", true, "deletedRecords", deletedRecords, "deletedAlerts", deletedAlerts,
                "preservedRegisteredWorkers", registeredWorkerIds.size(),
                "message", "Exposure data, alerts, imported visualizations, and unregistered worker profiles were cleared. Registered worker accounts were kept.");
    }

    public DatasetImportService(WorkerRepository workerRepository, IndustrialZoneRepository zoneRepository,
                               ShiftRepository shiftRepository, ExposureRecordRepository exposureRecordRepository,
                               ExposureCalculationService exposureCalculationService, AlertService alertService,
                               ObjectMapper objectMapper, ActiveDatasetService activeDatasetService,
                               AlertRepository alertRepository, UserAccountRepository userAccountRepository) {
        this.workerRepository = workerRepository;
        this.zoneRepository = zoneRepository;
        this.shiftRepository = shiftRepository;
        this.exposureRecordRepository = exposureRecordRepository;
        this.exposureCalculationService = exposureCalculationService;
        this.alertService = alertService;
        this.objectMapper = objectMapper;
        this.activeDatasetService = activeDatasetService;
        this.alertRepository = alertRepository;
        this.userAccountRepository = userAccountRepository;
    }

    @Transactional
    public Map<String, Object> importExposureCsv(MultipartFile file, Map<String, String> requestedMapping) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a non-empty CSV file up to 100 MB.");
        }

        List<Worker> workers = workerRepository.findAll();
        List<IndustrialZone> zones = zoneRepository.findAll();
        List<Shift> shifts = shiftRepository.findAll();
        List<ExposureRecord> batch = new ArrayList<>(BATCH_SIZE);
        Map<String, String> mappedHeaders = new LinkedHashMap<>();
        int skippedRows = 0;
        long importedRows = 0;
        int sourceColumnCount = 0;
        char delimiter = ',';
        String datasetVersion = "CSV-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);

        try (BufferedReader reader = utf8Reader(file)) {
            reader.mark(16_384);
            String firstLine = reader.readLine();
            if (firstLine == null) throw badRequest("The CSV file has no header row.");
            delimiter = detectDelimiter(firstLine);
            reader.reset();

            CSVFormat format = CSVFormat.DEFAULT.builder().setDelimiter(delimiter).setHeader()
                    .setSkipHeaderRecord(true).setTrim(true).build();
            try (CSVParser csv = format.parse(reader)) {
                Map<String, Integer> headers = normalizedHeaders(csv.getHeaderMap());
                sourceColumnCount = csv.getHeaderNames().size();
                Map<String, Integer> columns = resolveColumns(headers, requestedMapping);
                if (!columns.containsKey("worker") || !columns.containsKey("dose")
                        || (!columns.containsKey("timestamp") && !columns.containsKey("date"))) {
                    throw badRequest("Could not identify required data. Include a worker name/ID, an exposure or dose value, and a date/time column. Column names can vary.");
                }
                columns.forEach((key, index) -> mappedHeaders.put(key, csv.getHeaderNames().get(index)));

                for (CSVRecord row : csv) {
                    if (rowIsBlank(row)) { skippedRows++; continue; }
                    if (row.size() != sourceColumnCount) {
                        throw rowError(row, "row contains " + row.size() + " cells but the header contains " + sourceColumnCount + "; no rows from this file were imported");
                    }
                    try {
                        Worker worker = resolveWorker(value(row, columns, "worker"), workers);
                        if (worker == null) {
                            worker = createImportedWorker(value(row, columns, "worker"), value(row, columns, "workerName"),
                                    value(row, columns, "workerRole"), value(row, columns, "zone"), value(row, columns, "shift"), workers, zones, shifts);
                            workers.add(worker);
                        }

                        IndustrialZone zone = resolveZone(value(row, columns, "zone"), zones);
                        if (zone == null && hasValue(row, columns, "zone")) {
                            zone = createImportedZone(value(row, columns, "zone"), zones);
                            zones.add(zone);
                        }
                        if (zone == null) zone = worker.getAssignedZone();

                        Shift shift = resolveShift(value(row, columns, "shift"), shifts);
                        if (shift == null && hasValue(row, columns, "shift")) {
                            shift = createImportedShift(value(row, columns, "shift"), shifts);
                            shifts.add(shift);
                        }
                        if (shift == null) shift = worker.getPreferredShift();

                        LocalDateTime timestamp = parseTimestamp(value(row, columns, "timestamp"), value(row, columns, "date"), value(row, columns, "time"));
                        double dose = parseDose(value(row, columns, "dose"), delimiter);
                        if (!Double.isFinite(dose) || dose < 0 || dose > 100_000) throw rowError(row, "exposure/dose must be between 0 and 100000 ppm·hr");

                        DemoStatus status = resolveStatus(value(row, columns, "status"), dose);
                        Worker workerRef = entityManager.getReference(Worker.class, worker.getId());
                        IndustrialZone zoneRef = entityManager.getReference(IndustrialZone.class, zone.getId());
                        Shift shiftRef = entityManager.getReference(Shift.class, shift.getId());
                        ExposureRecord importedRecord = new ExposureRecord("E" + UUID.randomUUID().toString().replace("-", "").substring(0, 31),
                                workerRef, zoneRef, shiftRef, timestamp, 0, 0, 0, dose, dose, status, "ADMIN_DATASET_IMPORT", datasetVersion);
                        try {
                            importedRecord.setSourceDatasetJson(objectMapper.writeValueAsString(row.toMap()));
                        } catch (JsonProcessingException ex) {
                            throw rowError(row, "source columns could not be preserved");
                        }
                        batch.add(importedRecord);
                        importedRows++;
                        if (batch.size() == BATCH_SIZE) persistBatch(batch);
                    } catch (ResponseStatusException ex) {
                        throw ex;
                    } catch (RuntimeException ex) {
                        throw rowError(row, ex instanceof NumberFormatException
                                ? "exposure/dose value is not numeric"
                                : "date/time value could not be parsed");
                    }
                }
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read this file as CSV. Save or export it as comma, semicolon, or tab-delimited UTF-8 CSV and try again.");
        }

        if (importedRows == 0) throw badRequest("No usable readings were found in the CSV.");
        if (!batch.isEmpty()) persistBatch(batch);
        // Switch the visible dataset atomically after every CSV row has been stored.
        // Earlier records remain intact and reappear when the active import is cleared.
        activeDatasetService.activate(datasetVersion);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("importedReadings", importedRows);
        result.put("skippedRows", skippedRows);
        result.put("sourceColumnsPreserved", sourceColumnCount);
        result.put("mappedColumns", mappedHeaders);
        result.put("datasetVersion", datasetVersion);
        result.put("message", "Dataset readings imported successfully.");
        return result;
    }

    public Map<String, Object> inspectCsv(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_BYTES) {
            throw badRequest("Choose a non-empty CSV file up to 100 MB.");
        }
        try (BufferedReader reader = utf8Reader(file)) {
            reader.mark(16_384);
            String firstLine = reader.readLine();
            if (firstLine == null) throw badRequest("The CSV file has no header row.");
            CSVFormat format = CSVFormat.DEFAULT.builder().setDelimiter(detectDelimiter(firstLine)).setHeader()
                    .setSkipHeaderRecord(true).setTrim(true).build();
            reader.reset();
            try (CSVParser csv = format.parse(reader)) {
                List<String> headersList = csv.getHeaderNames();
                Map<String, Integer> headers = normalizedHeaders(csv.getHeaderMap());
                Map<String, Integer> suggested = resolveColumns(headers, Map.of());
                Map<String, String> suggestions = new LinkedHashMap<>();
                suggested.forEach((field, index) -> suggestions.put(field, headersList.get(index)));
                List<List<String>> samples = new ArrayList<>();
                for (CSVRecord row : csv) {
                    if (!rowIsBlank(row)) samples.add(row.toList());
                    if (samples.size() == 5) break;
                }
                return Map.of("headers", headersList, "sampleRows", samples, "suggestedColumns", suggestions);
            }
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw badRequest("Could not inspect this file as CSV. Save or export it as comma, semicolon, or tab-delimited UTF-8 CSV and try again.");
        }
    }

    private Map<String, Integer> normalizedHeaders(Map<String, Integer> source) {
        Map<String, Integer> normalized = new LinkedHashMap<>();
        source.forEach((header, index) -> normalized.putIfAbsent(normalize(header), index));
        return normalized;
    }

    private Map<String, Integer> resolveColumns(Map<String, Integer> headers, Map<String, String> requestedMapping) {
        Map<String, Integer> result = new LinkedHashMap<>();
        HEADER_ALIASES.forEach((field, aliases) -> aliases.stream().map(this::normalize)
                .filter(headers::containsKey).findFirst().ifPresent(alias -> result.put(field, headers.get(alias))));
        if (requestedMapping != null) requestedMapping.forEach((field, header) -> {
            Integer index = headers.get(normalize(header));
            if (index != null && HEADER_ALIASES.containsKey(field)) result.put(field, index);
        });
        return result;
    }

    private Worker resolveWorker(String value, List<Worker> workers) {
        if (value == null || value.isBlank()) return null;
        String key = normalize(value);
        return workers.stream().filter(worker -> normalize(worker.getId()).equals(key)
                        || normalize(worker.getBadgeId()).equals(key)
                        || normalize(worker.getSyntheticName()).equals(key))
                .min(Comparator.comparing(worker -> normalize(worker.getId()).equals(key) ? 0
                        : normalize(worker.getBadgeId()).equals(key) ? 1 : 2))
                .orElse(null);
    }

    private IndustrialZone resolveZone(String value, List<IndustrialZone> zones) {
        if (value == null || value.isBlank()) return null;
        String key = normalize(value);
        return zones.stream().filter(zone -> normalize(zone.getId()).equals(key)
                || normalize(zone.getZoneCode()).equals(key) || normalize(zone.getZoneName()).equals(key)).findFirst().orElse(null);
    }

    private Shift resolveShift(String value, List<Shift> shifts) {
        if (value == null || value.isBlank()) return null;
        String key = normalize(value);
        return shifts.stream().filter(shift -> normalize(shift.getId()).equals(key)
                || normalize(shift.getShiftName()).equals(key)
                || (key.startsWith("morning") && ShiftType.fromShiftName(shift.getShiftName()) == ShiftType.MORNING)
                || (key.startsWith("afternoon") && ShiftType.fromShiftName(shift.getShiftName()) == ShiftType.AFTERNOON)
                || (key.startsWith("night") && ShiftType.fromShiftName(shift.getShiftName()) == ShiftType.NIGHT)).findFirst().orElse(null);
    }

    private IndustrialZone createImportedZone(String sourceName, List<IndustrialZone> zones) {
        String normalized = normalize(sourceName);
        IndustrialZone existing = zones.stream().filter(zone -> normalize(zone.getZoneName()).equals(normalized)
                || normalize(zone.getZoneCode()).equals(normalized)).findFirst().orElse(null);
        if (existing != null) return existing;
        String base = Normalizer.normalize(sourceName, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (base.isBlank()) base = "IMPORTED_ZONE";
        String code = base.substring(0, Math.min(16, base.length()));
        String candidate = code;
        int suffix = 2;
        while (zoneCodeExists(candidate, zones)) {
            String tail = "_" + suffix++;
            candidate = code.substring(0, Math.min(code.length(), 16 - tail.length())) + tail;
        }
        IndustrialZone zone = new IndustrialZone("ZONE-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT),
                candidate, sourceName.trim(), com.chromaguard.entity.RiskTier.LOW, 0.0,
                "Created automatically while importing an exposure dataset.");
        return zoneRepository.save(zone);
    }

    private boolean zoneCodeExists(String candidate, List<IndustrialZone> zones) {
        for (IndustrialZone zone : zones) if (zone.getZoneCode().equalsIgnoreCase(candidate)) return true;
        return zoneRepository.existsByZoneCodeIgnoreCase(candidate);
    }

    private Shift createImportedShift(String sourceName, List<Shift> shifts) {
        String normalized = normalize(sourceName);
        ShiftTypeDefaults defaults = ShiftTypeDefaults.forName(normalized);
        String displayName = sourceName.trim();
        Shift imported = new Shift("SHIFT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT),
                displayName, defaults.start, defaults.end, 8);
        return shiftRepository.save(imported);
    }

    private Worker createImportedWorker(String workerKey, String fullName, String role, String zoneName, String shiftName,
                                        List<Worker> workers, List<IndustrialZone> zones, List<Shift> shifts) {
        if (workerKey == null || workerKey.isBlank()) throw new IllegalArgumentException("worker ID is missing");
        String safeName = fullName == null || fullName.isBlank() ? workerKey.trim() : fullName.trim();
        IndustrialZone zone = resolveZone(zoneName, zones);
        if (zone == null) zone = zoneName == null || zoneName.isBlank()
                ? zones.stream().filter(IndustrialZone::isActive).findFirst().orElseThrow(() -> badRequest("Create an active zone before importing worker records."))
                : createImportedZone(zoneName, zones);
        Shift shift = resolveShift(shiftName, shifts);
        if (shift == null) shift = shiftName == null || shiftName.isBlank()
                ? shifts.stream().findFirst().orElseThrow(() -> badRequest("Create a shift before importing worker records."))
                : createImportedShift(shiftName, shifts);
        String badge = "IMPORT-" + normalize(workerKey);
        Worker worker = new Worker(workerKey.trim(), safeName, zone, shift,
                role == null || role.isBlank() ? "Imported Worker" : role.trim(), 0, badge);
        return workerRepository.save(worker);
    }

    private DemoStatus resolveStatus(String value, double dose) {
        if (value == null || value.isBlank()) return exposureCalculationService.evaluateStatus(dose);
        return switch (normalize(value)) {
            case "normal", "safe", "low" -> DemoStatus.NORMAL;
            case "elevated", "medium", "moderate" -> DemoStatus.ELEVATED;
            case "warning", "warn", "high" -> DemoStatus.WARNING;
            case "critical", "severe", "veryhigh" -> DemoStatus.CRITICAL;
            default -> exposureCalculationService.evaluateStatus(dose);
        };
    }

    private record ShiftTypeDefaults(String start, String end) {
        private static ShiftTypeDefaults forName(String name) {
            if (name.startsWith("morning")) return new ShiftTypeDefaults("06:00:00", "14:00:00");
            if (name.startsWith("afternoon")) return new ShiftTypeDefaults("14:00:00", "22:00:00");
            if (name.startsWith("night")) return new ShiftTypeDefaults("22:00:00", "06:00:00");
            return new ShiftTypeDefaults("00:00:00", "08:00:00");
        }
    }

    private String value(CSVRecord row, Map<String, Integer> columns, String field) {
        Integer index = columns.get(field);
        return index == null || index >= row.size() ? "" : row.get(index).trim();
    }

    private boolean hasValue(CSVRecord row, Map<String, Integer> columns, String field) {
        return !value(row, columns, field).isBlank();
    }

    private boolean rowIsBlank(CSVRecord row) {
        for (String value : row) if (value != null && !value.isBlank()) return false;
        return true;
    }

    private void persistBatch(List<ExposureRecord> batch) {
        List<ExposureRecord> saved = exposureRecordRepository.saveAll(batch);
        entityManager.flush();
        saved.stream().filter(record -> record.getDemoStatus().isIncidentLevel())
                .forEach(alertService::createThresholdAlert);
        entityManager.flush();
        batch.clear();
        entityManager.clear();
    }

    private LocalDateTime parseTimestamp(String timestamp, String date, String time) {
        if (timestamp != null && !timestamp.isBlank()) {
            String value = timestamp.trim();
            try { return LocalDateTime.parse(value); }
            catch (DateTimeParseException ignored) {
                try { return OffsetDateTime.parse(value).toLocalDateTime(); }
                catch (DateTimeParseException ignoredOffset) {
                    try { return parseDate(value).atTime(parseTimeOrDefault(time)); }
                    catch (DateTimeParseException ignoredDate) {
                        try { return parseFlexibleDateTime(value); }
                        catch (DateTimeParseException ignoredFormat) {
                            if (date == null || date.isBlank()) throw ignoredFormat;
                            return parseDate(date).atTime(time == null || time.isBlank() ? parseTime(value) : parseTime(time));
                        }
                    }
                }
            }
        }
        if (date == null || date.isBlank()) throw new DateTimeParseException("Missing date/time", "", 0);
        return parseDate(date).atTime(parseTimeOrDefault(time));
    }

    private LocalDate parseDate(String value) {
        String date = value.trim();
        try { return LocalDate.parse(date); } catch (DateTimeParseException ignored) { }
        for (String pattern : List.of("M/d/uuuu", "d/M/uuuu", "M-d-uuuu", "d-M-uuuu", "uuuu/M/d", "uuuu-M-d")) {
            try { return LocalDate.parse(date, DateTimeFormatter.ofPattern(pattern, Locale.ROOT)); }
            catch (DateTimeParseException ignored) { }
        }
        throw new DateTimeParseException("Unsupported date", date, 0);
    }

    private LocalDateTime parseFlexibleDateTime(String value) {
        try { return LocalDateTime.parse(value.trim().replace(' ', 'T')); }
        catch (DateTimeParseException ignored) { }
        for (String pattern : List.of("M/d/uuuu H:mm:ss", "M/d/uuuu H:mm", "d/M/uuuu H:mm:ss", "d/M/uuuu H:mm", "d-M-uuuu H:mm:ss", "d-M-uuuu H:mm")) {
            try { return LocalDateTime.parse(value, DateTimeFormatter.ofPattern(pattern, Locale.ROOT)); }
            catch (DateTimeParseException ignored) { }
        }
        throw new DateTimeParseException("Unsupported date/time", value, 0);
    }

    private LocalTime parseTimeOrDefault(String value) {
        return value == null || value.isBlank() ? LocalTime.MIDNIGHT : parseTime(value);
    }

    private LocalTime parseTime(String value) {
        String time = value.trim();
        try { return LocalTime.parse(time); } catch (DateTimeParseException ignored) { }
        try { return LocalTime.parse(time, DateTimeFormatter.ofPattern("h:mm a", Locale.US)); }
        catch (DateTimeParseException ex) { throw new DateTimeParseException("Unsupported time", time, 0); }
    }

    private double parseDose(String value, char delimiter) {
        String number = value == null ? "" : value.trim().replaceAll("(?i)ppm\\s*[·.]?\\s*hr", "").replaceAll("\\s", "");
        if (number.isBlank()) throw new NumberFormatException("empty dose");
        if (number.contains(",") && number.contains(".")) number = number.replace(",", "");
        else if (number.contains(",") && delimiter != ',') number = number.replace(',', '.');
        else if (number.contains(",")) number = number.replace(",", "");
        return Double.parseDouble(number);
    }

    private char detectDelimiter(String line) {
        char best = ',';
        int max = -1;
        boolean quoted = false;
        int commas = 0, semicolons = 0, tabs = 0, pipes = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') quoted = !quoted;
            else if (!quoted) {
                if (c == ',') commas++;
                else if (c == ';') semicolons++;
                else if (c == '\t') tabs++;
                else if (c == '|') pipes++;
            }
        }
        int[] counts = {commas, semicolons, tabs, pipes};
        char[] delimiters = {',', ';', '\t', '|'};
        for (int i = 0; i < counts.length; i++) if (counts[i] > max) { max = counts[i]; best = delimiters[i]; }
        return best;
    }

    private String normalize(String value) {
        if (value == null) return "";
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }

    private ResponseStatusException rowError(CSVRecord row, String reason) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "CSV row " + row.getRecordNumber() + ": " + reason + ". Correct the row; no partial import was performed.");
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private BufferedReader utf8Reader(MultipartFile file) throws java.io.IOException {
        PushbackInputStream input = new PushbackInputStream(file.getInputStream(), 3);
        byte[] prefix = input.readNBytes(3);
        boolean hasBom = prefix.length == 3 && (prefix[0] & 0xFF) == 0xEF && (prefix[1] & 0xFF) == 0xBB && (prefix[2] & 0xFF) == 0xBF;
        if (!hasBom && prefix.length > 0) input.unread(prefix);
        return new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8));
    }
}
