package edu.frau.service.Service.Management.security;

import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/register",
                                "/h2-console/**",
                                "/api/public/**",
                                "/api-index",
                                "/actuator/health",
                                "/error"
                        ).permitAll()

                        // ✅ external refs: allow logged-in users (or permitAll if you prefer)
                        .requestMatchers(HttpMethod.GET, "/api/external/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/pm-whitelist/validate").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/pm-whitelist/import").hasRole("ADMIN")


                        // ✅ notifications: ANY logged-in user can send DM/support to admin or others
                        .requestMatchers(HttpMethod.POST, "/api/notifications/role/ADMIN").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/notifications/user/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/user/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/notifications/admin").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/pm-whitelist/**").hasRole("ADMIN")

                        // ✅ requests rules (keep yours)
                        .requestMatchers(HttpMethod.POST, "/api/requests/**").hasRole("PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/api/requests/*/reactivate").hasRole("PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/api/requests/**")
                        .hasAnyRole("ADMIN", "PROJECT_MANAGER", "PROCUREMENT_OFFICER", "RESOURCE_PLANNER", "SERVICE_PROVIDER")
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
