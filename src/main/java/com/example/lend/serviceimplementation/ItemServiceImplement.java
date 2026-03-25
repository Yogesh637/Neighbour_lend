package com.example.lend.serviceimplementation;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.lend.service.ItemService;
import com.example.lend.repository.ItemRepository;
import com.example.lend.entity.Item;
import java.util.List;

@Service
public class ItemServiceImplement implements ItemService {
	@Autowired
	ItemRepository repo;

	public Item add(Item item) {
		return repo.save(item);
	}

	public List<Item> getAllItems() {
		List<Item> items = repo.findAll();
		java.time.LocalDateTime now = java.time.LocalDateTime.now();

		for (Item item : items) {
			// Find latest end date among confirmed/pending future bookings
			java.util.List<com.example.lend.entity.Booking> bookings = bookingRepo
					.findByItemOwnerEmail(item.getOwner().getEmail());

			java.time.LocalDateTime maxEndDate = now;
			for (com.example.lend.entity.Booking b : bookings) {
				if (b.getItem().getId().equals(item.getId()) &&
						b.getStatus() != com.example.lend.entity.BookingStatus.REJECTED &&
						b.getEndDate().isAfter(maxEndDate)) {
					maxEndDate = b.getEndDate();
				}
			}
			item.setNextAvailableDate(maxEndDate);
		}
		return items;
	}

	public Item getItemById(Long id) {
		return repo.findById(id).orElseThrow(() -> new RuntimeException("Item not found"));
	}

	public Item updateItem(Long id, Item item) {
		Item existing = getItemById(id);
		existing.setName(item.getName());
		existing.setDescription(item.getDescription());
		existing.setPrice(item.getPrice());
		existing.setImageUrl(item.getImageUrl());
		existing.setCategory(item.getCategory());
		existing.setAvailable(item.isAvailable());
		return repo.save(existing);
	}

	@Autowired
	private com.example.lend.repository.BookingRepository bookingRepo;

	@Override
	public void deleteItem(Long id) {
		repo.deleteById(id);
	}

	@Override
	public void deleteAllItems() {
		try {
			bookingRepo.deleteAll();
			repo.deleteAll();
		} catch (Exception e) {
			throw new RuntimeException("Failed to clear items", e);
		}
	}
}
