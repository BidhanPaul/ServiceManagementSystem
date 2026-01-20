package edu.frau.service.Service.Management.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.beans.factory.annotation.Qualifier;


import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    /**
     * ✅ CRITICAL FIX:
     * Add a global CorsFilter at highest precedence.
     * This ensures OPTIONS (preflight) always gets CORS headers,
     * even if something returns early.
     */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter(@Qualifier("corsConfigurationSource") CorsConfigurationSource source) {
        return new CorsFilter(source);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // Keep your existing CORS config, but ensure Security uses it too
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // ✅ allow all CORS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ Public endpoints (docs + auth)
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/h2-console/**",
                                "/api/public/**",
                                "/api-index",
                                "/actuator/health",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/error"
                        ).permitAll()

                        // ==========================================================
                        // ✅ PUBLIC READ-ONLY (anyone / other teams / reporting)
                        // ==========================================================
                        .requestMatchers(HttpMethod.GET, "/api/requests/**").permitAll()

                        // offers list + evaluation read are needed for reporting
                        .requestMatchers(HttpMethod.GET, "/api/requests/*/offers/**").permitAll()

                        // orders read for reporting
                        .requestMatchers(HttpMethod.GET, "/api/orders/**").permitAll()

                        // ==========================================================
                        // ✅ BIDDING GROUP PUBLIC WRITE (only offers for now)
                        // ==========================================================
                        .requestMatchers(HttpMethod.POST, "/api/requests/*/offers").permitAll()

                        // ==========================================================
                        // ❌ KEEP RESTRICTED (internal-only decisions)
                        // ==========================================================
                        .requestMatchers(HttpMethod.POST, "/api/requests/*/pull-provider-offers")
                        .hasAnyRole("RESOURCE_PLANNER", "PROCUREMENT_OFFICER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/requests/*/offers/evaluation/compute")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/approve")
                        .hasAnyRole("PROCUREMENT_OFFICER", "ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/reject")
                        .hasAnyRole("PROCUREMENT_OFFICER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/requests/**").hasRole("PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/reactivate").hasRole("PROJECT_MANAGER")

                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/offers/*/select")
                        .hasRole("PROJECT_MANAGER")

                        .requestMatchers(HttpMethod.POST, "/api/requests/offers/*/order")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/resource-planner/**")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/approve")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/reject")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/feedback")
                        .hasAnyRole("PROJECT_MANAGER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/change/approve")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/change/reject")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/notifications/role/ADMIN").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/direct-message").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/dm").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/user/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/user/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/admin").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/external/**").authenticated()

                        .anyRequest().authenticated()
                )

                // ✅ needed if you ever use H2 console
                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                // ✅ keep your JWT filter logic
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // IMPORTANT:
        // If allowCredentials=true, you cannot use "*" in allowedOrigins.
        config.setAllowCredentials(true);

        // ✅ Use allowedOriginPatterns (more robust for Render)
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "https://servicemanagementsystem-og8h.onrender.com"
        ));

        // ✅ allow all headers (covers Authorization + Content-Type)
        config.setAllowedHeaders(List.of("*"));

        // ✅ allow typical methods + OPTIONS (preflight)
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // ✅ optional: expose headers if frontend wants to read them
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // ✅ apply to everything
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
