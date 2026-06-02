package com.example.lend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.lend.dto.request.BookingCreateRequest;
import com.example.lend.dto.response.BookingResponse;
import com.example.lend.entity.Booking;
import com.example.lend.mapper.BookingMapper;
import com.example.lend.service.BookingService;

import com.example.lend.dto.response.PagedResponse;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bookings")
@Transactional(readOnly = true)
public class BookingController {

	@Autowired
	private BookingService service;

	@Autowired
	private BookingMapper bookingMapper;

	@PostMapping
	@Transactional
	public ResponseEntity<BookingResponse> book(@Valid @RequestBody BookingCreateRequest request, Principal principal) {
		Booking booking = service.book(request, principal.getName());
		return ResponseEntity.status(HttpStatus.CREATED).body(bookingMapper.toResponse(booking));
	}

	@GetMapping
	public ResponseEntity<List<BookingResponse>> getAll() {
		List<Booking> bookings = service.getAllBookings();
		List<BookingResponse> responses = bookings.stream()
				.map(bookingMapper::toResponse)
				.collect(Collectors.toList());
		return ResponseEntity.ok(responses);
	}

	@GetMapping("/my")
	public ResponseEntity<PagedResponse<BookingResponse>> getMyBookings(
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size,
			Principal principal) {
		Page<Booking> bookingPage = service.getUserBookingsPaged(principal.getName(), page, size);
		List<BookingResponse> content = bookingPage.getContent().stream()
				.map(bookingMapper::toResponse)
				.collect(Collectors.toList());
		PagedResponse<BookingResponse> response = new PagedResponse<>(
				content,
				bookingPage.getNumber(),
				bookingPage.getSize(),
				bookingPage.getTotalElements(),
				bookingPage.getTotalPages(),
				bookingPage.isLast()
		);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/requests")
	public ResponseEntity<PagedResponse<BookingResponse>> getIncomingRequests(
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "10") int size,
			Principal principal) {
		Page<Booking> bookingPage = service.getOwnerBookingsPaged(principal.getName(), page, size);
		List<BookingResponse> content = bookingPage.getContent().stream()
				.map(bookingMapper::toResponse)
				.collect(Collectors.toList());
		PagedResponse<BookingResponse> response = new PagedResponse<>(
				content,
				bookingPage.getNumber(),
				bookingPage.getSize(),
				bookingPage.getTotalElements(),
				bookingPage.getTotalPages(),
				bookingPage.isLast()
		);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{id}")
	public ResponseEntity<BookingResponse> getById(@PathVariable Long id) {
		Booking booking = service.getBookingById(id);
		return ResponseEntity.ok(bookingMapper.toResponse(booking));
	}

	@PutMapping("/{id}/status")
	@Transactional
	public ResponseEntity<BookingResponse> updateStatus(
			@PathVariable Long id,
			@RequestParam String status,
			Principal principal) {

		Booking booking = service.updateBookingStatus(id, status, principal.getName());
		return ResponseEntity.ok(bookingMapper.toResponse(booking));
	}
}
