package org.ktz.ktzsimulator.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzsimulator.model.LocomotiveProperties;
import org.ktz.ktzsimulator.model.TelemetryData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelemetryPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final TelemetryGenerator generator;
    private final LocomotiveProperties properties;

    private volatile boolean running = true;

    @Scheduled(fixedRateString = "#{1000 / ${telemetry.frequency-hz}}")
    public void publish() {
        if (!running) return;
        for (LocomotiveProperties.LocomotiveConfig loco : properties.getLocomotives()) {
            TelemetryData data = generator.generate(
                    loco.getType(), loco.getNumber(), loco.getName(),
                    loco.getStartLat(), loco.getStartLon(),
                    loco.getEndLat(), loco.getEndLon());
            rabbitTemplate.convertAndSend("telemetry.exchange", "telemetry.raw", data);
        }
    }

    public void start() { this.running = true; }
    public void stop()  { this.running = false; }
}