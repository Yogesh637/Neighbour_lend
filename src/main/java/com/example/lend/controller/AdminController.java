package com.example.lend.controller;

import com.example.lend.entity.*;
import com.example.lend.repository.*;
import com.example.lend.dto.response.PagedResponse;
import com.example.lend.exception.ResourceNotFoundException;
import com.example.lend.exception.BusinessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@Transactional(readOnly = true)
public class AdminController {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final BookingRepository bookingRepository;

    public AdminController(UserRepository userRepository,
                           ItemRepository itemRepository,
                           BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.itemRepository = itemRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        long totalUsers = userRepository.count();
        long totalItems = itemRepository.count();
        long totalBookings = bookingRepository.count();

        List<Booking> allBookings = bookingRepository.findAll();
        double totalBookingValue = 0.0;
        double totalRevenue = 0.0;

        Map<String, Long> bookingsByStatus = new HashMap<>();
        Map<String, Double> monthlyRevenue = new LinkedHashMap<>();
        
        // Initialize monthly stats for the last 6 months to make graphs look nice
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            String monthName = now.minusMonths(i).getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            monthlyRevenue.put(monthName, 0.0);
        }

        for (Booking booking : allBookings) {
            String status = booking.getStatus().name();
            bookingsByStatus.put(status, bookingsByStatus.getOrDefault(status, 0L) + 1);

            if (booking.getStatus() == BookingStatus.APPROVED || booking.getStatus() == BookingStatus.COMPLETED) {
                long days = ChronoUnit.DAYS.between(booking.getStartDate(), booking.getEndDate());
                if (days <= 0) days = 1;
                
                double cost = days * booking.getItem().getPrice();
                double fee = cost * 0.05; // 5% platform fee
                
                totalBookingValue += cost;
                totalRevenue += fee;

                // Month-wise grouping
                String bookingMonth = booking.getStartDate().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
                if (monthlyRevenue.containsKey(bookingMonth)) {
                    monthlyRevenue.put(bookingMonth, monthlyRevenue.get(bookingMonth) + fee);
                }
            }
        }

        // Group items by category
        List<Item> allItems = itemRepository.findAll();
        Map<String, Long> itemsByCategory = allItems.stream()
                .collect(Collectors.groupingBy(Item::getCategory, Collectors.counting()));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("totalUsers", totalUsers);
        analytics.put("totalItems", totalItems);
        analytics.put("totalBookings", totalBookings);
        analytics.put("totalBookingValue", totalBookingValue);
        analytics.put("totalRevenue", totalRevenue);
        analytics.put("bookingsByStatus", bookingsByStatus);
        analytics.put("itemsByCategory", itemsByCategory);
        analytics.put("monthlyRevenue", monthlyRevenue);

        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/users")
    public ResponseEntity<PagedResponse<UserAdminDto>> getUsers(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("email").ascending());
        Page<User> userPage = userRepository.findAll(pageable);

        List<UserAdminDto> content = userPage.getContent().stream().map(user -> new UserAdminDto(
                user.getId(),
                user.getEmail(),
                user.getAddress(),
                user.isVerified(),
                user.getRoles().stream().map(Role::name).collect(Collectors.toSet())
        )).collect(Collectors.toList());

