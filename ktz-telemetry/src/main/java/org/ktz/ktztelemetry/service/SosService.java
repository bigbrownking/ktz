package org.ktz.ktztelemetry.service;

import org.ktz.ktztelemetry.dto.SosRequest;
import reactor.core.publisher.Mono;

public interface SosService {
    Mono<Void> sendSos(SosRequest request);
}