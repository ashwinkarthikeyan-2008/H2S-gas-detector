package com.chromaguard.controller;

import com.chromaguard.dto.LoginRequestDto;
import com.chromaguard.dto.LoginResponseDto;
import com.chromaguard.dto.RegisterRequestDto;
import com.chromaguard.dto.AdminProfileUpdateDto;
import com.chromaguard.config.DemoSessionService;
import com.chromaguard.entity.UserAccount;
import com.chromaguard.entity.UserRole;
import com.chromaguard.repository.UserAccountRepository;
import com.chromaguard.repository.WorkerRepository;
import com.chromaguard.repository.IndustrialZoneRepository;
import com.chromaguard.repository.ShiftRepository;
import com.chromaguard.entity.Worker;
import com.chromaguard.entity.IndustrialZone;
import com.chromaguard.entity.Shift;
import com.chromaguard.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private static final int MAX_FAILED_ATTEMPTS = 4;
    private static final long LOCKOUT_MILLIS = 30 * 60 * 1000L;
    private final ConcurrentHashMap<String, AtomicInteger> failedAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lockedUntil = new ConcurrentHashMap<>();

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final DemoSessionService sessions;
    private final WorkerRepository workerRepository;
    private final IndustrialZoneRepository zoneRepository;
    private final ShiftRepository shiftRepository;

    public AuthController(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder, DemoSessionService sessions,
                          WorkerRepository workerRepository, IndustrialZoneRepository zoneRepository, ShiftRepository shiftRepository) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessions = sessions;
        this.workerRepository = workerRepository;
        this.zoneRepository = zoneRepository;
        this.shiftRepository = shiftRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        String username = request.getUsername().trim().toLowerCase(Locale.ROOT);
        long now = System.currentTimeMillis();
        Long lockEnd = lockedUntil.get(username);
        if (lockEnd != null && lockEnd > now) {
            long minutes = Math.max(1, (lockEnd - now + 59_999) / 60_000);
            return ResponseEntity.status(HttpStatus.LOCKED)
                    .body(new LoginResponseDto(null, null, null, null, null, "Account locked. Try again in " + minutes + " minutes."));
        }
        if (lockEnd != null) lockedUntil.remove(username, lockEnd);

        Optional<UserAccount> userOpt = userAccountRepository.findByUsername(username);
        boolean valid = userOpt.isPresent()
                && userOpt.get().getRole() != null
                && (userOpt.get().getRole().name().equals("ROLE_ADMIN") || userOpt.get().getRole().name().equals("ROLE_WORKER"))
                && passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash());
        if (!valid) {
            int attempts = failedAttempts.computeIfAbsent(username, key -> new AtomicInteger()).incrementAndGet();
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                lockedUntil.put(username, now + LOCKOUT_MILLIS);
                failedAttempts.remove(username);
                return ResponseEntity.status(HttpStatus.LOCKED)
                        .body(new LoginResponseDto(null, null, null, null, null, "Too many wrong entries. Login is locked for 30 minutes."));
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new LoginResponseDto(null, null, null, null, null, "Wrong entry. " + (MAX_FAILED_ATTEMPTS - attempts) + " attempt(s) remaining."));
        }

        UserAccount user = userOpt.get();
        failedAttempts.remove(username);
        // Generate development session token for educational simulation
        String token = sessions.create(user.getUsername());

        return ResponseEntity.ok(new LoginResponseDto(
                token,
                user.getUsername(),
                user.getRole().name(),
                user.getFullName(),
                user.getAssociatedWorkerId(),
                "Authentication successful"
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponseDto> register(@Valid @RequestBody RegisterRequestDto request) {
        String username = request.getUsername().trim().toLowerCase(Locale.ROOT);
        String fullName = request.getFullName().trim();
        String roleValue = request.getRole().trim().toUpperCase(Locale.ROOT);

        if (!username.matches("[a-z0-9._-]{3,32}")) {
            return ResponseEntity.badRequest().body(new LoginResponseDto(null, null, null, null, null,
                    "Username must be 3–32 characters and use letters, numbers, dot, underscore or hyphen."));
        }
        if (fullName.length() > 100) {
            return ResponseEntity.badRequest().body(new LoginResponseDto(null, null, null, null, null,
                    "Name must be 100 characters or fewer."));
        }
        if (request.getPassword().length() < 10 || request.getPassword().length() > 72) {
            return ResponseEntity.badRequest().body(new LoginResponseDto(null, null, null, null, null,
                    "Password must be between 10 and 72 characters."));
        }
        UserRole role;
        if ("ADMIN".equals(roleValue) || "ROLE_ADMIN".equals(roleValue)) {
            role = UserRole.ROLE_ADMIN;
        } else if ("WORKER".equals(roleValue) || "ROLE_WORKER".equals(roleValue)) {
            role = UserRole.ROLE_WORKER;
        } else {
            return ResponseEntity.badRequest().body(new LoginResponseDto(null, null, null, null, null,
                    "Only worker and admin accounts can be registered."));
        }
        if (userAccountRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new LoginResponseDto(null, null, null, null, null,
                    "That username is already taken. Choose another one."));
        }

        String associatedWorkerId = null;
        if (role == UserRole.ROLE_WORKER) {
            if (request.getZoneId() == null || request.getZoneId().isBlank()
                    || request.getShiftId() == null || request.getShiftId().isBlank()) {
                return ResponseEntity.badRequest().body(new LoginResponseDto(null, null, null, null, null,
                        "Workers must select their zone and shift."));
            }
            IndustrialZone zone = zoneRepository.findById(request.getZoneId())
                    .orElseThrow(() -> new ResourceNotFoundException("Zone", "id", request.getZoneId()));
            Shift shift = shiftRepository.findById(request.getShiftId())
                    .orElseThrow(() -> new ResourceNotFoundException("Shift", "id", request.getShiftId()));
            associatedWorkerId = "WRK-" + username;
            if (workerRepository.existsById(associatedWorkerId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(new LoginResponseDto(null, null, null, null, null,
                        "A worker profile already exists for this username."));
            }
            Worker worker = new Worker(associatedWorkerId, fullName, zone, shift, "Registered Worker", 0, "BADGE-" + username);
            workerRepository.save(worker);
        }
        UserAccount account = new UserAccount(username, passwordEncoder.encode(request.getPassword()), role, fullName, associatedWorkerId);
        userAccountRepository.save(account);
        failedAttempts.remove(username);
        lockedUntil.remove(username);
        String token = sessions.create(username);
        return ResponseEntity.status(HttpStatus.CREATED).body(new LoginResponseDto(
                token, username, role.name(), fullName, null, "Account created successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponseDto> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username = authentication.getName();
        return userAccountRepository.findByUsername(username)
                .map(u -> ResponseEntity.ok(new LoginResponseDto(
                        "cg-active-token",
                        u.getUsername(),
                        u.getRole().name(),
                        u.getFullName(),
                        u.getAssociatedWorkerId(),
                        "Active session",
                        u.getEmail(),
                        u.getPhoneNumber()
                )))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @PatchMapping("/profile")
    public ResponseEntity<LoginResponseDto> updateAdminProfile(Authentication authentication,
                                                                @Valid @RequestBody AdminProfileUpdateDto request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserAccount account = userAccountRepository.findByUsername(authentication.getName()).orElse(null);
        if (account == null || account.getRole() != UserRole.ROLE_ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String oldUsername = account.getUsername();
        String newUsername = request.getUsername().trim().toLowerCase(Locale.ROOT);
        String fullName = request.getFullName().trim();
        if (!newUsername.matches("[a-z0-9._-]{3,32}")) {
            return ResponseEntity.badRequest().body(new LoginResponseDto(null, null, null, null, null,
                    "Admin ID must be 3–32 characters and use letters, numbers, dot, underscore or hyphen."));
        }
        if (!oldUsername.equals(newUsername) && userAccountRepository.existsByUsername(newUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(new LoginResponseDto(null, null, null, null, null,
                    "That Admin ID is already in use."));
        }

        account.setUsername(newUsername);
        account.setFullName(fullName);
        account.setEmail(normalizeOptional(request.getEmail()));
        account.setPhoneNumber(normalizeOptional(request.getPhoneNumber()));
        userAccountRepository.save(account);
        if (!oldUsername.equals(newUsername)) sessions.updateUsername(oldUsername, newUsername);
        return ResponseEntity.ok(new LoginResponseDto(null, newUsername, account.getRole().name(), fullName,
                null, "Admin profile updated successfully", account.getEmail(), account.getPhoneNumber()));
    }

    private String normalizeOptional(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }
}
