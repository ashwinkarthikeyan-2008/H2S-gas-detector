package com.chromaguard.controller;

import com.chromaguard.service.DatasetImportService;
import com.chromaguard.service.ActiveDatasetService;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.entity.ExposureRecord;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.StringJoiner;

@RestController
@RequestMapping("/api/admin/dataset")
public class DatasetImportController {
    private final DatasetImportService datasetImportService;
    private final ObjectMapper objectMapper;
    private final ActiveDatasetService activeDatasetService;
    private final ExposureRecordRepository exposureRecordRepository;

    public DatasetImportController(DatasetImportService datasetImportService, ObjectMapper objectMapper,
                                   ActiveDatasetService activeDatasetService, ExposureRecordRepository exposureRecordRepository) {
        this.datasetImportService = datasetImportService;
        this.objectMapper = objectMapper;
        this.activeDatasetService = activeDatasetService;
        this.exposureRecordRepository = exposureRecordRepository;
    }

    @PostMapping(value = "/inspect", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> inspectDataset(@RequestPart("file") MultipartFile file,
                                                               Authentication authentication) {
        assertAdmin(authentication);
        return ResponseEntity.ok(datasetImportService.inspectCsv(file));
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> importDataset(@RequestPart("file") MultipartFile file,
                                                               @RequestPart(value = "mapping", required = false) String mappingJson,
                                                              Authentication authentication) {
        assertAdmin(authentication);
        Map<String, String> mapping = Map.of();
        if (mappingJson != null && !mappingJson.isBlank()) {
            try {
                mapping = objectMapper.readValue(mappingJson, new TypeReference<>() {});
            } catch (Exception ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Column mapping was not valid.");
            }
        }
        return ResponseEntity.ok(datasetImportService.importExposureCsv(file, mapping));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearImportedDataset(Authentication authentication) {
        assertAdmin(authentication);
        return ResponseEntity.ok(datasetImportService.clearActiveDataset());
    }

    @GetMapping("/state")
    public ResponseEntity<Map<String, Object>> getDatasetState(Authentication authentication) {
        assertAdmin(authentication);
        String version = datasetImportService.getActiveDatasetVersion();
        return ResponseEntity.ok(Map.of("active", version != null, "datasetVersion", version == null ? "" : version));
    }

    @GetMapping(value = "/export.csv", produces = "text/csv")
    public ResponseEntity<String> exportImportedSourceCsv(Authentication authentication) {
        assertAdmin(authentication);
        String version = activeDatasetService.getActiveVersion();
        if (version == null) throw new ResponseStatusException(HttpStatus.CONFLICT, "There is no active imported dataset to export.");
        List<ExposureRecord> records = exposureRecordRepository.findByDatasetVersion(version);
        Set<String> headers = new LinkedHashSet<>();
        List<Map<String, Object>> rows = records.stream().map(record -> parseSource(record.getSourceDatasetJson())).toList();
        rows.forEach(row -> headers.addAll(row.keySet()));
        StringBuilder csv = new StringBuilder(); appendCsvRow(csv, headers.stream().toList());
        for (Map<String, Object> row : rows) appendCsvRow(csv, headers.stream().map(header -> row.getOrDefault(header, "")).map(String::valueOf).toList());
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=chromaguard_imported_source_dataset.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.toString());
    }

    private Map<String, Object> parseSource(String json) {
        if (json == null || json.isBlank()) return Map.of();
        try { return objectMapper.readValue(json, new TypeReference<LinkedHashMap<String, Object>>() {}); }
        catch (Exception ignored) { return Map.of(); }
    }

    private void appendCsvRow(StringBuilder csv, List<String> values) {
        StringJoiner row = new StringJoiner(",");
        values.forEach(value -> row.add("\"" + value.replace("\"", "\"\"") + "\""));
        csv.append(row).append("\r\n");
    }

    private void assertAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities().stream()
                .noneMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only administrators can import a dataset.");
        }
    }
}
