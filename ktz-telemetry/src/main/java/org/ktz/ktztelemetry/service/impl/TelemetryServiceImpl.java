package org.ktz.ktztelemetry.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.model.TelemetryData;
import org.ktz.ktztelemetry.service.TelemetryService;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelemetryServiceImpl implements TelemetryService {

    private static final String KEY_PREFIX = "telemetry:latest:";
    private static final Duration TTL      = Duration.ofMinutes(5);

    private final ReactiveRedisTemplate<String, TelemetryData> redisTemplate;

    private final Sinks.Many<TelemetryData> sink = Sinks.many()
            .multicast()
            .onBackpressureBuffer();

    @Override
    public void store(TelemetryData data) {
        redisTemplate.opsForValue()
                .set(KEY_PREFIX + data.getLocomotiveNumber(), data, TTL)
                .doOnError(e -> log.error("Redis write error: {}", e.getMessage()))
                .subscribe();

        sink.tryEmitNext(data);
        log.debug("Stored telemetry for {}", data.getLocomotiveNumber());
    }

    @Override
    public Flux<TelemetryData> getAll() {
        Flux<TelemetryData> current = redisTemplate.keys(KEY_PREFIX + "*")
                .flatMap(key -> redisTemplate.opsForValue().get(key));

        Flux<TelemetryData> live = sink.asFlux();

        return Flux.concat(current, live);
    }

    @Override
    public Flux<TelemetryData> getByLocomotiveNumber(String locomotiveNumber) {
        Flux<TelemetryData> current = redisTemplate.opsForValue()
                .get(KEY_PREFIX + locomotiveNumber)
                .flux();

        Flux<TelemetryData> live = sink.asFlux()
                .filter(d -> locomotiveNumber.equals(d.getLocomotiveNumber()));

        return Flux.concat(current, live);
    }
}