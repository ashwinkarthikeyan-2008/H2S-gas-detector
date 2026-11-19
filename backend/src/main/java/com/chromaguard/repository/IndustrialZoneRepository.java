package com.chromaguard.repository;

import com.chromaguard.entity.IndustrialZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IndustrialZoneRepository extends JpaRepository<IndustrialZone, String> {
    Optional<IndustrialZone> findByZoneCode(String zoneCode);
    Optional<IndustrialZone> findByZoneCodeIgnoreCase(String zoneCode);
    boolean existsByZoneCodeIgnoreCase(String zoneCode);
    boolean existsByZoneCodeIgnoreCaseAndIdNot(String zoneCode, String id);
}
