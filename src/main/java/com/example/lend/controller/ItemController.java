package com.example.lend.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.lend.service.ItemService;
import com.example.lend.entity.Item;

@RestController
@RequestMapping("/items")
public class ItemController {
	@Autowired
	ItemService service;

	@Autowired
	com.example.lend.service.UserService userService;

	@PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
	public Item add(
			@RequestPart("item") Item item,
			@RequestPart(value = "image", required = false) org.springframework.web.multipart.MultipartFile image)
			throws java.io.IOException {

		String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
				.getAuthentication().getName();
		com.example.lend.entity.User owner = userService.getUserByUsername(username);
		item.setOwner(owner);

		if (image != null && !image.isEmpty()) {
			item.setImageData(image.getBytes());
			item.setImageType(image.getContentType());
			// For consistency with legacy fields, set imageUrl to the DB endpoint
			// This isn't strictly necessary if the frontend uses hasImage, but good for
			// compatibility.
			// item.setImageUrl("http://localhost:8152/items/image/" + item.getId());
			// Wait, ID is null here before save.
		}

		return service.add(item);
	}

	@GetMapping
	public java.util.List<Item> getAll() {
		return service.getAllItems();
	}

	@GetMapping("/{id}")
	public Item getById(@PathVariable Long id) {
		return service.getItemById(id);
	}

	@PutMapping("/{id}")
	public Item update(@PathVariable Long id, @RequestBody Item item) {
		return service.updateItem(id, item);
	}

	@DeleteMapping("/{id}")
	public void delete(@PathVariable Long id) {
		String username = org.springframework.security.core.context.SecurityContextHolder.getContext()
				.getAuthentication().getName();
		Item item = service.getItemById(id);
		if (item.getOwner().getEmail().equals(username)) {
			service.deleteItem(id);
		} else {
			throw new RuntimeException("You are not authorized to delete this item");
		}
	}

	@DeleteMapping("/deleteAll")
	public void deleteAll() {
		service.deleteAllItems();
	}

	@GetMapping("/image/{id}")
	public org.springframework.http.ResponseEntity<byte[]> getImage(@PathVariable Long id) {
		Item item = service.getItemById(id);
		if (item != null && item.getImageData() != null) {
			String contentType = item.getImageType() != null ? item.getImageType() : "image/jpeg";
			return org.springframework.http.ResponseEntity.ok()
					.contentType(org.springframework.http.MediaType.parseMediaType(contentType))
					.header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "max-age=31536000")
					.body(item.getImageData());
		}
		return org.springframework.http.ResponseEntity.notFound().build();
	}
}
