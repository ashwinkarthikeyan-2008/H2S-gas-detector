package com.chromaguard.repository;

import com.chromaguard.entity.Alert;
import com.chromaguard.entity.DemoStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, String> {

    List<Alert> findByIsAcknowledgedFalseOrderByTimestampDesc();

    List<Alert> findByWorkerIdOrderByTimestampDesc(String workerId);

    List<Alert> findByZoneIdOrderByTimestampDesc(String zoneId);

    long countByZoneId(String zoneId);

    @Query("SELECT a FROM Alert a WHERE " +
           "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR a.timestamp <= :endDate) AND " +
           "(:zoneId IS NULL OR a.zone.id = :zoneId) AND " +
           "(:workerId IS NULL OR a.worker.id = :workerId) AND " +
           "(:severity IS NULL OR a.demoSeverity = :severity) AND " +
           "(:isAcknowledged IS NULL OR a.isAcknowledged = :isAcknowledged) " +
           "ORDER BY a.timestamp DESC")
    List<Alert> findWithFilters(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("zoneId") String zoneId,
            @Param("workerId") String workerId,
            @Param("severity") DemoStatus severity,
            @Param("isAcknowledged") Boolean isAcknowledged);

    @Query("SELECT a FROM Alert a WHERE " +
           "(:activeVersion IS NULL OR a.exposureRecord.datasetVersion = :activeVersion) AND " +
           "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR a.timestamp <= :endDate) AND " +
           "(:zoneId IS NULL OR a.zone.id = :zoneId) AND " +
           "(:workerId IS NULL OR a.worker.id = :workerId) AND " +
           "(:severity IS NULL OR a.demoSeverity = :severity) AND " +
           "(:isAcknowledged IS NULL OR a.isAcknowledged = :isAcknowledged) " +
           "ORDER BY a.timestamp DESC")
    List<Alert> findWithActiveDatasetFilters(
            @Param("activeVersion") String activeVersion,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("zoneId") String zoneId,
            @Param("workerId") String workerId,
            @Param("severity") DemoStatus severity,
            @Param("isAcknowledged") Boolean isAcknowledged);

    @Query("SELECT a FROM Alert a WHERE " +
           "(:startDate IS NULL OR a.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR a.timestamp <= :endDate) AND " +
           "(:zoneId IS NULL OR a.zone.id = :zoneId) AND " +
           "(:workerId IS NULL OR a.worker.id = :workerId) AND " +
           "(:severity IS NULL OR a.demoSeverity = :severity) AND " +
           "(:isAcknowledged IS NULL OR a.isAcknowledged = :isAcknowledged)")
    Page<Alert> findWithFiltersPaged(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("zoneId") String zoneId,
            @Param("workerId") String workerId,
            @Param("severity") DemoStatus severity,
            @Param("isAcknowledged") Boolean isAcknowledged,
            Pageable pageable);

    long countByIsAcknowledgedFalse();

    long countByWorker_IdAndIsAcknowledgedFalse(String workerId);

    @Query("SELECT COUNT(a) FROM Alert a WHERE NOT a.isAcknowledged AND " +
           "(:activeVersion IS NULL OR a.exposureRecord.datasetVersion = :activeVersion)")
    long countOpenForActiveDataset(@Param("activeVersion") String activeVersion);
}
