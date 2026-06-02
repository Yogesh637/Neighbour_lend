package com.example.lend.service;

import com.example.lend.entity.Role;
import com.example.lend.entity.User;
import com.example.lend.exception.BusinessException;
import com.example.lend.repository.UserRepository;
import com.example.lend.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    public void setUp() {
        // Default mail username setup using ReflectionTestUtils
        ReflectionTestUtils.setField(userService, "mailUsername", "test@gmail.com");
    }

    @Test
    public void register_NewUser_Success() {
        User inputUser = new User();
        inputUser.setEmail("newuser@gmail.com");
        inputUser.setPassword("rawPassword");
        inputUser.setAddress("123 Street");

        when(userRepository.findByEmail(inputUser.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(inputUser.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User registered = userService.register(inputUser);

        assertNotNull(registered);
        assertEquals("newuser@gmail.com", registered.getEmail());
        assertEquals("encodedPassword", registered.getPassword());
        assertFalse(registered.isVerified());
        assertNotNull(registered.getOtp());
        assertTrue(registered.getRoles().contains(Role.USER));
        verify(userRepository, times(1)).save(any(User.class));
        verify(mailSender, times(1)).send(any(SimpleMailMessage.class));
    }

    @Test
    public void register_ExistingVerifiedUser_ThrowsException() {
        User inputUser = new User();
        inputUser.setEmail("verified@gmail.com");
        inputUser.setPassword("rawPassword");

        User existingUser = new User();
        existingUser.setEmail("verified@gmail.com");
        existingUser.setVerified(true);

        when(userRepository.findByEmail(inputUser.getEmail())).thenReturn(Optional.of(existingUser));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            userService.register(inputUser);
        });

        assertEquals("Email already registered", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void register_ExistingUnverifiedUser_Success() {
        User inputUser = new User();
        inputUser.setEmail("unverified@gmail.com");
        inputUser.setPassword("newRawPassword");
        inputUser.setAddress("456 Avenue");

        User existingUser = new User();
        existingUser.setEmail("unverified@gmail.com");
        existingUser.setVerified(false);

        when(userRepository.findByEmail(inputUser.getEmail())).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode(inputUser.getPassword())).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User registered = userService.register(inputUser);

        assertNotNull(registered);
        assertEquals("unverified@gmail.com", registered.getEmail());
        assertEquals("newEncodedPassword", registered.getPassword());
        assertEquals("456 Avenue", registered.getAddress());
        assertFalse(registered.isVerified());
        assertNotNull(registered.getOtp());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void getUserByUsername_Found_ReturnsUser() {
        User mockUser = new User();
        mockUser.setEmail("test@gmail.com");

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(mockUser));

        User found = userService.getUserByUsername("test@gmail.com");

        assertNotNull(found);
        assertEquals("test@gmail.com", found.getEmail());
    }

    @Test
    public void getUserByUsername_NotFound_ThrowsException() {
        when(userRepository.findByEmail("notfound@gmail.com")).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            userService.getUserByUsername("notfound@gmail.com");
        });

        assertEquals("User not found: notfound@gmail.com", exception.getMessage());
    }

    @Test
    public void sendOtpEmail_EmptyMailUsername_LogOnly() {
        ReflectionTestUtils.setField(userService, "mailUsername", "");
        User mockUser = new User();
        mockUser.setEmail("test@gmail.com");

        userService.sendOtpEmail(mockUser);

        assertNotNull(mockUser.getOtp());
        assertNotNull(mockUser.getOtpExpiry());
        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    public void sendOtpEmail_MailSenderException_LogAndCatch() {
        User mockUser = new User();
        mockUser.setEmail("test@gmail.com");

        doThrow(new RuntimeException("Mail server down")).when(mailSender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> userService.sendOtpEmail(mockUser));
        assertNotNull(mockUser.getOtp());
    }
}
