package com.example.lend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.lend.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    java.util.List<Booking> findByUserEmail(String email);

    java.util.List<Booking> findByItemOwnerEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(b) FROM Booking b WHERE b.item.id = :itemId AND b.status != com.example.lend.entity.BookingStatus.REJECTED AND ((b.startDate <= :end) AND (b.endDate >= :start))")
    long countOverlappingBookings(@org.springframework.data.repository.query.Param("itemId") Long itemId,
            @org.springframework.data.repository.query.Param("start") java.time.LocalDateTime start,
            @org.springframework.data.repository.query.Param("end") java.time.LocalDateTime end);
}
