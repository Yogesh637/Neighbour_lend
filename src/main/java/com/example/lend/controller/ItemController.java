package com.example.lend.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.lend.dto.request.ItemCreateRequest;
import com.example.lend.dto.response.ItemResponse;
import com.example.lend.entity.Item;
import com.example.lend.entity.User;
import com.example.lend.mapper.ItemMapper;
import com.example.lend.service.ItemService;
import com.example.lend.service.UserService;
import com.example.lend.exception.BusinessException;

import com.example.lend.dto.response.PagedResponse;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/items")
@Transactional(readOnly = true)
public class ItemController {
	
	private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
	private static final String[] ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"};

	@Autowired
	private ItemService service;

	@Autowired
	private UserService userService;

	@Autowired
	private ItemMapper itemMapper;

	@Autowired
	private com.example.lend.service.CloudinaryService cloudinaryService;

	@PostMapping(consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
	@Transactional
	public ResponseEntity<ItemResponse> add(
			@Valid @RequestPart("item") ItemCreateRequest request,
			@RequestPart(value = "image", required = false) MultipartFile image,
			java.security.Principal principal) {

		// Validate image if provided
		byte[] imageData = null;
		String imageType = null;
		String cloudinaryUrl = null;
		if (image != null && !image.isEmpty()) {
			if (image.getSize() > MAX_FILE_SIZE) {
				throw new BusinessException("File size exceeds 5MB limit");
			}

			String contentType = image.getContentType();
			boolean isAllowed = false;
			for (String type : ALLOWED_TYPES) {
				if (type.equals(contentType)) {
					isAllowed = true;
					break;
				}
			}

			if (!isAllowed) {
				throw new BusinessException("Only JPEG, PNG, and WebP images are allowed");
			}

			try {
				imageData = image.getBytes();
			} catch (java.io.IOException e) {
				throw new BusinessException("Error processing image: " + e.getMessage());
			}
			imageType = contentType;

			// Attempt upload to Cloudinary (returns null if missing configuration)
			cloudinaryUrl = cloudinaryService.upload(image);
		}

		// Get authenticated user
		User owner = userService.getUserByUsername(principal.getName());
		
		Item item = itemMapper.toEntity(request);
		item.setOwner(owner);
		item.setAvailable(true);
		
		if (cloudinaryUrl != null) {
			item.setImageUrl(cloudinaryUrl);
		} else if (imageData != null) {
			item.setImageData(imageData);
			item.setImageType(imageType);
		}

		Item savedItem = service.add(item);
		return ResponseEntity.status(HttpStatus.CREATED).body(itemMapper.toResponse(savedItem));
	}

	@GetMapping
	public ResponseEntity<PagedResponse<ItemResponse>> getAll(
			@RequestParam(value = "page", defaultValue = "0") int page,
			@RequestParam(value = "size", defaultValue = "12") int size,
			@RequestParam(value = "category", required = false) String category,
			@RequestParam(value = "search", required = false) String search) {
		Page<Item> itemPage = service.getPagedItems(page, size, category, search);
		List<ItemResponse> content = itemPage.getContent().stream()
				.map(itemMapper::toResponse)
				.collect(Collectors.toList());
		PagedResponse<ItemResponse> response = new PagedResponse<>(
				content,
				itemPage.getNumber(),
				itemPage.getSize(),
				itemPage.getTotalElements(),
				itemPage.getTotalPages(),
				itemPage.isLast()
		);
		return ResponseEntity.ok(response);
	}

	@GetMapping("/{id}")
	public ResponseEntity<ItemResponse> getById(@PathVariable Long id) {
		Item item = service.getItemById(id);
		return ResponseEntity.ok(itemMapper.toResponse(item));
	}

	@PutMapping("/{id}")
	@Transactional
	public ResponseEntity<ItemResponse> update(
			@PathVariable Long id,
			@Valid @RequestBody ItemCreateRequest request,
			java.security.Principal principal) {

		Item existingItem = service.getItemById(id);
		if (existingItem.getOwner() != null && !existingItem.getOwner().getEmail().equals(principal.getName())) {
			throw new SecurityException("You are not authorized to update this item");
		}
		
		Item itemEntity = itemMapper.toEntity(request);
		itemEntity.setAvailable(existingItem.isAvailable());

		Item updatedItem = service.updateItem(id, itemEntity);
		return ResponseEntity.ok(itemMapper.toResponse(updatedItem));
	}

	@DeleteMapping("/{id}")
	@Transactional
	public ResponseEntity<Void> delete(@PathVariable Long id, java.security.Principal principal) {
		Item item = service.getItemById(id);
		if (item.getOwner() != null && !item.getOwner().getEmail().equals(principal.getName())) {
			throw new SecurityException("You are not authorized to delete this item");
		}
		service.deleteItem(id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}

	@DeleteMapping("/deleteAll")
	@Transactional
	public ResponseEntity<Void> deleteAll() {
		throw new SecurityException("This endpoint is disabled for security reasons");
	}

	@GetMapping("/image/{id}")
	public ResponseEntity<byte[]> getImage(@PathVariable Long id) {
		Item item = service.getItemById(id);
		if (item.getImageData() == null) {
			return ResponseEntity.notFound().build();
		}
		
		String contentType = item.getImageType() != null ? item.getImageType() : "image/jpeg";
		return ResponseEntity.ok()
				.contentType(org.springframework.http.MediaType.parseMediaType(contentType))
				.header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "max-age=31536000")
				.body(item.getImageData());
	}
}
