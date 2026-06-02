package com.example.lend.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.example.lend.service.BookingService;
import com.example.lend.entity.Booking;
import com.example.lend.entity.BookingStatus;
import com.example.lend.entity.Item;
import com.example.lend.entity.User;
import com.example.lend.repository.BookingRepository;
import com.example.lend.repository.ItemRepository;
import com.example.lend.repository.UserRepository;
import com.example.lend.dto.request.BookingCreateRequest;
import com.example.lend.exception.ResourceNotFoundException;
import com.example.lend.exception.BusinessException;
import org.springframework.transaction.annotation.Transactional;
import com.example.lend.repository.NotificationRepository;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    @Autowired
    private BookingRepository repo;

    @Autowired
    private ItemRepository itemRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private NotificationRepository notificationRepository;

    @Override
    @Transactional
    public Booking book(BookingCreateRequest request, String userEmail) {
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Start and End dates are required");
        }

        if (request.getEndDate().isBefore(request.getStartDate()) || request.getEndDate().isEqual(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }

        Item item = itemRepo.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + request.getItemId()));

        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        // Block Self-Rental
        if (item.getOwner() != null && item.getOwner().getEmail().equals(userEmail)) {
            throw new BusinessException("You cannot rent your own item.");
        }

        // Check for Overlapping Bookings
        if (repo.countOverlappingBookings(item.getId(), request.getStartDate(), request.getEndDate()) > 0) {
            throw new BusinessException("Item is already booked for these dates.");
        }

        Booking booking = new Booking();
        booking.setItem(item);
        booking.setUser(user);
        booking.setStartDate(request.getStartDate());
        booking.setEndDate(request.getEndDate());
        booking.setStatus(BookingStatus.PENDING);

        Booking savedBooking = repo.save(booking);

        if (item.getOwner() != null) {
            createNotification(
                item.getOwner(),
                "New Booking Request",
                "You have a new booking request for " + item.getName() + " from " + userEmail + ".",
                com.example.lend.entity.NotificationType.REQUESTED
            );
        }

        return savedBooking;
    }

    @Override
    public List<Booking> getUserBookings(String email) {
        return repo.findByUserEmail(email);
    }

    @Override
    public List<Booking> getOwnerBookings(String email) {
        return repo.findByItemOwnerEmail(email);
    }

    @Override
    public Page<Booking> getUserBookingsPaged(String email, int page, int size) {
        return repo.findByUserEmail(email, PageRequest.of(page, size, Sort.by("startDate").descending()));
    }

    @Override
    public Page<Booking> getOwnerBookingsPaged(String email, int page, int size) {
        return repo.findByItemOwnerEmail(email, PageRequest.of(page, size, Sort.by("startDate").descending()));
    }

    @Override
    public List<Booking> getAllBookings() {
        return repo.findAll();
    }

    @Override
    public Booking getBookingById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    @Override
    @Transactional
    public Booking updateBookingStatus(Long id, String status, String userEmail) {
        Booking booking = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        
        BookingStatus newStatus;
        try {
            newStatus = BookingStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid booking status: " + status);
        }

        // Authorization checks
        if (newStatus == BookingStatus.APPROVED || newStatus == BookingStatus.REJECTED) {
            if (booking.getItem().getOwner() == null || !booking.getItem().getOwner().getEmail().equals(userEmail)) {
                throw new SecurityException("Only the item owner can approve or reject booking requests.");
            }
        } else if (newStatus == BookingStatus.CANCELLED) {
            boolean isBorrower = booking.getUser().getEmail().equals(userEmail);
            boolean isOwner = booking.getItem().getOwner() != null && booking.getItem().getOwner().getEmail().equals(userEmail);
            if (!isBorrower && !isOwner) {
                throw new SecurityException("You are not authorized to cancel this booking.");
            }
        } else {
            boolean isBorrower = booking.getUser().getEmail().equals(userEmail);
            boolean isOwner = booking.getItem().getOwner() != null && booking.getItem().getOwner().getEmail().equals(userEmail);
            if (!isBorrower && !isOwner) {
                throw new SecurityException("You are not authorized to update this booking to " + newStatus);
            }
        }

        booking.setStatus(newStatus);
        Booking updatedBooking = repo.save(booking);

        if (newStatus == BookingStatus.APPROVED) {
            createNotification(
                booking.getUser(),
                "Booking Approved",
                "Your booking request for " + booking.getItem().getName() + " has been approved.",
                com.example.lend.entity.NotificationType.ACCEPTED
            );
        } else if (newStatus == BookingStatus.REJECTED) {
            createNotification(
                booking.getUser(),
                "Booking Rejected",
                "Your booking request for " + booking.getItem().getName() + " has been rejected.",
                com.example.lend.entity.NotificationType.REJECTED
            );
        } else if (newStatus == BookingStatus.CANCELLED) {
            User recipient = booking.getUser().getEmail().equals(userEmail)
                ? booking.getItem().getOwner()
                : booking.getUser();
            if (recipient != null) {
                createNotification(
                    recipient,
                    "Booking Cancelled",
                    "The booking for " + booking.getItem().getName() + " has been cancelled.",
                    com.example.lend.entity.NotificationType.REJECTED
                );
            }
        } else if (newStatus == BookingStatus.COMPLETED) {
            createNotification(
                booking.getUser(),
                "Rental Completed",
                "Your rental for " + booking.getItem().getName() + " is complete! Please leave a review.",
                com.example.lend.entity.NotificationType.COMPLETED
            );
        }

        return updatedBooking;
    }

    private void createNotification(User recipient, String title, String message, com.example.lend.entity.NotificationType type) {
        com.example.lend.entity.Notification notification = new com.example.lend.entity.Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReadStatus(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }
}
