package com.example.lend.service;

import com.example.lend.entity.Booking;
import com.example.lend.dto.request.BookingCreateRequest;
import org.springframework.data.domain.Page;

import java.util.List;

public interface BookingService {
    Booking book(BookingCreateRequest request, String userEmail);

    List<Booking> getUserBookings(String email);

    List<Booking> getOwnerBookings(String email);

    Page<Booking> getUserBookingsPaged(String email, int page, int size);

    Page<Booking> getOwnerBookingsPaged(String email, int page, int size);

    List<Booking> getAllBookings();

    Booking getBookingById(Long id);

    Booking updateBookingStatus(Long id, String status, String userEmail);
}
