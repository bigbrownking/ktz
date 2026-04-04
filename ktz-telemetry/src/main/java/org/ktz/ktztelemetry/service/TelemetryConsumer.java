package org.ktz.ktztelemetry.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.dto.MapPoint;
import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelemetryConsumer {
    private final SimpMessagingTemplate messagingTemplate;
    private final TelemetryService telemetryService;

    @RabbitListener(queues = "telemetry.raw.telemetry")
    public void consume(TelemetryData data) {
        telemetryService.store(data);

        messagingTemplate.convertAndSend(
                "/topic/telemetry/" + data.getLocomotiveNumber(), data);

        MapPoint point = MapPoint.builder()
                .locomotiveNumber(data.getLocomotiveNumber())
                .locomotiveName(data.getLocomotiveName())
                .latitude(data.getLatitude())
                .longitude(data.getLongitude())
                .speed(data.getSpeed())
                .timestamp(data.getTimestamp().toString())
                .build();

        messagingTemplate.convertAndSend("/topic/map/all", point);
        messagingTemplate.convertAndSend(
                "/topic/map/" + data.getLocomotiveNumber(), point);
    }
}