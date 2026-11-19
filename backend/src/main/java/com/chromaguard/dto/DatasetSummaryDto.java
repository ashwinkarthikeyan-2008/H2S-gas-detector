package com.chromaguard.dto;

import java.util.List;
import java.util.Map;

public class DatasetSummaryDto {
    private String datasetName;
    private String version;
    private long totalRows;
    private int totalColumns;
    private List<ColumnMetaDto> columns;
    private long missingValuesCount;
    private long duplicateRecordsCount;
    private long invalidRecordsCount;
    private String dataQualityStatus;
    private String preparationMethodology;

    public static class ColumnMetaDto {
        private String name;
        private String dataType;
        private String description;
        private boolean isNullable;
        private long nonNullCount;

        public ColumnMetaDto() {
        }

        public ColumnMetaDto(String name, String dataType, String description, boolean isNullable, long nonNullCount) {
            this.name = name;
            this.dataType = dataType;
            this.description = description;
            this.isNullable = isNullable;
            this.nonNullCount = nonNullCount;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDataType() {
            return dataType;
        }

        public void setDataType(String dataType) {
            this.dataType = dataType;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public boolean isNullable() {
            return isNullable;
        }

        public void setNullable(boolean nullable) {
            isNullable = nullable;
        }

        public long getNonNullCount() {
            return nonNullCount;
        }

        public void setNonNullCount(long nonNullCount) {
            this.nonNullCount = nonNullCount;
        }
    }

    public DatasetSummaryDto() {
    }

    public DatasetSummaryDto(String datasetName, String version, long totalRows, int totalColumns,
                             List<ColumnMetaDto> columns, long missingValuesCount,
                             long duplicateRecordsCount, long invalidRecordsCount,
                             String dataQualityStatus, String preparationMethodology) {
        this.datasetName = datasetName;
        this.version = version;
        this.totalRows = totalRows;
        this.totalColumns = totalColumns;
        this.columns = columns;
        this.missingValuesCount = missingValuesCount;
        this.duplicateRecordsCount = duplicateRecordsCount;
        this.invalidRecordsCount = invalidRecordsCount;
        this.dataQualityStatus = dataQualityStatus;
        this.preparationMethodology = preparationMethodology;
    }

    public String getDatasetName() {
        return datasetName;
    }

    public void setDatasetName(String datasetName) {
        this.datasetName = datasetName;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public long getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(long totalRows) {
        this.totalRows = totalRows;
    }

    public int getTotalColumns() {
        return totalColumns;
    }

    public void setTotalColumns(int totalColumns) {
        this.totalColumns = totalColumns;
    }

    public List<ColumnMetaDto> getColumns() {
        return columns;
    }

    public void setColumns(List<ColumnMetaDto> columns) {
        this.columns = columns;
    }

    public long getMissingValuesCount() {
        return missingValuesCount;
    }

    public void setMissingValuesCount(long missingValuesCount) {
        this.missingValuesCount = missingValuesCount;
    }

    public long getDuplicateRecordsCount() {
        return duplicateRecordsCount;
    }

    public void setDuplicateRecordsCount(long duplicateRecordsCount) {
        this.duplicateRecordsCount = duplicateRecordsCount;
    }

    public long getInvalidRecordsCount() {
        return invalidRecordsCount;
    }

    public void setInvalidRecordsCount(long invalidRecordsCount) {
        this.invalidRecordsCount = invalidRecordsCount;
    }

    public String getDataQualityStatus() {
        return dataQualityStatus;
    }

    public void setDataQualityStatus(String dataQualityStatus) {
        this.dataQualityStatus = dataQualityStatus;
    }

    public String getPreparationMethodology() {
        return preparationMethodology;
    }

    public void setPreparationMethodology(String preparationMethodology) {
        this.preparationMethodology = preparationMethodology;
    }
}
