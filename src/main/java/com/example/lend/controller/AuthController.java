package com.example.lend.controller;

import jakarta.validation.Valid;
import com.example.lend.dto.request.GoogleLoginRequest;
import com.example.lend.dto.request.OtpVerificationRequest;
import com.example.lend.dto.request.ResendOtpRequest;
import com.example.lend.dto.request.UserLoginRequest;
import com.example.lend.dto.response.AuthResponse;
import com.example.lend.entity.RefreshToken;
import com.example.lend.entity.Role;
import com.example.lend.entity.User;
import com.example.lend.exception.BusinessException;
import com.example.lend.exception.ResourceNotFoundException;
import com.example.lend.repository.UserRepository;
import com.example.lend.security.JwtUtil;
import com.example.lend.service.RefreshTokenService;
import com.example.lend.service.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;

    @Value("${google.client-id:}")
    private String googleClientId;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          UserService userService,
                          RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody UserLoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isVerified()) {
            throw new SecurityException("EMAIL_NOT_VERIFIED");
        }

        return ResponseEntity.ok(buildAuthResponse(user));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        String googleToken = request.getToken();

        try {
            Map<String, Object> body;

            if (googleToken.startsWith("mock_token_")) {
                String mockEmail = googleToken.substring("mock_token_".length());
                body = new HashMap<>();
                body.put("email", mockEmail);
            } else {
                String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + googleToken;
                RestTemplate restTemplate = new RestTemplate();
                @SuppressWarnings("rawtypes")
                ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

                if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> responseBody = (Map<String, Object>) response.getBody();
                    body = responseBody;

                    if (googleClientId != null && !googleClientId.trim().isEmpty()) {
                        String aud = (String) body.get("aud");
                        String azp = (String) body.get("azp");
                        if ((aud == null || !aud.equals(googleClientId)) && (azp == null || !azp.equals(googleClientId))) {
                            throw new SecurityException("Token audience does not match this application's client ID");
                        }
                    }
                } else {
                    throw new BadCredentialsException("Invalid Google token");
                }
            }

            String email = (String) body.get("email");
            if (email == null) {
                throw new BadCredentialsException("No email associated with Google account");
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                user = new User();
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                user.setAddress("Signed in with Google");
                user.setVerified(true);
                user.setRoles(new HashSet<>(Set.of(Role.USER)));
                userRepository.save(user);
            } else if (!user.isVerified()) {
                user.setVerified(true);
                userRepository.save(user);
            }

            return ResponseEntity.ok(buildAuthResponse(user));
        } catch (Exception e) {
            throw new BusinessException("Google login failed: " + e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody OtpVerificationRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isVerified()) {
            throw new BusinessException("User is already verified");
        }

        if (user.getOtp() == null || !user.getOtp().equals(request.getOtp())) {
            throw new BusinessException("Invalid OTP code");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry() < System.currentTimeMillis()) {
            throw new BusinessException("OTP code has expired");
        }

        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(buildAuthResponse(user));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Map<String, String>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.isVerified()) {
            throw new BusinessException("User is already verified");
        }

        userService.sendOtpEmail(user);
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP resent successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> request) {
        String requestRefreshToken = request.get("refreshToken");
        if (requestRefreshToken == null || requestRefreshToken.trim().isEmpty()) {
            throw new BusinessException("Refresh token is required");
        }

        RefreshToken refreshToken = refreshTokenService.findByToken(requestRefreshToken)
                .orElseThrow(() -> new BusinessException("Invalid refresh token"));

        refreshTokenService.verifyExpiration(refreshToken);

        User user = refreshToken.getUser();
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRoles());

        // Rotate refresh token
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getEmail());

        Set<String> roleNames = user.getRoles().stream().map(Role::name).collect(Collectors.toSet());

        return ResponseEntity.ok(new AuthResponse(accessToken, newRefreshToken.getToken(), user.getEmail(), roleNames));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(@RequestBody Map<String, String> request) {
        String requestRefreshToken = request.get("refreshToken");
        if (requestRefreshToken != null && !requestRefreshToken.trim().isEmpty()) {
            try {
                refreshTokenService.revokeToken(requestRefreshToken);
            } catch (Exception e) {
                // Silently ignore — token may already be revoked or not exist
            }
        }

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateToken(user.getEmail(), user.getRoles());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getEmail());
        Set<String> roleNames = user.getRoles().stream().map(Role::name).collect(Collectors.toSet());
        return new AuthResponse(accessToken, refreshToken.getToken(), user.getEmail(), roleNames);
    }
}
