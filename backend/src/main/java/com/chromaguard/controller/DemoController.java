package com.chromaguard.controller;

import com.chromaguard.dto.DemoResetResponseDto;
import com.chromaguard.service.DemoResetService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/demo")
@CrossOrigin(origins = "*")
public class DemoController {

    private final DemoResetService demoResetService;

    @Value("${chromaguard.demo.disclaimer}")
    private String disclaimer;

    @Value("${chromaguard.demo.thresholds.elevated-ppm-hr}")
    private double elevatedThreshold;

    @Value("${chromaguard.demo.thresholds.warning-ppm-hr}")
    private double warningThreshold;

    @Value("${chromaguard.demo.thresholds.critical-ppm-hr}")
    private double criticalThreshold;

    public DemoController(DemoResetService demoResetService) {
        this.demoResetService = demoResetService;
    }

    @PostMapping("/reset")
    public ResponseEntity<DemoResetResponseDto> resetDemo(Authentication authentication) {
        String user = authentication != null ? authentication.getName() : "admin (demonstration)";
        DemoResetResponseDto response = demoResetService.resetDemoState(user);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getDemoInfo() {
        return ResponseEntity.ok(Map.of(
                "platform", "ChromaGuard — H2S Exposure Monitoring & Data Intelligence Platform",
                "version", "1.0.0-PROTOTYPE",
                "mode", "SIMULATION_EDUCATIONAL",
                "disclaimer", disclaimer,
                "configuredThresholds", Map.of(
                        "elevatedPpmHr", elevatedThreshold,
                        "warningPpmHr", warningThreshold,
                        "criticalPpmHr", criticalThreshold
                ),
                "isSyntheticData", true,
                "hardwareRequired", false
        ));
    }
}
