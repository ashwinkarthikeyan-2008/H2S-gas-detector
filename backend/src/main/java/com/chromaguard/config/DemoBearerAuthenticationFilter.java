package com.chromaguard.config;

import com.chromaguard.entity.UserAccount;
import com.chromaguard.repository.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class DemoBearerAuthenticationFilter extends OncePerRequestFilter {
    private final DemoSessionService sessions;
    private final UserAccountRepository accounts;

    public DemoBearerAuthenticationFilter(DemoSessionService sessions, UserAccountRepository accounts) {
        this.sessions = sessions;
        this.accounts = accounts;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String username = sessions.findUsername(header.substring(7));
            if (username != null) {
                UserAccount account = accounts.findByUsername(username).orElse(null);
                if (account != null) {
                    var authentication = new UsernamePasswordAuthenticationToken(
                            username, null, Collections.singletonList(new SimpleGrantedAuthority(account.getRole().name())));
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    HttpServletRequest scopedRequest = account.getAssociatedWorkerId() != null
                            && account.getRole().name().equals("ROLE_WORKER")
                            ? new WorkerScopedRequest(request, account.getAssociatedWorkerId()) : request;
                    chain.doFilter(scopedRequest, response);
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }

    private static final class WorkerScopedRequest extends HttpServletRequestWrapper {
        private final String workerId;

        private WorkerScopedRequest(HttpServletRequest request, String workerId) {
            super(request);
            this.workerId = workerId;
        }

        @Override
        public String getParameter(String name) {
            return "workerId".equals(name) ? workerId : super.getParameter(name);
        }

        @Override
        public String[] getParameterValues(String name) {
            return "workerId".equals(name) ? new String[]{workerId} : super.getParameterValues(name);
        }
    }
}
