package org.ktz.ktztelemetry.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.config.WebSocketSinks;
import org.ktz.ktztelemetry.dto.ChatMessage;
import org.ktz.ktztelemetry.service.ChatService;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

// ChatServiceImpl.java
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final WebSocketSinks wsSinks;

    @Override
    public Mono<Void> sendToLocomotive(ChatMessage message) {
        return Mono.fromRunnable(() -> {
            message.setTimestamp(Instant.now());
            wsSinks.send("chat/" + message.getLocomotiveNumber(), message);
            wsSinks.send("chat/dispatcher", message);
            log.info("Dispatcher → {}: {}", message.getLocomotiveNumber(), message.getMessage());
        });
    }

    @Override
    public Mono<Void> sendToDispatcher(ChatMessage message) {
        return Mono.fromRunnable(() -> {
            message.setTimestamp(Instant.now());
            wsSinks.send("chat/dispatcher", message);
            wsSinks.send("chat/" + message.getLocomotiveNumber(), message);
            log.info("Driver {} → dispatcher: {}", message.getLocomotiveNumber(), message.getMessage());
        });
    }

    @Override
    public Mono<Void> broadcast(ChatMessage message) {
        return Mono.fromRunnable(() -> {
            message.setTimestamp(Instant.now());
            wsSinks.send("chat/all", message);
            log.info("Broadcast from {}: {}", message.getFrom(), message.getMessage());
        });
    }
}