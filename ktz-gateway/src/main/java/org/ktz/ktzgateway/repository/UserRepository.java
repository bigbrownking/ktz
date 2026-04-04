package org.ktz.ktzgateway.repository;

import org.ktz.ktzgateway.model.User;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface UserRepository extends ReactiveCrudRepository<User, Long> {
    Mono<User> findByUsername(String username);
    Mono<User> findByLocomotiveId(Long locomotiveId);

}