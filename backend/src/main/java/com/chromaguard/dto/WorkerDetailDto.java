package com.chromaguard.dto;

import java.util.List;

public class WorkerDetailDto {
    private WorkerSummaryDto summary;
    private List<ExposureRecordDto> recentRecords;
    private List<AlertDto> alerts;
    private List<TrendPointDto> exposureTrend;

    public WorkerDetailDto() {
    }

    public WorkerDetailDto(WorkerSummaryDto summary, List<ExposureRecordDto> recentRecords,
                           List<AlertDto> alerts, List<TrendPointDto> exposureTrend) {
        this.summary = summary;
        this.recentRecords = recentRecords;
        this.alerts = alerts;
        this.exposureTrend = exposureTrend;
    }

    public WorkerSummaryDto getSummary() {
        return summary;
    }

    public void setSummary(WorkerSummaryDto summary) {
        this.summary = summary;
    }

    public List<ExposureRecordDto> getRecentRecords() {
        return recentRecords;
    }

    public void setRecentRecords(List<ExposureRecordDto> recentRecords) {
        this.recentRecords = recentRecords;
    }

    public List<AlertDto> getAlerts() {
        return alerts;
    }

    public void setAlerts(List<AlertDto> alerts) {
        this.alerts = alerts;
    }

    public List<TrendPointDto> getExposureTrend() {
        return exposureTrend;
    }

    public void setExposureTrend(List<TrendPointDto> exposureTrend) {
        this.exposureTrend = exposureTrend;
    }
}
