package com.example.lend.controller;

import com.example.lend.entity.Message;
import com.example.lend.repository.MessageRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/messages")
@Transactional(readOnly = true)
public class MessageController {

    private final MessageRepository messageRepository;

    public MessageController(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    @GetMapping("/history/{otherUserEmail}")
    public ResponseEntity<List<MessageDto>> getChatHistory(@PathVariable String otherUserEmail, Principal principal) {
        String currentUserEmail = principal.getName();
        List<Message> history = messageRepository.findChatHistory(currentUserEmail, otherUserEmail);
        List<MessageDto> response = history.stream().map(m -> new MessageDto(
                m.getId(),
                m.getSender().getEmail(),
                m.getRecipient().getEmail(),
                m.getContent(),
                m.getCreatedAt().toString(),
                m.isReadStatus()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<String>> getConversations(Principal principal) {
        String currentUserEmail = principal.getName();
        List<String> conversations = messageRepository.findConversations(currentUserEmail);
        return ResponseEntity.ok(conversations);
    }

    public static class MessageDto {
        private Long id;
        private String sender;
        private String recipient;
        private String content;
        private String createdAt;
        private boolean readStatus;

        public MessageDto(Long id, String sender, String recipient, String content, String createdAt, boolean readStatus) {
            this.id = id;
            this.sender = sender;
            this.recipient = recipient;
            this.content = content;
            this.createdAt = createdAt;
            this.readStatus = readStatus;
        }

        public Long getId() { return id; }
        public String getSender() { return sender; }
        public String getRecipient() { return recipient; }
        public String getContent() { return content; }
        public String getCreatedAt() { return createdAt; }
        public boolean isReadStatus() { return readStatus; }
    }
}
