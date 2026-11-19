package com.chromaguard;

import com.chromaguard.repository.AlertRepository;
import com.chromaguard.repository.ExposureRecordRepository;
import com.chromaguard.repository.IndustrialZoneRepository;
import com.chromaguard.repository.WorkerRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("ChromaGuard Full Integration Tests")
class ChromaGuardApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private IndustrialZoneRepository zoneRepository;

    @Autowired
    private WorkerRepository workerRepository;

    @Autowired
    private ExposureRecordRepository exposureRecordRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Test
    @DisplayName("Context loads and seeded dataset is initialized properly")
    void contextLoadsAndDataIngested() {
        assertTrue(zoneRepository.count() >= 5, "Expected at least 5 industrial zones");
        assertTrue(workerRepository.count() >= 40, "Expected 40 synthetic workers");
        assertTrue(exposureRecordRepository.count() > 700, "Expected >700 exposure records");
        assertTrue(alertRepository.count() > 20, "Expected >20 simulated alerts");
    }

    @Test
    @DisplayName("Dashboard summary endpoint returns valid KPI structure")
    void testDashboardSummaryEndpoint() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalWorkers").value(40))
                .andExpect(jsonPath("$.totalRecords").isNumber())
                .andExpect(jsonPath("$.avgExposurePpmHr").isNumber())
                .andExpect(jsonPath("$.maxExposurePpmHr").isNumber())
                .andExpect(jsonPath("$.simulatedMode").value("SIMULATED_DEMO_DATA"));
    }

    @Test
    @DisplayName("Workers endpoint returns 40 synthetic workers")
    void testWorkersEndpoint() throws Exception {
        mockMvc.perform(get("/api/workers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(40));
    }

    @Test
    @DisplayName("Analytics descriptive statistics endpoint returns complete metrics")
    void testDescriptiveStatsEndpoint() throws Exception {
        mockMvc.perform(get("/api/analytics/descriptive-statistics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0].variableName").value("Illustrative Exposure Value"))
                .andExpect(jsonPath("$[0].mean").isNumber());
    }

    @Test
    @DisplayName("Analytics IQR Outlier detection endpoint returns valid methodology and results")
    void testOutliersEndpoint() throws Exception {
        mockMvc.perform(get("/api/analytics/outliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.iqr").isNumber())
                .andExpect(jsonPath("$.upperBound").isNumber())
                .andExpect(jsonPath("$.outlierRecords").isArray());
    }
}
