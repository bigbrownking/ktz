package org.ktz.ktzgateway.repository;

import org.ktz.ktzgateway.model.Route;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface RouteRepository extends ReactiveCrudRepository<Route, Long> {
    Flux<Route> findByUserId(Long userId);
    Flux<Route> findAllByOrderByDestinationAsc();
}