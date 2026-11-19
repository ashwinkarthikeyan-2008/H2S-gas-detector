package com.chromaguard.service;

import com.chromaguard.entity.ActiveDatasetState;
import com.chromaguard.repository.ActiveDatasetStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActiveDatasetService {
    private static final String STATE_ID = "active";
    private final ActiveDatasetStateRepository repository;

    public ActiveDatasetService(ActiveDatasetStateRepository repository) { this.repository = repository; }

    public String getActiveVersion() {
        return repository.findById(STATE_ID).map(ActiveDatasetState::getActiveDatasetVersion).orElse(null);
    }

    @Transactional
    public void activate(String version) {
        ActiveDatasetState state = repository.findById(STATE_ID).orElseGet(() -> new ActiveDatasetState(STATE_ID, null));
        state.setActiveDatasetVersion(version);
        repository.save(state);
    }

    @Transactional
    public void clear() {
        repository.findById(STATE_ID).ifPresent(state -> {
            state.setActiveDatasetVersion(null);
            repository.save(state);
        });
    }
}
