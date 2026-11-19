package com.chromaguard.config;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** In-memory bearer sessions for the application's seeded demonstration accounts. */
@Service
public class DemoSessionService {
    private final Map<String, String> sessions = new ConcurrentHashMap<>();

    public String create(String username) {
        String token = UUID.randomUUID().toString();
        sessions.put(token, username);
        return token;
    }

    public String findUsername(String token) {
        return sessions.get(token);
    }

    public void updateUsername(String oldUsername, String newUsername) {
        sessions.replaceAll((token, username) -> username.equals(oldUsername) ? newUsername : username);
    }
}
