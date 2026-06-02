package com.example.lend.security;

import com.example.lend.entity.Message;
import com.example.lend.entity.User;
import com.example.lend.repository.MessageRepository;
import com.example.lend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private static final Logger logger = LoggerFactory.getLogger(ChatWebSocketHandler.class);
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    public ChatWebSocketHandler(JwtUtil jwtUtil, UserRepository userRepository, MessageRepository messageRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri().getQuery();
        String token = null;
        if (query != null && query.startsWith("token=")) {
            token = query.substring(6);
        }

        if (token == null || !jwtUtil.validateToken(token)) {
            logger.warn("WebSocket connection rejected: invalid/missing token");
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String email = jwtUtil.extractEmail(token);
        session.getAttributes().put("email", email);
        sessions.put(email, session);
        logger.info("WebSocket connection established for user: {}", email);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String senderEmail = (String) session.getAttributes().get("email");
        if (senderEmail == null) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String recipientEmail = payload.get("recipient");
            String content = payload.get("content");

            if (recipientEmail == null || content == null || content.trim().isEmpty()) {
                return;
            }

            User sender = userRepository.findByEmail(senderEmail).orElse(null);
            User recipient = userRepository.findByEmail(recipientEmail).orElse(null);

            if (sender != null && recipient != null) {
                // Save message to database
                Message msg = new Message();
                msg.setSender(sender);
                msg.setRecipient(recipient);
                msg.setContent(content);
                msg.setReadStatus(false);
                msg.setCreatedAt(LocalDateTime.now());
                msg = messageRepository.save(msg);

                // Forward to recipient if online
                WebSocketSession recipientSession = sessions.get(recipientEmail);
                if (recipientSession != null && recipientSession.isOpen()) {
                    Map<String, Object> outboundPayload = Map.of(
                            "id", msg.getId(),
                            "sender", senderEmail,
                            "recipient", recipientEmail,
                            "content", content,
                            "createdAt", msg.getCreatedAt().toString()
                    );
                    recipientSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(outboundPayload)));
                }

                // Send confirmation back to sender with DB message id
                Map<String, Object> ackPayload = Map.of(
                        "id", msg.getId(),
                        "sender", senderEmail,
                        "recipient", recipientEmail,
                        "content", content,
                        "createdAt", msg.getCreatedAt().toString()
                );
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(ackPayload)));
            }
        } catch (Exception e) {
            logger.error("Error processing incoming WebSocket message", e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String email = (String) session.getAttributes().get("email");
        if (email != null) {
            sessions.remove(email);
            logger.info("WebSocket connection closed for user: {}", email);
        }
    }
}
