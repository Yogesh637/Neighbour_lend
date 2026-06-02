package com.example.lend.controller;

import com.example.lend.entity.Notification;
import com.example.lend.exception.BusinessException;
import com.example.lend.repository.NotificationRepository;
import com.example.lend.dto.response.PagedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
@Transactional(readOnly = true)
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<PagedResponse<NotificationDto>> getNotifications(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            Principal principal) {
        
        String email = principal.getName();
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        
        Page<Notification> notificationPage = notificationRepository.findByRecipientEmail(email, pageable);
        
        List<NotificationDto> content = notificationPage.getContent().stream()
                .map(n -> new NotificationDto(
                        n.getId(),
                        n.getTitle(),
                        n.getMessage(),
                        n.getType().name(),
                        n.isReadStatus(),
                        n.getCreatedAt().toString()
                )).collect(Collectors.toList());

        PagedResponse<NotificationDto> response = new PagedResponse<>(
                content,
                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                notificationPage.isLast()
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Principal principal) {
        String email = principal.getName();
        long count = notificationRepository.countByRecipientEmailAndReadStatus(email, false);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Principal principal) {
        String email = principal.getName();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Notification not found"));

        if (!notification.getRecipient().getEmail().equals(email)) {
            throw new SecurityException("You are not authorized to update this notification");
        }

        notification.setReadStatus(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok().build();
    }

    public static class NotificationDto {
        private Long id;
        private String title;
        private String message;
        private String type;
        private boolean readStatus;
        private String createdAt;

        public NotificationDto(Long id, String title, String message, String type, boolean readStatus, String createdAt) {
            this.id = id;
            this.title = title;
            this.message = message;
            this.type = type;
            this.readStatus = readStatus;
            this.createdAt = createdAt;
        }

        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public String getType() { return type; }
        public boolean isReadStatus() { return readStatus; }
        public String getCreatedAt() { return createdAt; }
    }
}
