package org.ktz.ktzgateway.service.impl;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.request.RouteRequestDto;
import org.ktz.ktzgateway.dto.response.RouteResponseDto;
import org.ktz.ktzgateway.model.Route;
import org.ktz.ktzgateway.repository.RouteRepository;
import org.ktz.ktzgateway.repository.UserRepository;
import org.ktz.ktzgateway.service.RouteService;
import org.ktz.ktzgateway.util.Mapper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final UserRepository userRepository;
    private final Mapper mapper;

    @Override
    public Mono<RouteResponseDto> create(RouteRequestDto dto) {
        Route route = mapper.mapToEntity(dto);
        return routeRepository.save(route)
                .flatMap(this::enrichWithUsername);
    }

    @Override
    public Mono<RouteResponseDto> update(Long id, RouteRequestDto dto) {
        return routeRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Route not found")))
                .flatMap(existing -> {
                    mapper.updateEntity(existing, dto);
                    return routeRepository.save(existing);
                })
                .flatMap(this::enrichWithUsername);
    }

    @Override
    public Mono<RouteResponseDto> getById(Long id) {
        return routeRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Route not found")))
                .flatMap(this::enrichWithUsername);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return routeRepository.deleteById(id);
    }

    @Override
    public Flux<RouteResponseDto> getAll() {
        return routeRepository.findAll()
                .flatMap(this::enrichWithUsername);
    }

    @Override
    public Flux<RouteResponseDto> getAllSortedByDestination() {
        return routeRepository.findAllByOrderByDestinationAsc()
                .flatMap(this::enrichWithUsername);
    }

    @Override
    public Flux<RouteResponseDto> getByUserId(Long userId) {
        return routeRepository.findByUserId(userId)
                .flatMap(this::enrichWithUsername);
    }

    private Mono<RouteResponseDto> enrichWithUsername(Route route) {
        if (route.getUserId() == null) {
            return Mono.just(mapper.mapToDto(route, null));
        }
        return userRepository.findById(route.getUserId())
                .map(user -> mapper.mapToDto(route, user.getUsername()))
                .defaultIfEmpty(mapper.mapToDto(route, null));
    }
}