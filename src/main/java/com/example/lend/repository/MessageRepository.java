package com.example.lend.repository;

import com.example.lend.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.email = :user1 AND m.recipient.email = :user2) OR " +
           "(m.sender.email = :user2 AND m.recipient.email = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findChatHistory(@Param("user1") String user1, @Param("user2") String user2);

    @Query("SELECT DISTINCT m.sender.email FROM Message m WHERE m.recipient.email = :email " +
           "UNION " +
           "SELECT DISTINCT m.recipient.email FROM Message m WHERE m.sender.email = :email")
    List<String> findConversations(@Param("email") String email);
}
