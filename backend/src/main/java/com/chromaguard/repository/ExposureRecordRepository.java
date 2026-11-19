package com.chromaguard.repository;

import com.chromaguard.entity.DemoStatus;
import com.chromaguard.entity.ExposureRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExposureRecordRepository extends JpaRepository<ExposureRecord, String> {

    List<ExposureRecord> findByDatasetVersion(String datasetVersion);

    List<ExposureRecord> findByWorkerIdOrderByTimestampDesc(String workerId);

    List<ExposureRecord> findByZoneIdOrderByTimestampDesc(String zoneId);

    long countByZoneId(String zoneId);

    List<ExposureRecord> findByDemoStatus(DemoStatus demoStatus);

    @Query("SELECT r FROM ExposureRecord r WHERE " +
           "(:startDate IS NULL OR r.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR r.timestamp <= :endDate) AND " +
           "(:zoneId IS NULL OR r.zone.id = :zoneId) AND " +
           "(:shiftId IS NULL OR r.shift.id = :shiftId) AND " +
           "(:workerId IS NULL OR r.worker.id = :workerId) AND " +
           "(:demoStatus IS NULL OR r.demoStatus = :demoStatus) " +
           "ORDER BY r.timestamp DESC")
    List<ExposureRecord> findWithFilters(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("zoneId") String zoneId,
            @Param("shiftId") String shiftId,
            @Param("workerId") String workerId,
            @Param("demoStatus") DemoStatus demoStatus);

    @Query("SELECT r FROM ExposureRecord r WHERE " +
           "(:activeVersion IS NULL OR r.datasetVersion = :activeVersion) AND " +
           "(:startDate IS NULL OR r.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR r.timestamp <= :endDate) AND " +
           "(:zoneId IS NULL OR r.zone.id = :zoneId) AND " +
           "(:shiftId IS NULL OR r.shift.id = :shiftId) AND " +
           "(:workerId IS NULL OR r.worker.id = :workerId) AND " +
           "(:demoStatus IS NULL OR r.demoStatus = :demoStatus) " +
           "ORDER BY r.timestamp DESC")
    List<ExposureRecord> findWithActiveDatasetFilters(
            @Param("activeVersion") String activeVersion,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("zoneId") String zoneId,
            @Param("shiftId") String shiftId,
            @Param("workerId") String workerId,
            @Param("demoStatus") DemoStatus demoStatus);

    @Query("SELECT r FROM ExposureRecord r WHERE " +
           "(:startDate IS NULL OR r.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR r.timestamp <= :endDate) AND " +
           "(:zoneId IS NULL OR r.zone.id = :zoneId) AND " +
           "(:shiftId IS NULL OR r.shift.id = :shiftId) AND " +
           "(:workerId IS NULL OR r.worker.id = :workerId) AND " +
           "(:demoStatus IS NULL OR r.demoStatus = :demoStatus)")
    Page<ExposureRecord> findWithFiltersPaged(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("zoneId") String zoneId,
            @Param("shiftId") String shiftId,
            @Param("workerId") String workerId,
            @Param("demoStatus") DemoStatus demoStatus,
            Pageable pageable);

    @Query("SELECT r FROM ExposureRecord r WHERE r.datasetVersion = :activeVersion AND " +
           "(:startDate IS NULL OR r.timestamp >= :startDate) AND " +
           "(:endDate IS NULL OR r.timestamp <= :endDate) AND " +
           "(:zoneId IS NULL OR r.zone.id = :zoneId) AND " +
           "(:shiftId IS NULL OR r.shift.id = :shiftId) AND " +
           "(:demoStatus IS NULL OR r.demoStatus = :demoStatus)")
    Page<ExposureRecord> findActiveDatasetRecordsPaged(
            @Param("activeVersion") String activeVersion,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("zoneId") String zoneId,
            @Param("shiftId") String shiftId,
            @Param("demoStatus") DemoStatus demoStatus,
            Pageable pageable);

    @Query("SELECT COUNT(r) FROM ExposureRecord r WHERE r.demoStatus = :status")
    long countByDemoStatus(@Param("status") DemoStatus status);
}
