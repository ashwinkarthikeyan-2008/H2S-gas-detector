package com.chromaguard.repository;

import com.chromaguard.entity.Worker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkerRepository extends JpaRepository<Worker, String> {

    List<Worker> findByAssignedZoneId(String zoneId);

    long countByAssignedZoneId(String zoneId);

    List<Worker> findByPreferredShiftId(String shiftId);

    @Query("SELECT w FROM Worker w WHERE LOWER(w.syntheticName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.id) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(w.role) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Worker> searchWorkers(String query);
}
