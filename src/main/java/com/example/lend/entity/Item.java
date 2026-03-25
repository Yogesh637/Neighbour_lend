package com.example.lend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Item {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	private String name;
	private String description;
	private Double price;
	private String imageUrl;
	private String imageType;

	@com.fasterxml.jackson.annotation.JsonIgnore
	@Lob
	@Column(columnDefinition = "LONGBLOB")
	private byte[] imageData;

	private String category;

	@Column(nullable = false)
	private boolean available = true;

	@ManyToOne
	@JoinColumn(name = "user_id")
	private User owner; // Link item to an owner

	@Transient
	private java.time.LocalDateTime nextAvailableDate;

	public java.time.LocalDateTime getNextAvailableDate() {
		return nextAvailableDate;
	}

	public void setNextAvailableDate(java.time.LocalDateTime nextAvailableDate) {
		this.nextAvailableDate = nextAvailableDate;
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public Double getPrice() {
		return price;
	}

	public void setPrice(Double price) {
		this.price = price;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public User getOwner() {
		return owner;
	}

	public void setOwner(User owner) {
		this.owner = owner;
	}

	public boolean isAvailable() {
		return available;
	}

	public void setAvailable(boolean available) {
		this.available = available;
	}

	public String getImageType() {
		return imageType;
	}

	public void setImageType(String imageType) {
		this.imageType = imageType;
	}

	public byte[] getImageData() {
		return imageData;
	}

	public void setImageData(byte[] imageData) {
		this.imageData = imageData;
	}

	@com.fasterxml.jackson.annotation.JsonProperty("hasImage")
	public boolean hasImage() {
		return imageData != null && imageData.length > 0;
	}
}
