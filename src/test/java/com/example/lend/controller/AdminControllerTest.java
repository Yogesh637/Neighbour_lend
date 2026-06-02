package com.example.lend.controller;

import com.example.lend.entity.*;
import com.example.lend.repository.*;
import com.example.lend.dto.response.PagedResponse;
import com.example.lend.exception.ResourceNotFoundException;
import com.example.lend.exception.BusinessException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private AdminController adminController;

    @Test
    public void getAnalytics_Success() {
        when(userRepository.count()).thenReturn(5L);
        when(itemRepository.count()).thenReturn(10L);
        when(bookingRepository.count()).thenReturn(3L);

        User owner = new User();
        owner.setEmail("owner@gmail.com");

        Item item = new Item();
        item.setId(1L);
        item.setPrice(100.0);
        item.setCategory("Electronics");
        item.setOwner(owner);

        Booking booking = new Booking();
        booking.setItem(item);
        booking.setStatus(BookingStatus.APPROVED);
        booking.setStartDate(LocalDateTime.now().minusDays(2));
        booking.setEndDate(LocalDateTime.now());

        when(bookingRepository.findAll()).thenReturn(List.of(booking));
        when(itemRepository.findAll()).thenReturn(List.of(item));

        ResponseEntity<Map<String, Object>> response = adminController.getAnalytics();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        Map<String, Object> body = response.getBody();
        assertNotNull(body);
        assertEquals(5L, body.get("totalUsers"));
        assertEquals(10L, body.get("totalItems"));
        assertEquals(3L, body.get("totalBookings"));
        assertEquals(200.0, body.get("totalBookingValue"));
        assertEquals(10.0, body.get("totalRevenue"));
    }

    @Test
    public void getUsers_Success() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@gmail.com");
        user.setAddress("A Street");
        user.setVerified(true);
        user.setRoles(Set.of(Role.USER));

        Pageable pageable = PageRequest.of(0, 10, Sort.by("email").ascending());
        Page<User> page = new PageImpl<>(List.of(user), pageable, 1);

        when(userRepository.findAll(any(Pageable.class))).thenReturn(page);

        ResponseEntity<PagedResponse<AdminController.UserAdminDto>> response = adminController.getUsers(0, 10);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        PagedResponse<AdminController.UserAdminDto> body = response.getBody();
        assertNotNull(body);
        assertEquals(1, body.getTotalElements());
        assertEquals("user@gmail.com", body.getContent().get(0).getEmail());
    }

    @Test
    public void updateUserRole_Success() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@gmail.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        Map<String, List<String>> request = Map.of("roles", List.of("USER", "ADMIN"));
        ResponseEntity<Void> response = adminController.updateUserRole(1L, request);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(user.getRoles().contains(Role.ADMIN));
        assertTrue(user.getRoles().contains(Role.USER));
    }

    @Test
    public void updateUserRole_EmptyRoles_ThrowsException() {
        User user = new User();
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        Map<String, List<String>> request = Map.of("roles", Collections.emptyList());

        assertThrows(BusinessException.class, () -> {
            adminController.updateUserRole(1L, request);
        });
    }

    @Test
    public void toggleUserStatus_Success() {
        User user = new User();
        user.setId(1L);
        user.setVerified(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        ResponseEntity<Void> response = adminController.toggleUserStatus(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(user.isVerified());
    }

    @Test
    public void getItems_Success() {
        Item item = new Item();
        item.setId(1L);
        item.setName("Drill");
        item.setCategory("Tools");
        item.setPrice(10.0);
        item.setAvailable(true);

        Pageable pageable = PageRequest.of(0, 10, Sort.by("name").ascending());
        Page<Item> page = new PageImpl<>(List.of(item), pageable, 1);

        when(itemRepository.findAll(any(Pageable.class))).thenReturn(page);

        ResponseEntity<PagedResponse<AdminController.ItemAdminDto>> response = adminController.getItems(0, 10);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getTotalElements());
    }

    @Test
    public void toggleItemAvailability_Success() {
        Item item = new Item();
        item.setId(1L);
        item.setAvailable(true);

        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(itemRepository.save(any(Item.class))).thenReturn(item);

        ResponseEntity<Void> response = adminController.toggleItemAvailability(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(item.isAvailable());
    }

    @Test
    public void getBookings_Success() {
        User user = new User();
        user.setEmail("renter@gmail.com");

        Item item = new Item();
        item.setName("Bike");

        Booking booking = new Booking();
        booking.setId(1L);
        booking.setItem(item);
        booking.setUser(user);
        booking.setStartDate(LocalDateTime.now());
        booking.setEndDate(LocalDateTime.now().plusDays(2));
        booking.setStatus(BookingStatus.PENDING);

        Pageable pageable = PageRequest.of(0, 10, Sort.by("startDate").descending());
        Page<Booking> page = new PageImpl<>(List.of(booking), pageable, 1);

        when(bookingRepository.findAll(any(Pageable.class))).thenReturn(page);

        ResponseEntity<PagedResponse<AdminController.BookingAdminDto>> response = adminController.getBookings(0, 10);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().getTotalElements());
    }

    @Test
    public void forceCancelBooking_Success() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        ResponseEntity<Void> response = adminController.forceCancelBooking(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(BookingStatus.CANCELLED, booking.getStatus());
    }
}
