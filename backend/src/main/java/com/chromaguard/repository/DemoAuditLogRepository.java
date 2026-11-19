package com.chromaguard.repository;

import com.chromaguard.entity.DemoAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemoAuditLogRepository extends JpaRepository<DemoAuditLog, Long> {
    List<DemoAuditLog> findTop20ByOrderByLoggedAtDesc();
}
