package com.example.lend.security;

import java.util.*;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.example.lend.entity.Role;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtil.class);

    @Value("${jwt.secret}")
    private String secretKeyString;

    @Value("${jwt.access-token-expiration:900000}")
    private long accessTokenExpiration; // 15 minutes default

    private SecretKey getKey() {
        if (secretKeyString == null || secretKeyString.isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured. Please set JWT_SECRET environment variable.");
        }
        if ("default-secret-key-change-in-production".equals(secretKeyString)) {
            logger.warn("Using default JWT secret key. Please set JWT_SECRET environment variable in production.");
        }
        return Keys.hmacShaKeyFor(secretKeyString.getBytes());
    }

    public String generateToken(String email, Set<Role> roles) {
        List<String> roleNames = roles.stream()
                .map(Role::name)
                .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(email)
                .claim("roles", roleNames)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Backward-compatible overload
    public String generateToken(String email) {
        return generateToken(email, Collections.emptySet());
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        List<String> roles = claims.get("roles", List.class);
        return roles != null ? roles : Collections.emptyList();
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
