package com.example.lend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.lend.entity.Booking;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserEmail(String email);

    List<Booking> findByItemOwnerEmail(String email);

    Page<Booking> findByUserEmail(String email, Pageable pageable);

    Page<Booking> findByItemOwnerEmail(String email, Pageable pageable);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.item.id = :itemId " +
           "AND b.status NOT IN (com.example.lend.entity.BookingStatus.REJECTED, com.example.lend.entity.BookingStatus.CANCELLED) " +
           "AND ((b.startDate <= :end) AND (b.endDate >= :start))")
    long countOverlappingBookings(@Param("itemId") Long itemId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT b FROM Booking b WHERE b.status NOT IN (com.example.lend.entity.BookingStatus.REJECTED, com.example.lend.entity.BookingStatus.CANCELLED) " +
           "AND b.endDate >= :now")
    List<Booking> findActiveAndFutureBookings(@Param("now") LocalDateTime now);
}