        return ResponseEntity.ok(new PagedResponse<>(
                content,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isLast()
        ));
    }

    @PutMapping("/users/{id}/role")
    @Transactional
    public ResponseEntity<Void> updateUserRole(@PathVariable Long id, @RequestBody Map<String, List<String>> request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<String> rolesInput = request.get("roles");
        if (rolesInput == null || rolesInput.isEmpty()) {
            throw new BusinessException("At least one role is required");
        }

        Set<Role> roles = rolesInput.stream()
                .map(r -> Role.valueOf(r.toUpperCase()))
                .collect(Collectors.toSet());

        user.setRoles(roles);
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{id}/status")
    @Transactional
    public ResponseEntity<Void> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setVerified(!user.isVerified());
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/items")
    public ResponseEntity<PagedResponse<ItemAdminDto>> getItems(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        Page<Item> itemPage = itemRepository.findAll(pageable);

        List<ItemAdminDto> content = itemPage.getContent().stream().map(item -> new ItemAdminDto(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getPrice(),
                item.isAvailable(),
                item.getOwner() != null ? item.getOwner().getEmail() : "System"
        )).collect(Collectors.toList());

        return ResponseEntity.ok(new PagedResponse<>(
                content,
                itemPage.getNumber(),
                itemPage.getSize(),
                itemPage.getTotalElements(),
                itemPage.getTotalPages(),
                itemPage.isLast()
        ));
    }

    @PutMapping("/items/{id}/moderate")
    @Transactional
    public ResponseEntity<Void> toggleItemAvailability(@PathVariable Long id) {
        Item item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        item.setAvailable(!item.isAvailable());
        itemRepository.save(item);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/bookings")
    public ResponseEntity<PagedResponse<BookingAdminDto>> getBookings(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("startDate").descending());
        Page<Booking> bookingPage = bookingRepository.findAll(pageable);

        List<BookingAdminDto> content = bookingPage.getContent().stream().map(booking -> new BookingAdminDto(
                booking.getId(),
                booking.getItem().getName(),
                booking.getUser().getEmail(),
                booking.getItem().getOwner() != null ? booking.getItem().getOwner().getEmail() : "System",
                booking.getStartDate().toString(),
                booking.getEndDate().toString(),
                booking.getStatus().name()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(new PagedResponse<>(
                content,
                bookingPage.getNumber(),
                bookingPage.getSize(),
                bookingPage.getTotalElements(),
                bookingPage.getTotalPages(),
                bookingPage.isLast()
        ));
    }

    @PutMapping("/bookings/{id}/force-cancel")
    @Transactional
    public ResponseEntity<Void> forceCancelBooking(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        return ResponseEntity.ok().build();
    }

    // DTO records for admin payload transmission
    public static class UserAdminDto {
        private Long id;
        private String email;
        private String address;
        private boolean verified;
        private Set<String> roles;

        public UserAdminDto(Long id, String email, String address, boolean verified, Set<String> roles) {
            this.id = id;
            this.email = email;
            this.address = address;
            this.verified = verified;
            this.roles = roles;
        }

        public Long getId() { return id; }
        public String getEmail() { return email; }
        public String getAddress() { return address; }
        public boolean isVerified() { return verified; }
        public Set<String> getRoles() { return roles; }
    }

    public static class ItemAdminDto {
        private Long id;
        private String name;
        private String category;
        private double price;
        private boolean available;
        private String ownerEmail;

        public ItemAdminDto(Long id, String name, String category, double price, boolean available, String ownerEmail) {
            this.id = id;
            this.name = name;
            this.category = category;
            this.price = price;
            this.available = available;
            this.ownerEmail = ownerEmail;
        }

        public Long getId() { return id; }
        public String getName() { return name; }
        public String getCategory() { return category; }
        public double getPrice() { return price; }
        public boolean isAvailable() { return available; }
        public String getOwnerEmail() { return ownerEmail; }
    }

    public static class BookingAdminDto {
        private Long id;
        private String itemName;
        private String renterEmail;
        private String ownerEmail;
        private String startDate;
        private String endDate;
        private String status;

        public BookingAdminDto(Long id, String itemName, String renterEmail, String ownerEmail, String startDate, String endDate, String status) {
            this.id = id;
            this.itemName = itemName;
            this.renterEmail = renterEmail;
            this.ownerEmail = ownerEmail;
            this.startDate = startDate;
            this.endDate = endDate;
            this.status = status;
        }

        public Long getId() { return id; }
        public String getItemName() { return itemName; }
        public String getRenterEmail() { return renterEmail; }
        public String getOwnerEmail() { return ownerEmail; }
        public String getStartDate() { return startDate; }
        public String getEndDate() { return endDate; }
        public String getStatus() { return status; }
    }
}
