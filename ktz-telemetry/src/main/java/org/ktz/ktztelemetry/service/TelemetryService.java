package org.ktz.ktztelemetry.service;

import org.ktz.ktztelemetry.model.TelemetryData;
import reactor.core.publisher.Flux;

public interface TelemetryService {
    Flux<TelemetryData> getAll();
    Flux<TelemetryData> getByLocomotiveNumber(String locomotiveNumber);
    void store(TelemetryData data);
}