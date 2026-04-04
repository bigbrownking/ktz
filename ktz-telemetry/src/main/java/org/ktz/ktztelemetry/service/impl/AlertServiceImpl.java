package org.ktz.ktztelemetry.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.config.WebSocketSinks;
import org.ktz.ktztelemetry.dto.AlertRequest;
import org.ktz.ktztelemetry.service.AlertService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.Map;

// AlertServiceImpl.java
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertServiceImpl implements AlertService {

    private final WebSocketSinks wsSinks;

    @Override
    public Mono<Void> sendAlert(AlertRequest request) {
        return Mono.fromRunnable(() -> {
            Map<String, Object> payload = Map.of(
                    "message",          request.getMessage(),
                    "type",             request.getType(),
                    "locomotiveNumber", request.getLocomotiveNumber(),
                    "timestamp",        Instant.now().toString()
            );
            wsSinks.send("alert/" + request.getLocomotiveNumber(), payload);
            log.info("Alert sent to {}: [{}] {}", request.getLocomotiveNumber(),
                    request.getType(), request.getMessage());
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
            wsSinks.send("alert/all", payload);
            log.info("Alert broadcast: [{}] {}", request.getType(), request.getMessage());
        });
    }
}