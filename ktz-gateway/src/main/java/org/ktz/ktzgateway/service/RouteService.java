package org.ktz.ktzgateway.service;

import org.ktz.ktzgateway.dto.request.RouteRequestDto;
import org.ktz.ktzgateway.dto.response.RouteResponseDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface RouteService {
    Mono<RouteResponseDto> create(RouteRequestDto dto);
    Mono<RouteResponseDto> update(Long id, RouteRequestDto dto);
    Mono<RouteResponseDto> getById(Long id);
    Mono<Void> delete(Long id);
    Flux<RouteResponseDto> getAll();
    Flux<RouteResponseDto> getAllSortedByDestination();
    Flux<RouteResponseDto> getByUserId(Long userId);
}