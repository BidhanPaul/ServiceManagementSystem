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

                        // ✅ Public endpoints
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

                        // ✅ Public: read-only requests
                        .requestMatchers(HttpMethod.GET, "/api/requests/**").permitAll()

                        // ==========================================================
                        // ✅ BIDDING (pull provider offers) - RP/PO/Admin
                        // ==========================================================
                        .requestMatchers(HttpMethod.POST, "/api/requests/*/pull-provider-offers")
                        .hasAnyRole("RESOURCE_PLANNER", "PROCUREMENT_OFFICER", "ADMIN")

                        // ==========================================================
                        // ✅ EVALUATION
                        // ==========================================================
                        .requestMatchers(HttpMethod.GET, "/api/requests/*/offers/evaluation")
                        .hasAnyRole("PROJECT_MANAGER", "RESOURCE_PLANNER", "PROCUREMENT_OFFICER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/requests/*/offers/evaluation/compute")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        // ==========================================================
                        // ✅ CREATE ORDER (Final approve) - ONLY RP/Admin
                        // ==========================================================
                        // If your frontend calls: POST /api/requests/offers/{offerId}/order
                        .requestMatchers(HttpMethod.POST, "/api/requests/offers/*/order")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        // If your frontend calls: POST /api/resource-planner/final-approve/{offerId}
                        .requestMatchers(HttpMethod.POST, "/api/resource-planner/**")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        // ==========================================================
                        // ✅ REQUEST WRITE OPERATIONS (PM)
                        // ==========================================================
                        .requestMatchers(HttpMethod.POST, "/api/requests/**").hasRole("PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/reactivate").hasRole("PROJECT_MANAGER")

                        // ✅ External refs
                        .requestMatchers(HttpMethod.GET, "/api/external/**").authenticated()

                        // ✅ Notifications
                        .requestMatchers(HttpMethod.POST, "/api/notifications/role/ADMIN").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/direct-message").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/dm").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/user/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/user/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/admin").hasRole("ADMIN")

                        // ✅ Orders (PM + RP + Admin)
                        .requestMatchers(HttpMethod.GET, "/api/orders/**")
                        .hasAnyRole("PROJECT_MANAGER", "RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/approve")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/reject")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/feedback")
                        .hasAnyRole("PROJECT_MANAGER", "ADMIN")

                        // ✅ Service Order change requests
                        .requestMatchers(HttpMethod.POST, "/api/orders/*/substitution")
                        .hasAnyRole("PROJECT_MANAGER", "SUPPLIER_REPRESENTATIVE", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/extension")
                        .hasAnyRole("PROJECT_MANAGER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/change/approve")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/orders/*/change/reject")
                        .hasAnyRole("RESOURCE_PLANNER", "ADMIN")


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
        config.setAllowCredentials(true);
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

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
