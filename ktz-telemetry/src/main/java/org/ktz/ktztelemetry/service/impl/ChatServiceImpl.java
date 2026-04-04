package org.ktz.ktztelemetry.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.dto.ChatMessage;
import org.ktz.ktztelemetry.service.ChatService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public Mono<Void> sendToLocomotive(ChatMessage message) {
        return Mono.fromRunnable(() -> {
            message.setTimestamp(Instant.now());
            String destination = "/topic/chat/" + message.getLocomotiveNumber();
            messagingTemplate.convertAndSend(destination, message);
            messagingTemplate.convertAndSend("/topic/chat/dispatcher", message);
            log.info("Dispatcher → {}: {}", message.getLocomotiveNumber(), message.getMessage());
        });
    }

    @Override
    public Mono<Void> sendToDispatcher(ChatMessage message) {
        return Mono.fromRunnable(() -> {
            message.setTimestamp(Instant.now());
            messagingTemplate.convertAndSend("/topic/chat/dispatcher", message);
            String destination = "/topic/chat/" + message.getLocomotiveNumber();
            messagingTemplate.convertAndSend(destination, message);
            log.info("Driver {} → dispatcher: {}", message.getLocomotiveNumber(), message.getMessage());
        });
    }

    @Override
    public Mono<Void> broadcast(ChatMessage message) {
        return Mono.fromRunnable(() -> {
            message.setTimestamp(Instant.now());
            messagingTemplate.convertAndSend("/topic/chat/all", message);
            log.info("Broadcast from {}: {}", message.getFrom(), message.getMessage());
        });
    }
}