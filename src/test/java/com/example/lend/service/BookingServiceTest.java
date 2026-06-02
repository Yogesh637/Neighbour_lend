package com.example.lend.service;

import com.example.lend.dto.request.BookingCreateRequest;
import com.example.lend.entity.*;
import com.example.lend.exception.BusinessException;
import com.example.lend.exception.ResourceNotFoundException;
import com.example.lend.repository.BookingRepository;
import com.example.lend.repository.ItemRepository;
import com.example.lend.repository.NotificationRepository;
import com.example.lend.repository.UserRepository;
import com.example.lend.service.impl.BookingServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private BookingServiceImpl bookingService;

    @Test
    public void book_NullDates_ThrowsException() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setItemId(1L);

        assertThrows(IllegalArgumentException.class, () -> {
            bookingService.book(request, "user@gmail.com");
        });
    }

    @Test
    public void book_EndBeforeStart_ThrowsException() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setItemId(1L);
        request.setStartDate(LocalDateTime.now().plusDays(2));
        request.setEndDate(LocalDateTime.now().plusDays(1));

        assertThrows(IllegalArgumentException.class, () -> {
            bookingService.book(request, "user@gmail.com");
        });
    }

    @Test
    public void book_ItemNotFound_ThrowsException() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setItemId(99L);
        request.setStartDate(LocalDateTime.now().plusDays(1));
        request.setEndDate(LocalDateTime.now().plusDays(2));

        when(itemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            bookingService.book(request, "user@gmail.com");
        });
    }

    @Test
    public void book_UserNotFound_ThrowsException() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setItemId(1L);
        request.setStartDate(LocalDateTime.now().plusDays(1));
        request.setEndDate(LocalDateTime.now().plusDays(2));

        Item item = new Item();
        item.setId(1L);

        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            bookingService.book(request, "user@gmail.com");
        });
    }

    @Test
    public void book_SelfRental_ThrowsException() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setItemId(1L);
        request.setStartDate(LocalDateTime.now().plusDays(1));
        request.setEndDate(LocalDateTime.now().plusDays(2));

        User owner = new User();
        owner.setEmail("owner@gmail.com");

        Item item = new Item();
        item.setId(1L);
        item.setOwner(owner);

        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(userRepository.findByEmail("owner@gmail.com")).thenReturn(Optional.of(owner));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            bookingService.book(request, "owner@gmail.com");
        });

        assertEquals("You cannot rent your own item.", exception.getMessage());
    }

    @Test
    public void book_OverlapBooking_ThrowsException() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setItemId(1L);
        request.setStartDate(LocalDateTime.now().plusDays(1));
        request.setEndDate(LocalDateTime.now().plusDays(2));

        User owner = new User();
        owner.setEmail("owner@gmail.com");

        User renter = new User();
        renter.setEmail("renter@gmail.com");

        Item item = new Item();
        item.setId(1L);
        item.setOwner(owner);

        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(userRepository.findByEmail("renter@gmail.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.countOverlappingBookings(1L, request.getStartDate(), request.getEndDate())).thenReturn(1L);

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            bookingService.book(request, "renter@gmail.com");
        });

        assertEquals("Item is already booked for these dates.", exception.getMessage());
    }

    @Test
    public void book_Success() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setItemId(1L);
        request.setStartDate(LocalDateTime.now().plusDays(1));
        request.setEndDate(LocalDateTime.now().plusDays(2));

        User owner = new User();
        owner.setEmail("owner@gmail.com");

        User renter = new User();
        renter.setEmail("renter@gmail.com");

        Item item = new Item();
        item.setId(1L);
        item.setName("Tent");
        item.setOwner(owner);

        when(itemRepository.findById(1L)).thenReturn(Optional.of(item));
        when(userRepository.findByEmail("renter@gmail.com")).thenReturn(Optional.of(renter));
        when(bookingRepository.countOverlappingBookings(1L, request.getStartDate(), request.getEndDate())).thenReturn(0L);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking booking = bookingService.book(request, "renter@gmail.com");

        assertNotNull(booking);
        assertEquals(item, booking.getItem());
        assertEquals(renter, booking.getUser());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    public void updateBookingStatus_Approved_ByOwner_Success() {
        User owner = new User();
        owner.setEmail("owner@gmail.com");

        User borrower = new User();
        borrower.setEmail("borrower@gmail.com");

        Item item = new Item();
        item.setName("Tent");
        item.setOwner(owner);

        Booking booking = new Booking();
        booking.setId(10L);
        booking.setUser(borrower);
        booking.setItem(item);
        booking.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking updated = bookingService.updateBookingStatus(10L, "APPROVED", "owner@gmail.com");

        assertEquals(BookingStatus.APPROVED, updated.getStatus());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    public void updateBookingStatus_Approved_ByNonOwner_ThrowsException() {
        User owner = new User();
        owner.setEmail("owner@gmail.com");

        User borrower = new User();
        borrower.setEmail("borrower@gmail.com");

        Item item = new Item();
        item.setOwner(owner);

        Booking booking = new Booking();
        booking.setId(10L);
        booking.setUser(borrower);
        booking.setItem(item);

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        assertThrows(SecurityException.class, () -> {
            bookingService.updateBookingStatus(10L, "APPROVED", "borrower@gmail.com");
        });
    }

    @Test
    public void updateBookingStatus_Cancelled_ByBorrower_Success() {
        User owner = new User();
        owner.setEmail("owner@gmail.com");

        User borrower = new User();
        borrower.setEmail("borrower@gmail.com");

        Item item = new Item();
        item.setName("Tent");
        item.setOwner(owner);

        Booking booking = new Booking();
        booking.setId(10L);
        booking.setUser(borrower);
        booking.setItem(item);
        booking.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking updated = bookingService.updateBookingStatus(10L, "CANCELLED", "borrower@gmail.com");

        assertEquals(BookingStatus.CANCELLED, updated.getStatus());
        verify(notificationRepository, times(1)).save(any(Notification.class));
    }

    @Test
    public void updateBookingStatus_Cancelled_ByUnauthorized_ThrowsException() {
        User owner = new User();
        owner.setEmail("owner@gmail.com");

        User borrower = new User();
        borrower.setEmail("borrower@gmail.com");

        Item item = new Item();
        item.setOwner(owner);

        Booking booking = new Booking();
        booking.setId(10L);
        booking.setUser(borrower);
        booking.setItem(item);

        when(bookingRepository.findById(10L)).thenReturn(Optional.of(booking));

        assertThrows(SecurityException.class, () -> {
            bookingService.updateBookingStatus(10L, "CANCELLED", "unauthorized@gmail.com");
        });
    }

    @Test
    public void getBookingById_NotFound_ThrowsException() {
        when(bookingRepository.findById(55L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            bookingService.getBookingById(55L);
        });
    }
}
