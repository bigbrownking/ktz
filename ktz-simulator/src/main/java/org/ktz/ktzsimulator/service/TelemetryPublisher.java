package org.ktz.ktzsimulator.service;

import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzsimulator.model.TelemetryData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class TelemetryPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final TelemetryGenerator generator;

    public TelemetryPublisher(RabbitTemplate rabbitTemplate, TelemetryGenerator generator) {
        this.rabbitTemplate = rabbitTemplate;
        this.generator = generator;
    }

    @Scheduled(fixedRateString = "#{1000 / ${telemetry.frequency-hz}}")
    public void publish() {
        TelemetryData te33a = generator.generate(TelemetryData.Type.TE33A);
        TelemetryData kz8a = generator.generate(TelemetryData.Type.KZ8A);

        log.info("Sending generated TE33A: {}, KZ8A: {}", te33a, kz8a);
        rabbitTemplate.convertAndSend("telemetry.exchange", "telemetry.raw", te33a);
        rabbitTemplate.convertAndSend("telemetry.exchange", "telemetry.raw", kz8a);
    }
}