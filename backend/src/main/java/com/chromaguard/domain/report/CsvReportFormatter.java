package com.chromaguard.domain.report;

import com.chromaguard.domain.ExposureReport;
import com.chromaguard.domain.ZoneExposureSummary;

import java.io.StringWriter;

/**
 * Polymorphic implementation of {@link ReportFormatter} rendering reports in CSV format.
 * Extends {@link AbstractReportFormatter} as part of the Template Method pattern.
 */
public class CsvReportFormatter extends AbstractReportFormatter {

    @Override
    protected String renderReport(ExposureReport report) {

        StringWriter sw = new StringWriter();
        sw.append("# ChromaGuard Industrial Exposure Executive Summary Report\n");
        sw.append(String.format("# Generated: %s | Report ID: %s\n", report.getGeneratedAt(), report.getReportId()));
        sw.append(String.format("# Total Records: %d | Compliance: %.1f%% | Safety Index: %.1f\n\n",
                report.getTotalRecords(), report.getComplianceRate(), report.calculateSafetyIndex()));

        sw.append("Zone ID,Zone Name,Record Count,Avg Exposure (ppm*hr),Max Exposure (ppm*hr),Baseline Target,Exceedances,Target Met\n");
        for (ZoneExposureSummary z : report.getZoneSummaries()) {
            sw.append(String.format("%s,\"%s\",%d,%.2f,%.2f,%.2f,%d,%b\n",
                    z.getZoneId(),
                    z.getZoneName(),
                    z.getRecordCount(),
                    z.getAverageExposure(),
                    z.getMaxExposure(),
                    z.getBaselineTarget(),
                    z.getExceedanceCount(),
                    z.isWithinTargetBaseline()
            ));
        }
        return sw.toString();
    }

    @Override
    public String getContentType() {
        return "text/csv";
    }
}
