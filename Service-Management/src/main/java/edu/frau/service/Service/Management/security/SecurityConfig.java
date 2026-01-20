package edu.frau.service.Service.Management.security;

import org.springframework.beans.factory.annotation.Qualifier;
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

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final PublicApiKeyFilter publicApiKeyFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, PublicApiKeyFilter publicApiKeyFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.publicApiKeyFilter = publicApiKeyFilter;
    }

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter(@Qualifier("corsConfigurationSource") CorsConfigurationSource source) {
        return new CorsFilter(source);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
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
                                "/api-index",
                                "/actuator/health",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/error"
                        ).permitAll()

                        // ==========================================================
                        // ✅ PUBLIC READ (reporting / other teams)
                        // ==========================================================
                        .requestMatchers(HttpMethod.GET, "/api/requests/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()

                        // ==========================================================
                        // ✅ PUBLIC WRITE (ONLY 3 endpoints)
                        // Filter enforces header: ServiceRequestbids3a
                        // ==========================================================
                        .requestMatchers(HttpMethod.POST, "/api/public/bids").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/public/order-changes/extension").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/public/order-changes/substitution").permitAll()

                        // ==========================================================
                        // ✅ Keep your existing rules
                        // ==========================================================

                        // existing open offer submit (your current flow)
                        .requestMatchers(HttpMethod.POST, "/api/requests/*/offers").permitAll()

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

                .headers(headers -> headers.frameOptions(frame -> frame.disable()))

                // ✅ API KEY filter must run BEFORE JWT filter
                .addFilterBefore(publicApiKeyFilter, UsernamePasswordAuthenticationFilter.class)

                // ✅ JWT filter
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowCredentials(true);

        config.setAllowedOriginPatterns(List.of(
                "http://localhost:3000",
                "https://servicemanagementsystem-og8h.onrender.com"
        ));

        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
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
