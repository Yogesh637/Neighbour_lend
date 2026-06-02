package com.example.lend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "items", indexes = {
    @Index(name = "idx_item_name", columnList = "name"),
    @Index(name = "idx_item_category", columnList = "category"),
    @Index(name = "idx_item_owner", columnList = "user_id"),
    @Index(name = "idx_item_available", columnList = "available")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Item {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Column(columnDefinition = "TEXT")
	private String description;

	@Column(nullable = false)
	private Double price;

	private String imageUrl;
	private String imageType;

	@com.fasterxml.jackson.annotation.JsonIgnore
	@Lob
	@Column(columnDefinition = "LONGBLOB")
	private byte[] imageData;

	@Column(nullable = false, length = 50)
	private String category;

	@Column(nullable = false)
	private boolean available = true;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_item_owner"))
	private User owner;

	private Double weeklyRate;
	private Double securityDeposit;
	private String city;
	private String state;
	private String ownerName;

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

	public Double getWeeklyRate() {
		return weeklyRate;
	}

	public void setWeeklyRate(Double weeklyRate) {
		this.weeklyRate = weeklyRate;
	}

	public Double getSecurityDeposit() {
		return securityDeposit;
	}

	public void setSecurityDeposit(Double securityDeposit) {
		this.securityDeposit = securityDeposit;
	}

	public String getCity() {
		return city;
	}

	public void setCity(String city) {
		this.city = city;
	}

	public String getState() {
		return state;
	}

	public void setState(String state) {
		this.state = state;
	}

	public String getOwnerName() {
		return ownerName;
	}

	public void setOwnerName(String ownerName) {
		this.ownerName = ownerName;
	}
}
