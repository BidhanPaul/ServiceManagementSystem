package edu.frau.service.Service.Management.controller;

import edu.frau.service.Service.Management.model.User;
import edu.frau.service.Service.Management.security.JwtService;
import edu.frau.service.Service.Management.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserService userService;

    // --------------------- REGISTER ---------------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User saved = userService.register(user);
            saved.setPassword(null);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(400).body(ex.getMessage());
        }
    }

    // --------------------- LOGIN ---------------------
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        // 1️⃣ Check if user exists first
        User user = userService.findByUsername(request.getUsername());
        if (user == null) {
            return ResponseEntity.status(404).body("User not registered.");
        }

        // 2️⃣ Validate password via Spring Security
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (Exception ex) {
            return ResponseEntity.status(401).body("Invalid password.");
        }

        // 3️⃣ Generate JWT including role
        String token = jwtService.generateToken(
                user.getUsername(),
                user.getRole().name()
        );

        // 4️⃣ Build response object
        AuthResponse response = new AuthResponse(
                token,
                user.getUsername(),
                user.getRole().name()
        );

        return ResponseEntity.ok(response);
    }

    // --------------------- DTOs ---------------------

    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private String token;
        private String username;
        private String role;

        public AuthResponse(String token, String username, String role) {
            this.token = token;
            this.username = username;
            this.role = role;
        }

        public String getToken() { return token; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
    }
}
