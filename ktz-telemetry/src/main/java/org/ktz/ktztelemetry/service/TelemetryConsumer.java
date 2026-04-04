package org.ktz.ktztelemetry.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.config.WebSocketSinks;
import org.ktz.ktztelemetry.health.EmaBuffer;
import org.ktz.ktztelemetry.health.HealthIndex;
import org.ktz.ktztelemetry.health.HealthIndexCalculator;
import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelemetryConsumer {

    private final TelemetryService      telemetryService;
    private final EmaBuffer             emaBuffer;
    private final HealthIndexCalculator healthCalculator;
    private final WebSocketSinks wsSinks;

    @RabbitListener(queues = "telemetry.raw.telemetry")
    public void consume(TelemetryData raw) {
        TelemetryData smoothed = emaBuffer.apply(raw);
        if (smoothed == null) return;

        telemetryService.store(smoothed);

        HealthIndex health = healthCalculator.calculate(smoothed);

        wsSinks.send("telemetry/" + smoothed.getLocomotiveNumber(), smoothed);
        wsSinks.send("health/"    + smoothed.getLocomotiveNumber(), health);
        wsSinks.send("map/all",                                     buildMapPoint(smoothed));
        wsSinks.send("map/"       + smoothed.getLocomotiveNumber(), buildMapPoint(smoothed));

        if (health.getCategory() == HealthIndex.Category.CRIT) {
            wsSinks.send("alert/" + smoothed.getLocomotiveNumber(), health);
            wsSinks.send("alert/all",                               health);
            log.warn("[{}] CRIT score={} grade={}",
                    smoothed.getLocomotiveNumber(), health.getScore(), health.getGrade());
        }
    }

    private java.util.Map<String, Object> buildMapPoint(TelemetryData d) {
        return java.util.Map.of(
                "locomotiveNumber", d.getLocomotiveNumber(),
                "locomotiveName",   d.getLocomotiveName() != null ? d.getLocomotiveName() : "",
                "latitude",         d.getLatitude(),
                "longitude",        d.getLongitude(),
                "speed",            d.getSpeed(),
                "timestamp",        d.getTimestamp() != null ? d.getTimestamp().toString() : ""
        );
    }
}