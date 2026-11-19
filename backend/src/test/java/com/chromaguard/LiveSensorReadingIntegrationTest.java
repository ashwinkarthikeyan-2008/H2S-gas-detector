package com.chromaguard;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:live_sensor_test;DB_CLOSE_DELAY=-1;NON_KEYWORDS=USER,VALUE",
        "spring.datasource.username=sa",
        "spring.datasource.password=password"
})
@AutoConfigureMockMvc
@Transactional
@Rollback
class LiveSensorReadingIntegrationTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void adminCanStoreSharedDeviceHistoryAndWorkerCanOnlyReadOwn() throws Exception {
        JsonNode zones = objectMapper.readTree(mockMvc.perform(get("/api/zones"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        JsonNode shifts = objectMapper.readTree(mockMvc.perform(get("/api/shifts"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        String username = "sensor" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.createObjectNode()
                                .put("username", username)
                                .put("fullName", "Sensor History Worker")
                                .put("password", "sensorTest123!")
                                .put("role", "WORKER")
                                .put("zoneId", zones.get(0).get("id").asText())
                                .put("shiftId", shifts.get(0).get("id").asText())
                                .toString()))
                .andExpect(status().isCreated());

        String workerId = "WRK-" + username;
        String adminToken = login("admin", "admin123");
        String workerToken = login(username, "sensorTest123!");
        String reading = objectMapper.createObjectNode()
                .put("workerId", workerId)
                .put("h2sPpm", 2.4)
                .put("mq2Raw", 412)
                .put("mq2Ppm", 31)
                .put("temperatureC", 25.3)
                .put("humidityPercent", 48.0)
                .put("batteryPercent", 82.0)
                .toString();

        mockMvc.perform(post("/api/live-sensor-readings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reading))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.workerId", is(workerId)))
                .andExpect(jsonPath("$.h2sPpm", is(2.4)));

        mockMvc.perform(get("/api/live-sensor-readings/workers/{workerId}", workerId)
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].workerId", is(workerId)))
                .andExpect(jsonPath("$[0].mq2Raw", is(412.0)));

        mockMvc.perform(get("/api/live-sensor-readings/workers/W-101")
                        .header("Authorization", "Bearer " + workerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/live-sensor-readings")
                        .header("Authorization", "Bearer " + workerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reading))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsEmptySensorPayloadAndOversizedHistoryPage() throws Exception {
        String adminToken = login("admin", "admin123");
        String emptyReading = objectMapper.createObjectNode()
                .put("workerId", "W-101")
                .toString();

        mockMvc.perform(post("/api/live-sensor-readings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emptyReading))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/live-sensor-readings/workers/W-101?page=0&size=101")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    private String login(String username, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.createObjectNode()
                                .put("username", username)
                                .put("password", password)
                                .toString()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("token").asText();
    }
}
