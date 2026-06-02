package com.example.lend.controller;

import com.example.lend.entity.Booking;
import com.example.lend.entity.Item;
import com.example.lend.entity.Review;
import com.example.lend.entity.User;
import com.example.lend.exception.BusinessException;
import com.example.lend.repository.BookingRepository;
import com.example.lend.repository.ItemRepository;
import com.example.lend.repository.ReviewRepository;
import com.example.lend.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reviews")
@Transactional(readOnly = true)
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public ReviewController(ReviewRepository reviewRepository,
                            ItemRepository itemRepository,
                            UserRepository userRepository,
                            BookingRepository bookingRepository) {
        this.reviewRepository = reviewRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ReviewDto> createReview(@Valid @RequestBody ReviewCreateRequest request, Principal principal) {
        String email = principal.getName();
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("User not found"));

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new BusinessException("Item not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException("Booking not found"));

        // Verify the booking is related to this user and item, and is completed/approved
        if (!booking.getUser().getEmail().equals(email)) {
            throw new SecurityException("You cannot review a booking you did not make.");
        }
        if (!booking.getItem().getId().equals(request.getItemId())) {
            throw new BusinessException("Booking does not match the reviewed item.");
        }

        // Check if review already exists for this booking
        if (reviewRepository.existsByAuthorEmailAndBookingId(email, request.getBookingId())) {
            throw new BusinessException("You have already reviewed this booking.");
        }

        Review review = new Review();
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setItem(item);
        review.setAuthor(author);
        review.setBooking(booking);
        review.setCreatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        return ResponseEntity.status(HttpStatus.CREATED).body(new ReviewDto(
                savedReview.getId(),
                savedReview.getRating(),
                savedReview.getComment(),
                savedReview.getAuthor().getEmail(),
                savedReview.getCreatedAt().toString()
        ));
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<ReviewDto>> getItemReviews(@PathVariable Long itemId) {
        List<Review> reviews = reviewRepository.findByItemId(itemId);
        List<ReviewDto> response = reviews.stream().map(r -> new ReviewDto(
                r.getId(),
                r.getRating(),
                r.getComment(),
                r.getAuthor().getEmail(),
                r.getCreatedAt().toString()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    public static class ReviewCreateRequest {
        @NotNull(message = "Item ID is required")
        private Long itemId;

        @NotNull(message = "Booking ID is required")
        private Long bookingId;

        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating must be at most 5")
        private int rating;

        @NotBlank(message = "Comment is required")
        private String comment;

        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public Long getBookingId() { return bookingId; }
        public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
        public int getRating() { return rating; }
        public void setRating(int rating) { this.rating = rating; }
        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
    }

    public static class ReviewDto {
        private Long id;
        private int rating;
        private String comment;
        private String authorEmail;
        private String createdAt;

        public ReviewDto(Long id, int rating, String comment, String authorEmail, String createdAt) {
            this.id = id;
            this.rating = rating;
            this.comment = comment;
            this.authorEmail = authorEmail;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public int getRating() { return rating; }
        public String getComment() { return comment; }
        public String getAuthorEmail() { return authorEmail; }
        public String getCreatedAt() { return createdAt; }
    }
}
