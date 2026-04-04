package org.ktz.ktzgateway.repository;

import org.ktz.ktzgateway.model.Locomotive;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LocomotiveRepository extends ReactiveCrudRepository<Locomotive, Long> {}
