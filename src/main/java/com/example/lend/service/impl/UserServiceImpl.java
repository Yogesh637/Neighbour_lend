package com.example.lend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.lend.service.UserService;
import com.example.lend.repository.UserRepository;
import com.example.lend.entity.User;
import com.example.lend.exception.BusinessException;

import java.util.Random;

@Service
public class UserServiceImpl implements UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    UserRepository repo;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Override
    public User register(User user) {
        // Check if user already exists
        User existingUser = repo.findByEmail(user.getEmail()).orElse(null);
        if (existingUser != null) {
            if (existingUser.isVerified()) {
                throw new BusinessException("Email already registered");
            }
            // If they exist but are not verified, reuse the existing record
            existingUser.setPassword(encoder.encode(user.getPassword()));
            existingUser.setAddress(user.getAddress());
            existingUser.setRoles(new java.util.HashSet<>(java.util.List.of(com.example.lend.entity.Role.USER, com.example.lend.entity.Role.OWNER)));
            sendOtpEmail(existingUser);
            return repo.save(existingUser);
        }

        // New registration
        user.setPassword(encoder.encode(user.getPassword()));
        user.setVerified(false);
        user.setRoles(new java.util.HashSet<>(java.util.List.of(com.example.lend.entity.Role.USER, com.example.lend.entity.Role.OWNER)));
        sendOtpEmail(user);
        return repo.save(user);
    }

    @Override
    public User getUserByUsername(String username) {
        return repo.findByEmail(username)
                .orElseThrow(() -> new BusinessException("User not found: " + username));
    }

    @Override
    public void sendOtpEmail(User user) {
        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(1000000));
        user.setOtp(otp);
        user.setOtpExpiry(System.currentTimeMillis() + 300000); // 5 minutes validity

        String email = user.getEmail();
        try {
            if (mailUsername == null || mailUsername.trim().isEmpty()) {
                logger.warn("=================================================");
                logger.warn("SMTP Username is empty. Real email NOT sent.");
                logger.warn("OTP Code for {}: {}", email, otp);
                logger.warn("=================================================");
            } else {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(email);
                message.setSubject("Neighbour Lend - OTP Verification Code");
                message.setText("Your OTP code is: " + otp + "\nIt will expire in 5 minutes.");
                mailSender.send(message);
                logger.info("OTP sent successfully to {}", email);
            }
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}. OTP Code: {}", email, e.getMessage(), otp);
        }
    }
}
