package org.ktz.ktztelemetry.service;

import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class TelemetryConsumer {

    @RabbitListener(queues = "telemetry.raw.telemetry")
    public void consume(TelemetryData data) {

    }
}