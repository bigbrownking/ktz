package org.ktz.ktztelemetry.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.dto.AlertRequest;
import org.ktz.ktztelemetry.service.AlertService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public Mono<Void> sendAlert(AlertRequest request) {
        return Mono.fromRunnable(() -> {
            String destination = "/topic/alert/" + request.getLocomotiveNumber();
            Map<String, Object> payload = Map.of(
                    "message",         request.getMessage(),
                    "type",            request.getType(),
                    "locomotiveNumber", request.getLocomotiveNumber(),
                    "timestamp",       Instant.now().toString()
            );
            messagingTemplate.convertAndSend(destination, payload);
            log.info("Alert sent to {}: [{}] {}", destination, request.getType(), request.getMessage());
        });
    }

    @Override
    public Mono<Void> sendToAll(AlertRequest request) {
        return Mono.fromRunnable(() -> {
            Map<String, Object> payload = Map.of(
                    "message",   request.getMessage(),
                    "type",      request.getType(),
                    "timestamp", Instant.now().toString()
            );
            messagingTemplate.convertAndSend("/topic/alert/all", payload);
            log.info("Alert broadcast: [{}] {}", request.getType(), request.getMessage());
        });
    }
}