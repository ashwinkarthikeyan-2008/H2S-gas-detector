package com.chromaguard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.security.core.userdetails.UserDetailsService userDetailsService(
            com.chromaguard.repository.UserAccountRepository userAccountRepository) {
        return username -> {
            com.chromaguard.entity.UserAccount account = userAccountRepository.findByUsername(username)
                    .orElseThrow(() -> new org.springframework.security.core.userdetails.UsernameNotFoundException("User not found: " + username));
            return org.springframework.security.core.userdetails.User.builder()
                    .username(account.getUsername())
                    .password(account.getPasswordHash())
                    .authorities(account.getRole().name())
                    .build();
        };
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, DemoSessionService sessions,
                                                  com.chromaguard.repository.UserAccountRepository accounts) throws Exception {
        http
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/h2-console/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/favicon.ico", "/error").permitAll()
                        .requestMatchers("/api/auth/login", "/api/auth/register").permitAll()
                        // Public, read-only choices required before a worker can register.
                        .requestMatchers(HttpMethod.GET, "/api/zones", "/api/shifts").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        .requestMatchers("/api/demo/info").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/reports/export/csv", "/api/reports/export/alerts-csv")
                            .hasAnyAuthority("ROLE_ADMIN", "ROLE_WORKER")
                        .requestMatchers("/api/analytics/**", "/api/reports/**")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/alerts/*/acknowledge", "/api/demo/reset")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/live-sensor-readings")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/live-sensor-readings/**")
                            .hasAnyAuthority("ROLE_ADMIN", "ROLE_WORKER")
                        .requestMatchers(HttpMethod.POST, "/api/zones")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/zones/**")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/zones/**")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/zones/**")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/zones/manage")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/zones/*/detail", "/api/zones/*/records")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/workers/**", "/api/exposure-records/**", "/api/alerts/**")
                            .hasAnyAuthority("ROLE_ADMIN", "ROLE_WORKER")
                        .requestMatchers("/api/dashboard/worker-comparison")
                            .hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(new DemoBearerAuthenticationFilter(sessions, accounts), UsernamePasswordAuthenticationFilter.class)
                .httpBasic(AbstractHttpConfigurer::disable);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:8080",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:3000"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
