package com.chromaguard.dto;

import java.util.List;
import java.util.Map;

public class CorrelationReportDto {
    private List<String> variables;
    private Map<String, Map<String, Double>> correlationMatrix;
    private String methodology;
    private String observations;

    public CorrelationReportDto() {
    }

    public CorrelationReportDto(List<String> variables, Map<String, Map<String, Double>> correlationMatrix,
                                String methodology, String observations) {
        this.variables = variables;
        this.correlationMatrix = correlationMatrix;
        this.methodology = methodology;
        this.observations = observations;
    }

    public List<String> getVariables() {
        return variables;
    }

    public void setVariables(List<String> variables) {
        this.variables = variables;
    }

    public Map<String, Map<String, Double>> getCorrelationMatrix() {
        return correlationMatrix;
    }

    public void setCorrelationMatrix(Map<String, Map<String, Double>> correlationMatrix) {
        this.correlationMatrix = correlationMatrix;
    }

    public String getMethodology() {
        return methodology;
    }

    public void setMethodology(String methodology) {
        this.methodology = methodology;
    }

    public String getObservations() {
        return observations;
    }

    public void setObservations(String observations) {
        this.observations = observations;
    }
}
