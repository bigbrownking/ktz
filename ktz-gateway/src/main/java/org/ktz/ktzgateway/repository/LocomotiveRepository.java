package org.ktz.ktzgateway.repository;

import org.ktz.ktzgateway.model.Locomotive;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface LocomotiveRepository extends ReactiveCrudRepository<Locomotive, Long> {
    Mono<Locomotive> findByNumber(String number);
}