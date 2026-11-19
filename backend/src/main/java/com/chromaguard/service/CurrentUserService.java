package com.chromaguard.service;

import com.chromaguard.repository.UserAccountRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {
    private final UserAccountRepository accounts;

    public CurrentUserService(UserAccountRepository accounts) {
        this.accounts = accounts;
    }

    public String workerId(Authentication authentication) {
        if (authentication == null) return null;
        return accounts.findByUsername(authentication.getName())
                .map(account -> account.getAssociatedWorkerId()).orElse(null);
    }

    public boolean isWorker(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_WORKER".equals(authority.getAuthority()));
    }
}
