package org.ktz.ktztelemetry.service;

import org.ktz.ktztelemetry.dto.AlertRequest;
import reactor.core.publisher.Mono;

public interface AlertService {
    Mono<Void> sendAlert(AlertRequest request);
    Mono<Void> sendToAll(AlertRequest request);
}