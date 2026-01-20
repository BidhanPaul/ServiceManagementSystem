package edu.frau.service.Service.Management.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth

                        // ✅ IMPORTANT: allow CORS preflight everywhere
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ Public endpoints (auth + docs)
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
                        // ✅ PUBLIC READ-ONLY (reporting / bidders / other teams)
                        // ==========================================================
                        .requestMatchers(HttpMethod.GET, "/api/requests/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/requests/*/offers/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/orders/**").permitAll()

                        // ==========================================================
                        // ✅ BIDDING GROUP PUBLIC WRITE
                        // ==========================================================
                        .requestMatchers(HttpMethod.POST, "/api/requests/*/offers").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/substitution").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/extension").permitAll()

                        // ==========================================================
                        // ❌ RESTRICTED (internal-only)
                        // ==========================================================
                        .requestMatchers(HttpMethod.POST, "/api/requests/*/pull-provider-offers")
                        .hasAnyRole("RESOURCE_PLANNER", "PROCUREMENT_OFFICER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/requests/*/offers/evaluation/compute")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/approve")
                        .hasAnyRole("PROCUREMENT_OFFICER", "ADMIN")

                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/reject")
                        .hasAnyRole("PROCUREMENT_OFFICER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/requests/**")
                        .hasRole("PROJECT_MANAGER")

                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/reactivate")
                        .hasRole("PROJECT_MANAGER")

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

                        // ✅ Everything else requires login
                        .anyRequest().authenticated()
                )

                .headers(headers -> headers.frameOptions(frame -> frame.disable()))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // If you use JWT in Authorization header, credentials/cookies aren't required.
        // But keeping credentials true is fine if you also avoid "*" origins.
        config.setAllowCredentials(true);

        // ✅ More robust than setAllowedOrigins for Render domains
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "https://*.onrender.com"
        ));

        // ✅ Allow all headers (simplifies CORS issues)
        config.setAllowedHeaders(List.of("*"));

        // ✅ Allow all common methods including OPTIONS
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Optional
        config.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
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
