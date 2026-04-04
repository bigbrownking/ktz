package org.ktz.ktztelemetry.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelemetryConsumer {

    private final TelemetryService telemetryService;

    @RabbitListener(queues = "telemetry.raw.telemetry")
    public void consume(TelemetryData data) {
        telemetryService.store(data);
        log.debug("Consumed telemetry for {}", data.getLocomotiveNumber());
    }
}