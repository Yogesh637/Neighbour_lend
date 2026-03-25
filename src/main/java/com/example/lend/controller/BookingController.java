package com.example.lend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.lend.entity.Booking;
import com.example.lend.service.BookingService;

@RestController
@RequestMapping("/bookings")
public class BookingController {
	@Autowired
	private BookingService service;

	@PostMapping
	public Booking book(@RequestBody com.example.lend.dto.BookingRequest request, java.security.Principal principal) {
		return service.book(request, principal.getName());
	}

	@GetMapping
	public java.util.List<Booking> getAll() {
		return service.getAllBookings();
	}

	@GetMapping("/my")
	public java.util.List<Booking> getMyBookings(java.security.Principal principal) {
		return service.getUserBookings(principal.getName());
	}

	@GetMapping("/requests")
	public java.util.List<Booking> getIncomingRequests(java.security.Principal principal) {
		return service.getOwnerBookings(principal.getName());
	}

	@GetMapping("/{id}")
	public Booking getById(@PathVariable Long id) {
		return service.getBookingById(id);
	}

	@PutMapping("/{id}/status")
	public Booking updateStatus(@PathVariable Long id, @RequestParam String status) {
		return service.updateBookingStatus(id, status);
	}
}
