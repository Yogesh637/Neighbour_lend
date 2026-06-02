package com.example.lend.service;

import com.example.lend.entity.Booking;
import com.example.lend.entity.BookingStatus;
import com.example.lend.entity.Item;
import com.example.lend.entity.User;
import com.example.lend.exception.BusinessException;
import com.example.lend.exception.ResourceNotFoundException;
import com.example.lend.repository.BookingRepository;
import com.example.lend.repository.ItemRepository;
import com.example.lend.service.impl.ItemServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ItemServiceTest {

    @Mock
    private ItemRepository itemRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private ItemServiceImpl itemService;

    @Test
    public void add_Success() {
        Item item = new Item();
        item.setName("Camera");
        item.setPrice(25.0);

        when(itemRepository.save(item)).thenReturn(item);

        Item saved = itemService.add(item);

        assertNotNull(saved);
        assertEquals("Camera", saved.getName());
        verify(itemRepository, times(1)).save(item);
    }

    @Test
    public void getAllItems_Success() {
        Item item = new Item();
        item.setId(1L);
        item.setName("Drill");

        Booking booking = new Booking();
        booking.setItem(item);
        booking.setStatus(BookingStatus.APPROVED);
        booking.setStartDate(LocalDateTime.now().plusDays(1));
        booking.setEndDate(LocalDateTime.now().plusDays(3));

        when(itemRepository.findAll()).thenReturn(List.of(item));
        when(bookingRepository.findActiveAndFutureBookings(any(LocalDateTime.class))).thenReturn(List.of(booking));

        List<Item> items = itemService.getAllItems();

        assertNotNull(items);
        assertEquals(1, items.size());
        assertNotNull(items.get(0).getNextAvailableDate());
    }

    @Test
    public void getPagedItems_Success() {
        Item item = new Item();
        item.setId(2L);
        item.setName("Bike");

        Pageable pageable = PageRequest.of(0, 10, Sort.by("name").ascending());
        Page<Item> page = new PageImpl<>(List.of(item), pageable, 1);

        when(itemRepository.findByFilters(eq("Sports"), eq("Bike"), any(Pageable.class))).thenReturn(page);
        when(bookingRepository.findActiveAndFutureBookings(any(LocalDateTime.class))).thenReturn(Collections.emptyList());

        Page<Item> result = itemService.getPagedItems(0, 10, "Sports", "Bike");

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Bike", result.getContent().get(0).getName());
    }

    @Test
    public void getItemById_Found_Success() {
        Item item = new Item();
        item.setId(10L);

        when(itemRepository.findById(10L)).thenReturn(Optional.of(item));

        Item found = itemService.getItemById(10L);

        assertNotNull(found);
        assertEquals(10L, found.getId());
    }

    @Test
    public void getItemById_NotFound_ThrowsException() {
        when(itemRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            itemService.getItemById(99L);
        });
    }

    @Test
    public void updateItem_Found_Success() {
        Item existing = new Item();
        existing.setId(5L);
        existing.setName("Old Name");
        existing.setPrice(10.0);

        Item updateDetails = new Item();
        updateDetails.setName("New Name");
        updateDetails.setPrice(20.0);
        updateDetails.setCategory("Electronics");
        updateDetails.setAvailable(false);

        when(itemRepository.findById(5L)).thenReturn(Optional.of(existing));
        when(itemRepository.save(any(Item.class))).thenAnswer(inv -> inv.getArgument(0));

        Item updated = itemService.updateItem(5L, updateDetails);

        assertNotNull(updated);
        assertEquals("New Name", updated.getName());
        assertEquals(20.0, updated.getPrice());
        assertEquals("Electronics", updated.getCategory());
        assertFalse(updated.isAvailable());
    }

    @Test
    public void deleteItem_Found_Success() {
        when(itemRepository.existsById(3L)).thenReturn(true);
        doNothing().when(itemRepository).deleteById(3L);

        assertDoesNotThrow(() -> itemService.deleteItem(3L));

        verify(itemRepository, times(1)).deleteById(3L);
    }

    @Test
    public void deleteItem_NotFound_ThrowsException() {
        when(itemRepository.existsById(99L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            itemService.deleteItem(99L);
        });
    }

    @Test
    public void deleteAllItems_Success() {
        doNothing().when(bookingRepository).deleteAll();
        doNothing().when(itemRepository).deleteAll();

        assertDoesNotThrow(() -> itemService.deleteAllItems());

        verify(bookingRepository, times(1)).deleteAll();
        verify(itemRepository, times(1)).deleteAll();
    }

    @Test
    public void deleteAllItems_Exception_ThrowsBusinessException() {
        doThrow(new RuntimeException("DB locked")).when(bookingRepository).deleteAll();

        assertThrows(BusinessException.class, () -> {
            itemService.deleteAllItems();
        });
    }
}
