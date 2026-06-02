package com.example.lend.repository;

import com.example.lend.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByRecipientEmail(String email, Pageable pageable);
    long countByRecipientEmailAndReadStatus(String email, boolean readStatus);
}
