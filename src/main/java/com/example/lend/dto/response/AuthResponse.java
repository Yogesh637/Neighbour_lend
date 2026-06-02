package com.example.lend.dto.response;

import lombok.Data;

import java.util.Set;

@Data
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String email;
    private Set<String> roles;

    public AuthResponse() {}

    public AuthResponse(String token, String refreshToken, String email, Set<String> roles) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.email = email;
        this.roles = roles;
    }

    // Backward-compatible constructor
    public AuthResponse(String token, String email) {
        this.token = token;
        this.email = email;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}
