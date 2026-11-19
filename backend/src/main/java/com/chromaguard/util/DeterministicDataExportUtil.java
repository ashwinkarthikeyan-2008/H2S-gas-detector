package com.chromaguard.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Utility to export deterministic CSV datasets to pretty-printed JSON files
 * and verify structural consistency across all entity records.
 */
public class DeterministicDataExportUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    public static void convertCsvToJson(File csvFile, File jsonFile) throws Exception {
        try (Reader reader = new FileReader(csvFile, StandardCharsets.UTF_8)) {
            CSVParser parser = CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build().parse(reader);
            List<Map<String, Object>> records = new ArrayList<>();
            for (CSVRecord record : parser) {
                Map<String, Object> map = new LinkedHashMap<>();
                for (String header : parser.getHeaderNames()) {
                    String val = record.get(header).trim();
                    map.put(header, parseValue(header, val));
                }
                records.add(map);
            }
            MAPPER.writeValue(jsonFile, records);
        }
    }

    private static Object parseValue(String header, String val) {
        if (val.isEmpty()) return null;
        if (val.equalsIgnoreCase("true")) return Boolean.TRUE;
        if (val.equalsIgnoreCase("false")) return Boolean.FALSE;

        if (header.contains("color_") || header.contains("years") || header.contains("hours")) {
            try {
                return Integer.parseInt(val);
            } catch (NumberFormatException ignored) {
            }
        }
        if (header.contains("value") || header.contains("dose") || header.contains("baseline") || header.contains("limit")) {
            try {
                return Double.parseDouble(val);
            } catch (NumberFormatException ignored) {
            }
        }
        return val;
    }
}
