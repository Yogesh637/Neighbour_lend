package com.example.lend.serviceimplementation;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.lend.service.BookingService;
import com.example.lend.entity.Booking;
import com.example.lend.entity.BookingStatus;
import com.example.lend.repository.BookingRepository;
import java.util.List;

@Service
public class BookingServiceImplement implements BookingService {
	@Autowired
	private BookingRepository repo;

	@Autowired
	private com.example.lend.repository.ItemRepository itemRepo;

	@Autowired
	private com.example.lend.repository.UserRepository userRepo;

	public Booking book(com.example.lend.dto.BookingRequest request, String userEmail) {
		if (request.getStartDate() == null || request.getEndDate() == null) {
			throw new IllegalArgumentException("Start and End dates are required");
		}

		com.example.lend.entity.Item item = itemRepo.findById(request.getItemId())
				.orElseThrow(() -> new RuntimeException("Item not found"));

		com.example.lend.entity.User user = userRepo.findByEmail(userEmail)
				.orElseThrow(() -> new RuntimeException("User not found"));

		// Block Self-Rental
		if (item.getOwner() != null && item.getOwner().getEmail().equals(userEmail)) {
			throw new RuntimeException("You cannot rent your own item.");
		}

		// Check for Overlapping Bookings
		if (repo.countOverlappingBookings(item.getId(), request.getStartDate(),
				request.getEndDate()) > 0) {
			throw new RuntimeException("Item is already booked for these dates.");
		}

		Booking booking = new Booking();
		booking.setItem(item);
		booking.setUser(user);
		booking.setStartDate(request.getStartDate());
		booking.setEndDate(request.getEndDate());
		booking.setStatus(BookingStatus.PENDING);

		return repo.save(booking);
	}

	public List<Booking> getUserBookings(String email) {
		return repo.findByUserEmail(email);
	}

	public List<Booking> getOwnerBookings(String email) {
		return repo.findByItemOwnerEmail(email);
	}

	public List<Booking> getAllBookings() {
		return repo.findAll();
	}

	public Booking getBookingById(Long id) {
		return repo.findById(id).orElseThrow(() -> new RuntimeException("Booking not found"));
	}

	@Override
	public Booking updateBookingStatus(Long id, String status) {
		Booking booking = repo.findById(id).orElseThrow(() -> new RuntimeException("Booking not found"));
		booking.setStatus(BookingStatus.valueOf(status));
		return repo.save(booking);
	}
}
