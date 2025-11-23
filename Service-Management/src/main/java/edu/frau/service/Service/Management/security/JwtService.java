package edu.frau.service.Service.Management.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private static final String SECRET_KEY =
            "this_is_a_super_long_jwt_secret_key_change_me_1234567890";

    private static final long EXPIRATION = 1000L * 60 * 60; // 1 hour

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    /** 🔥 Generate token with role included */
    public String generateToken(String username, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);

        Date now = new Date();
        Date expiry = new Date(now.getTime() + EXPIRATION);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /** Extract Username from token */
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    /** Extract role from token */
    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /** Extract all claims */
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /** Validate token */
    public boolean isTokenValid(String token, String username) {
        return username.equals(extractUsername(token)) && !isExpired(token);
    }

    /** Check expiration */
    private boolean isExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }
}
