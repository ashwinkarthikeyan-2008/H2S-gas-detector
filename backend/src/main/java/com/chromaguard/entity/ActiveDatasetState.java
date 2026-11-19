package com.chromaguard.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "active_dataset_state")
public class ActiveDatasetState {
    @Id
    @Column(name = "state_id", length = 16)
    private String id;

    @Column(name = "active_dataset_version", length = 32)
    private String activeDatasetVersion;

    public ActiveDatasetState() {}

    public ActiveDatasetState(String id, String activeDatasetVersion) {
        this.id = id;
        this.activeDatasetVersion = activeDatasetVersion;
    }

    public String getId() { return id; }
    public String getActiveDatasetVersion() { return activeDatasetVersion; }
    public void setActiveDatasetVersion(String activeDatasetVersion) { this.activeDatasetVersion = activeDatasetVersion; }
}
