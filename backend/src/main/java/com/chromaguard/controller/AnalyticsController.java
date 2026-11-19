package com.chromaguard.controller;

import com.chromaguard.dto.CorrelationReportDto;
import com.chromaguard.dto.DatasetSummaryDto;
import com.chromaguard.dto.DescriptiveStatsDto;
import com.chromaguard.dto.OutlierReportDto;
import com.chromaguard.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/descriptive-statistics")
    public ResponseEntity<List<DescriptiveStatsDto>> getDescriptiveStatistics() {
        return ResponseEntity.ok(analyticsService.getAllDescriptiveStatistics());
    }

    @GetMapping("/outliers")
    public ResponseEntity<OutlierReportDto> getOutliers() {
        return ResponseEntity.ok(analyticsService.detectOutliers());
    }

    @GetMapping("/correlation")
    public ResponseEntity<CorrelationReportDto> getCorrelation() {
        return ResponseEntity.ok(analyticsService.computeCorrelationMatrix());
    }

    @GetMapping("/dataset-summary")
    public ResponseEntity<DatasetSummaryDto> getDatasetSummary() {
        return ResponseEntity.ok(analyticsService.getDatasetSummary());
    }
}
