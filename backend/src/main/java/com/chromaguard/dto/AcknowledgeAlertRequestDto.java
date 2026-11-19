package com.chromaguard.dto;

import jakarta.validation.constraints.NotBlank;

public class AcknowledgeAlertRequestDto {

    private String acknowledgedBy;

    @NotBlank(message = "Action notes must be provided upon acknowledgement")
    private String actionNotes;

    public AcknowledgeAlertRequestDto() {
    }

    public AcknowledgeAlertRequestDto(String acknowledgedBy, String actionNotes) {
        this.acknowledgedBy = acknowledgedBy;
        this.actionNotes = actionNotes;
    }

    public String getAcknowledgedBy() {
        return acknowledgedBy;
    }

    public void setAcknowledgedBy(String acknowledgedBy) {
        this.acknowledgedBy = acknowledgedBy;
    }

    public String getActionNotes() {
        return actionNotes;
    }

    public void setActionNotes(String actionNotes) {
        this.actionNotes = actionNotes;
    }
}
