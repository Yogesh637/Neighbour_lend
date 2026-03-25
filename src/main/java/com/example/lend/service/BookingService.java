package com.example.lend.service;

import com.example.lend.entity.Booking;

import java.util.List;

public interface BookingService {
	Booking book(com.example.lend.dto.BookingRequest request, String userEmail);

	List<Booking> getUserBookings(String email);

	List<Booking> getOwnerBookings(String email);

	List<Booking> getAllBookings();

	Booking getBookingById(Long id);

	Booking updateBookingStatus(Long id, String status);
}
