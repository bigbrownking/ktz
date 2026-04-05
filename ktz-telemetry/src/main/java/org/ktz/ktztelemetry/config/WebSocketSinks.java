package org.ktz.ktztelemetry.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSinks {

    private static final Logger log = LoggerFactory.getLogger(WebSocketSinks.class);

    // Один sink на каждый топик — создаётся лениво
    private final Map<String, Sinks.Many<Object>> sinks = new ConcurrentHashMap<>();

    public void send(String topic, Object message) {
        var result = getOrCreate(topic).tryEmitNext(message);
        if (result.isFailure()) {
            log.warn("WS sink emit failed topic={} result={}", topic, result);
        }
    }

    public Flux<Object> subscribe(String topic) {
        return getOrCreate(topic).asFlux();
    }

    private Sinks.Many<Object> getOrCreate(String topic) {
        return sinks.computeIfAbsent(topic, k ->
                Sinks.many().multicast().onBackpressureBuffer());
    }
}
