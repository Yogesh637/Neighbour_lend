package com.example.lend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import com.example.lend.entity.BookingStatus;

@Data
public class BookingResponse {
    private Long id;
    private ItemResponse item;
    private UserResponse user; // borrower
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BookingStatus status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ItemResponse getItem() { return item; }
    public void setItem(ItemResponse item) { this.item = item; }
    public UserResponse getUser() { return user; }
    public void setUser(UserResponse user) { this.user = user; }
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public BookingStatus getStatus() { return status; }
    public void setStatus(BookingStatus status) { this.status = status; }
}
