package org.ktz.ktztelemetry.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelemetryConsumer {
    private final SimpMessagingTemplate messagingTemplate;


    @RabbitListener(queues = "telemetry.raw.telemetry")
    public void consume(TelemetryData data) {
        String destination = "/topic/telemetry/" + data.getLocomotiveNumber();
        messagingTemplate.convertAndSend(destination, data);
        log.info("Pushed to {}: speed={}", destination, data.getSpeed());
    }
}