package org.ktz.ktztelemetry.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.dto.SosRequest;
import org.ktz.ktztelemetry.dto.SosResponse;
import org.ktz.ktztelemetry.service.SosService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class SosServiceImpl implements SosService {

    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public Mono<Void> sendSos(SosRequest request) {
        return Mono.fromRunnable(() -> {
            SosResponse response = SosResponse.builder()
                    .locomotiveNumber(request.getLocomotiveNumber())
                    .locomotiveName(request.getLocomotiveName())
                    .latitude(request.getLatitude())
                    .longitude(request.getLongitude())
                    .message(request.getMessage() != null
                            ? request.getMessage() : "SOS! Требуется помощь!")
                    .type("SOS")
                    .timestamp(Instant.now().toString())
                    .build();

            messagingTemplate.convertAndSend("/topic/sos", response);
            messagingTemplate.convertAndSend("/topic/alert/all", response);

            log.warn("SOS from {} at [{}, {}]",
                    response.getLocomotiveNumber(),
                    response.getLatitude(),
                    response.getLongitude());
        });
    }
}