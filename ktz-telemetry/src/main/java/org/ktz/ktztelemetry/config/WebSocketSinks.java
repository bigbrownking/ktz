package org.ktz.ktztelemetry.config;

import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Sinks;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSinks {

    // Один sink на каждый топик — создаётся лениво
    private final Map<String, Sinks.Many<Object>> sinks = new ConcurrentHashMap<>();

    public void send(String topic, Object message) {
        getOrCreate(topic).tryEmitNext(message);
    }

    public Flux<Object> subscribe(String topic) {
        return getOrCreate(topic).asFlux();
    }

    private Sinks.Many<Object> getOrCreate(String topic) {
        return sinks.computeIfAbsent(topic, k ->
                Sinks.many().multicast().onBackpressureBuffer());
    }
}
