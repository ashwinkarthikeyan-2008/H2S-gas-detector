package com.chromaguard.repository;

import com.chromaguard.entity.LiveSensorReading;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LiveSensorReadingRepository extends JpaRepository<LiveSensorReading, Long> {
    Page<LiveSensorReading> findByWorkerIdOrderByTimestampDesc(String workerId, Pageable pageable);
}
