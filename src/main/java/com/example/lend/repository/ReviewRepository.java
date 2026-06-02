package com.example.lend.repository;

import com.example.lend.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByItemId(Long itemId);
    boolean existsByAuthorEmailAndBookingId(String authorEmail, Long bookingId);
}
