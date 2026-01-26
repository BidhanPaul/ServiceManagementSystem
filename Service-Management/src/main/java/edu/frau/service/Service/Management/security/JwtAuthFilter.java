package edu.frau.service.Service.Management.security;

import edu.frau.service.Service.Management.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getServletPath();
        if (path != null && path.startsWith("/api/auth/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        String username;
        try {
            username = jwtService.extractUsername(token);
        } catch (Exception ex) {
            filterChain.doFilter(request, response);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, userDetails.getUsername())) {

                // ✅ Use role claim, and normalize safely
                String roleClaim = null;
                try {
                    roleClaim = jwtService.extractRole(token);
                } catch (Exception ignored) {}

                if (roleClaim == null || roleClaim.trim().isEmpty()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // ✅ FIX: Normalize role claim so "Resource Planner" / "RESOURCE-PLANNER" works
                String r = roleClaim.trim().toUpperCase()
                        .replace('-', '_')
                        .replace(' ', '_');

                // ✅ Build authorities in BOTH forms to avoid mismatch
                // If token says RESOURCE_PLANNER -> add RESOURCE_PLANNER and ROLE_RESOURCE_PLANNER
                // If token says ROLE_RESOURCE_PLANNER -> add ROLE_RESOURCE_PLANNER and RESOURCE_PLANNER
                List<SimpleGrantedAuthority> auths = new ArrayList<>();
                if (r.startsWith("ROLE_")) {
                    auths.add(new SimpleGrantedAuthority(r));
                    auths.add(new SimpleGrantedAuthority(r.substring("ROLE_".length())));
                } else {
                    auths.add(new SimpleGrantedAuthority(r));
                    auths.add(new SimpleGrantedAuthority("ROLE_" + r));
                }

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, auths);

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
