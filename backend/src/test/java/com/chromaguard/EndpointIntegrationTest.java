package com.chromaguard;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("ChromaGuard Core REST API Integration Test Suite")
class EndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("1. GET /api/dashboard/summary - Validates high-level metrics and KPIs")
    void testGetDashboardSummary() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalWorkers", is(40)))
                .andExpect(jsonPath("$.totalRecords", greaterThanOrEqualTo(700)))
                .andExpect(jsonPath("$.avgExposurePpmHr", greaterThan(0.0)))
                .andExpect(jsonPath("$.maxExposurePpmHr", greaterThan(0.0)))
                .andExpect(jsonPath("$.simulatedMode", is("SIMULATED_DEMO_DATA")));
    }

    @Test
    @DisplayName("2. GET /api/dashboard/trends - Validates chronological exposure trend line series")
    void testGetDashboardTrends() throws Exception {
        mockMvc.perform(get("/api/dashboard/trends"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(15))))
                .andExpect(jsonPath("$[0].date", notNullValue()))
                .andExpect(jsonPath("$[0].avgExposurePpmHr", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$[0].recordCount", greaterThan(0)));
    }

    @Test
    @DisplayName("3. GET /api/dashboard/zone-comparison - Validates zone observed exposure vs target baseline")
    void testGetDashboardZoneComparison() throws Exception {
        mockMvc.perform(get("/api/dashboard/zone-comparison"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].zoneId", notNullValue()))
                .andExpect(jsonPath("$[0].zoneName", notNullValue()))
                .andExpect(jsonPath("$[0].avgExposurePpmHr", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$[0].baselineExposure", greaterThan(0.0)));
    }

    @Test
    @DisplayName("4. GET /api/dashboard/status-distribution - Validates categorical status counts for donut chart")
    void testGetDashboardStatusDistribution() throws Exception {
        mockMvc.perform(get("/api/dashboard/status-distribution"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(4))) // NORMAL, ELEVATED, WARNING, CRITICAL
                .andExpect(jsonPath("$[0].status", notNullValue()))
                .andExpect(jsonPath("$[0].percentage", greaterThanOrEqualTo(0.0)));
    }

    @Test
    @DisplayName("5. GET /api/workers - Validates directory of 40 synthetic workers with filtering")
    void testGetWorkers() throws Exception {
        mockMvc.perform(get("/api/workers"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(40)))
                .andExpect(jsonPath("$[0].id", startsWith("W-")))
                .andExpect(jsonPath("$[0].syntheticName", notNullValue()))
                .andExpect(jsonPath("$[0].assignedZoneId", startsWith("ZONE-")));
    }

    @Test
    @DisplayName("6. GET /api/workers/{id} - Validates single worker lookup")
    void testGetWorkerById() throws Exception {
        mockMvc.perform(get("/api/workers/W-101"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is("W-101")))
                .andExpect(jsonPath("$.syntheticName", is("Marcus Vance")))
                .andExpect(jsonPath("$.assignedZoneId", is("ZONE-01")));
    }

    @Test
    @DisplayName("7. GET /api/workers/{id}/exposure - Validates personal 20-day timeline series")
    void testGetWorkerExposureTimeline() throws Exception {
        mockMvc.perform(get("/api/workers/W-101/exposure"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThan(10))))
                .andExpect(jsonPath("$[0].workerId", is("W-101")))
                .andExpect(jsonPath("$[0].illustrativeExposureValue", greaterThan(0.0)));
    }

    @Test
    @DisplayName("8. GET /api/exposure-records - Validates filterable dosimeter observation records")
    void testGetExposureRecords() throws Exception {
        mockMvc.perform(get("/api/exposure-records?zoneId=ZONE-01&limit=50"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].zoneId", is("ZONE-01")))
                .andExpect(jsonPath("$[0].simulatedColorR", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$[0].simulatedColorG", greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$[0].simulatedColorB", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("9. GET /api/alerts - Validates threshold breach event records")
    void testGetAlerts() throws Exception {
        mockMvc.perform(get("/api/alerts"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThan(20))))
                .andExpect(jsonPath("$[0].id", startsWith("ALT-")))
                .andExpect(jsonPath("$[0].triggerValuePpmHr", greaterThanOrEqualTo(15.0)));
    }

    @Test
    @DisplayName("10. GET /api/analytics/descriptive-statistics - Validates statistical moments for DEV Lab")
    void testGetDescriptiveStatistics() throws Exception {
        mockMvc.perform(get("/api/analytics/descriptive-statistics"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(5)))
                .andExpect(jsonPath("$[0].variableName", is("Illustrative Exposure Value")))
                .andExpect(jsonPath("$[0].count", greaterThanOrEqualTo(700)))
                .andExpect(jsonPath("$[0].mean", greaterThan(0.0)))
                .andExpect(jsonPath("$[0].median", greaterThan(0.0)))
                .andExpect(jsonPath("$[0].iqr", greaterThan(0.0)));
    }

    @Test
    @DisplayName("11. GET /api/analytics/outliers - Validates Tukey's Fences outlier detection")
    void testGetOutliers() throws Exception {
        mockMvc.perform(get("/api/analytics/outliers"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.variableName", is("Illustrative Exposure Value")))
                .andExpect(jsonPath("$.totalRecords", greaterThanOrEqualTo(700)))
                .andExpect(jsonPath("$.q3", greaterThan(0.0)))
                .andExpect(jsonPath("$.upperBound", greaterThan(0.0)))
                .andExpect(jsonPath("$.outlierRecords", notNullValue()));
    }

    @Test
    @DisplayName("12. GET /api/reports/summary - Validates executive summary report payload")
    void testGetReportsSummary() throws Exception {
        mockMvc.perform(get("/api/reports/summary"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reportTitle", notNullValue()))
                .andExpect(jsonPath("$.datasetMetrics.totalRecords", greaterThanOrEqualTo(700)))
                .andExpect(jsonPath("$.zoneBreakdowns", hasSize(5)))
                .andExpect(jsonPath("$.disclaimer", containsString("ACADEMIC DEMO NOTICE")));
    }

    @Test
    @DisplayName("Error Handling: GET /api/workers/NON_EXISTENT returns standard 404 ErrorResponseDto")
    void testResourceNotFoundException() throws Exception {
        mockMvc.perform(get("/api/workers/INVALID-WORKER-999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", containsString("Worker not found")));
    }

    @Test
    @DisplayName("13. GET /api/reports/export/csv - Validates downloadable filtered exposure CSV format and headers")
    void testExportExposureCsv() throws Exception {
        mockMvc.perform(get("/api/reports/export/csv?zoneId=ZONE-01"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("chromaguard_exposure_records.csv")))
                .andExpect(content().string(containsString("record_id,worker_id,worker_name,zone_id,zone_code")))
                .andExpect(content().string(containsString("illustrative_exposure_ppm_hr,cumulative_dose_ppm_hr")));
    }

    @Test
    @DisplayName("14. GET /api/reports/export/alerts-csv - Validates downloadable simulated alerts CSV with simulation flag")
    void testExportAlertsCsv() throws Exception {
        mockMvc.perform(get("/api/reports/export/alerts-csv"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("chromaguard_simulated_alerts.csv")))
                .andExpect(content().string(containsString("alert_id,synthetic_worker_id,worker_name,zone_id")))
                .andExpect(content().string(containsString("SIMULATED_DEMO_ALERT")));
    }

    @Test
    @DisplayName("15. POST /api/alerts/{id}/acknowledge - Validates alert acknowledgement persistence")
    void testAcknowledgeAlertSuccess() throws Exception {
        String payload = """
                {
                    "actionNotes": "Industrial exhaust damper inspected and recalibrated.",
                    "acknowledgedBy": "Safety Lead Inspector"
                }
                """;
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/alerts/ALT-0001/acknowledge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is("ALT-0001")))
                .andExpect(jsonPath("$.acknowledged", is(true)))
                .andExpect(jsonPath("$.acknowledgedBy", is("Safety Lead Inspector")));
    }

    @Test
    @DisplayName("16. POST /api/alerts/{id}/acknowledge - Validates 404 on non-existent alert")
    void testAcknowledgeAlertNotFound() throws Exception {
        String payload = """
                {
                    "actionNotes": "Inspection completed.",
                    "acknowledgedBy": "Safety Lead"
                }
                """;
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/alerts/NON-EXISTENT-ALERT-999/acknowledge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")));
    }

    @Test
    @DisplayName("17. POST /api/alerts/{id}/acknowledge - Validates 400 on blank action notes (Bean Validation)")
    void testAcknowledgeAlertValidationError() throws Exception {
        String payload = """
                {
                    "actionNotes": "",
                    "acknowledgedBy": "Safety Lead"
                }
                """;
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/alerts/ALT-0001/acknowledge")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors", notNullValue()));
    }

    @Test
    @DisplayName("18. POST /api/auth/login - Validates BCrypt authentication and role extraction")
    void testAuthLoginSuccess() throws Exception {
        String payload = """
                {
                    "username": "admin",
                    "password": "admin123"
                }
                """;
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("admin")))
                .andExpect(jsonPath("$.role", is("ROLE_ADMIN")))
                .andExpect(jsonPath("$.token", notNullValue()));
    }

    @Test
    @DisplayName("19. POST /api/auth/login - Validates 401 unauthorized on bad credentials")
    void testAuthLoginFailure() throws Exception {
        String payload = """
                {
                    "username": "admin",
                    "password": "wrong-password-999"
                }
                """;
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", containsString("Invalid username or password")));
    }

    @Test
    @DisplayName("20. POST /api/auth/login - Validates 400 on blank username input")
    void testAuthLoginValidation() throws Exception {
        String payload = """
                {
                    "username": "",
                    "password": ""
                }
                """;
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.validationErrors", notNullValue()));
    }

    @Test
    @DisplayName("21. POST /api/demo/reset - Validates deterministic simulation database re-initialization")
    void testDemoReset() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/demo/reset"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.recordsLoaded", is(718)))
                .andExpect(jsonPath("$.alertsLoaded", is(40)));
    }

    @Test
    @DisplayName("22. GET /api/dashboard/summary - Gracefully handles empty filter range without division by zero")
    void testDashboardSummaryEmptyFilter() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary?startDate=2099-01-01&endDate=2099-01-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRecords", is(0)))
                .andExpect(jsonPath("$.totalWorkers", is(0)))
                .andExpect(jsonPath("$.avgExposurePpmHr", is(0.0)))
                .andExpect(jsonPath("$.maxExposurePpmHr", is(0.0)));
    }

    @Test
    @DisplayName("23. GET /api/dashboard/histogram - Validates frequency bin generation")
    void testDashboardHistogram() throws Exception {
        mockMvc.perform(get("/api/dashboard/histogram?bins=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(10)))
                .andExpect(jsonPath("$[0].binLabel", notNullValue()))
                .andExpect(jsonPath("$[0].count", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("24. GET /api/dashboard/heatmap - Validates zone-by-date matrix aggregation")
    void testDashboardHeatmap() throws Exception {
        mockMvc.perform(get("/api/dashboard/heatmap"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(20))))
                .andExpect(jsonPath("$[0].zoneCode", notNullValue()))
                .andExpect(jsonPath("$[0].date", notNullValue()))
                .andExpect(jsonPath("$[0].avgExposurePpmHr", greaterThanOrEqualTo(0.0)));
    }

    @Test
    @DisplayName("25. GET /api/zones/{id}/detail - Validates deep zone telemetry and stationed personnel")
    void testGetZoneDetail() throws Exception {
        mockMvc.perform(get("/api/zones/ZONE-04/detail"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is("ZONE-04")))
                .andExpect(jsonPath("$.zoneCode", is("DT")))
                .andExpect(jsonPath("$.riskTier", is("CRITICAL")))
                .andExpect(jsonPath("$.totalExposureRecords", greaterThan(0)))
                .andExpect(jsonPath("$.observedMeanExposure", greaterThan(0.0)))
                .andExpect(jsonPath("$.stationedWorkers", notNullValue()))
                .andExpect(jsonPath("$.statusBreakdown", notNullValue()))
                .andExpect(jsonPath("$.dataSource", containsString("SIMULATED")));
    }

    @Test
    @DisplayName("26. GET /api/zones/{id}/records - Validates paginated zone exposure log retrieval")
    void testGetZoneRecordsPaged() throws Exception {
        mockMvc.perform(get("/api/zones/ZONE-04/records?page=0&size=10&sortBy=timestamp&sortDirection=desc"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.content", hasSize(10)))
                .andExpect(jsonPath("$.totalElements", greaterThan(10)))
                .andExpect(jsonPath("$.number", is(0)))
                .andExpect(jsonPath("$.size", is(10)))
                .andExpect(jsonPath("$.content[0].zoneId", is("ZONE-04")));
    }

    @Test
    @DisplayName("27. GET /api/zones/{id}/detail - Validates 404 error handling for non-existent zone")
    void testGetZoneDetailNotFound() throws Exception {
        mockMvc.perform(get("/api/zones/ZONE-NONEXISTENT/detail"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", containsString("ZONE-NONEXISTENT")));
    }

    @Test
    @DisplayName("28. GET /api/reports/formal - Validates structured formal exposure report DTO")
    void testGetFormalExposureReport() throws Exception {
        mockMvc.perform(get("/api/reports/formal"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.reportId", notNullValue()))
                .andExpect(jsonPath("$.totalRecords", greaterThan(0)))
                .andExpect(jsonPath("$.complianceRate", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.safetyIndex", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.zoneBreakdowns", hasSize(5)));
    }

    @Test
    @DisplayName("29. GET /api/reports/export/json - Validates downloadable formal JSON stream")
    void testExportFormalReportJson() throws Exception {
        mockMvc.perform(get("/api/reports/export/json"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(header().string("Content-Disposition", containsString("attachment; filename=chromaguard_formal_report.json")))
                .andExpect(jsonPath("$.reportId", notNullValue()))
                .andExpect(jsonPath("$.reportTitle", notNullValue()))
                .andExpect(jsonPath("$.totalRecords", greaterThan(0)))
                .andExpect(jsonPath("$.complianceRatePercent", greaterThanOrEqualTo(0.0)))
                .andExpect(jsonPath("$.safetyIndex", greaterThanOrEqualTo(0.0)));
    }
}
