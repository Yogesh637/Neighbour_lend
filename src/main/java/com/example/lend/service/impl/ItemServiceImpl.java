package com.example.lend.service.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import com.example.lend.entity.Item;
import com.example.lend.entity.Booking;
import com.example.lend.entity.BookingStatus;
import com.example.lend.repository.ItemRepository;
import com.example.lend.repository.BookingRepository;
import com.example.lend.service.ItemService;
import com.example.lend.exception.ResourceNotFoundException;
import com.example.lend.exception.BusinessException;

@Service
public class ItemServiceImpl implements ItemService {

    @Autowired
    private ItemRepository repo;

    @Autowired
    private BookingRepository bookingRepo;

    @Override
    @Transactional
    public Item add(Item item) {
        if (item.getSecurityDeposit() == null) {
            double price = item.getPrice() != null ? item.getPrice() : 0.0;
            item.setSecurityDeposit(Math.round(price * 0.10 * 100.0) / 100.0);
        }
        if (item.getWeeklyRate() == null) {
            double price = item.getPrice() != null ? item.getPrice() : 0.0;
            item.setWeeklyRate(Math.round(price * 6.0 * 100.0) / 100.0);
        }
        if (item.getCity() == null) {
            if (item.getOwner() != null && item.getOwner().getAddress() != null) {
                String addr = item.getOwner().getAddress();
                String[] parts = addr.split(",");
                String cityVal = parts[parts.length - 1].trim();
                item.setCity(cityVal);
                item.setState("Karnataka"); // default fallback
            } else {
                item.setCity("Bangalore");
                item.setState("Karnataka");
            }
        }
        if (item.getOwnerName() == null && item.getOwner() != null) {
            item.setOwnerName(item.getOwner().getEmail().split("@")[0]);
        }
        return repo.save(item);
    }

    @Override
    public List<Item> getAllItems() {
        List<Item> items = repo.findAll();
        enrichWithNextAvailableDate(items);
        return items;
    }

    @Override
    public Page<Item> getPagedItems(int page, int size, String category, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());

        String categoryFilter = (category != null && !category.isEmpty() && !"All".equalsIgnoreCase(category)) ? category : null;
        String searchFilter = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Item> itemPage = repo.findByFilters(categoryFilter, searchFilter, pageable);

        // Enrich with next available date
        enrichWithNextAvailableDate(itemPage.getContent());

        return itemPage;
    }

    private void enrichWithNextAvailableDate(List<Item> items) {
        if (items.isEmpty()) return;

        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        // Fetch only active and future bookings to avoid N+1
        List<Booking> allBookings = bookingRepo.findActiveAndFutureBookings(now);

        // Group bookings by item ID for efficient lookup
        Map<Long, List<Booking>> bookingsByItemId = allBookings.stream()
                .collect(Collectors.groupingBy(b -> b.getItem().getId()));

        for (Item item : items) {
            java.time.LocalDateTime maxEndDate = now;
            List<Booking> itemBookings = bookingsByItemId.getOrDefault(item.getId(), List.of());

            for (Booking b : itemBookings) {
                if (b.getStatus() != BookingStatus.REJECTED && b.getEndDate().isAfter(maxEndDate)) {
                    maxEndDate = b.getEndDate();
                }
            }
            item.setNextAvailableDate(maxEndDate);
        }
    }

    @Override
    @Cacheable(value = "items", key = "#id")
    public Item getItemById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
    }

    @Override
    @Transactional
    @CacheEvict(value = "items", key = "#id")
    public Item updateItem(Long id, Item item) {
        Item existing = getItemById(id);
        existing.setName(item.getName());
        existing.setDescription(item.getDescription());
        existing.setPrice(item.getPrice());
        existing.setImageUrl(item.getImageUrl());
        existing.setCategory(item.getCategory());
        existing.setAvailable(item.isAvailable());
        existing.setWeeklyRate(item.getWeeklyRate());
        existing.setSecurityDeposit(item.getSecurityDeposit());
        existing.setCity(item.getCity());
        existing.setState(item.getState());
        existing.setOwnerName(item.getOwnerName());
        return repo.save(existing);
    }

    @Override
    @Transactional
    @CacheEvict(value = "items", key = "#id")
    public void deleteItem(Long id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("Item not found with id: " + id);
        }
        repo.deleteById(id);
    }

    @Override
    @Transactional
    @CacheEvict(value = "items", allEntries = true)
    public void deleteAllItems() {
        try {
            bookingRepo.deleteAll();
            repo.deleteAll();
        } catch (Exception e) {
            throw new BusinessException("Failed to clear items: " + e.getMessage());
        }
    }
}
