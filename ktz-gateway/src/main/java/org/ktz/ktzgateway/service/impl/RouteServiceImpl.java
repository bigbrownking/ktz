package org.ktz.ktzgateway.service.impl;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.request.RouteRequestDto;
import org.ktz.ktzgateway.dto.response.RouteResponseDto;
import org.ktz.ktzgateway.model.Locomotive;
import org.ktz.ktzgateway.model.Route;
import org.ktz.ktzgateway.model.User;
import org.ktz.ktzgateway.repository.LocomotiveRepository;
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
    private final LocomotiveRepository locomotiveRepository;
    private final Mapper mapper;

    @Override
    public Mono<RouteResponseDto> create(RouteRequestDto dto) {
        Route route = mapper.mapToEntity(dto);
        return routeRepository.save(route)
                .flatMap(this::enrich);
    }

    @Override
    public Mono<RouteResponseDto> update(Long id, RouteRequestDto dto) {
        return routeRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Route not found")))
                .flatMap(existing -> {
                    mapper.updateEntity(existing, dto);
                    return routeRepository.save(existing);
                })
                .flatMap(this::enrich);
    }

    @Override
    public Mono<RouteResponseDto> getById(Long id) {
        return routeRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("Route not found")))
                .flatMap(this::enrich);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return routeRepository.deleteById(id);
    }

    @Override
    public Flux<RouteResponseDto> getAll() {
        return routeRepository.findAll()
                .flatMap(this::enrich);
    }

    @Override
    public Flux<RouteResponseDto> getAllSortedByDestination() {
        return routeRepository.findAllByOrderByDestinationAsc()
                .flatMap(this::enrich);
    }

    @Override
    public Flux<RouteResponseDto> getByUserId(Long userId) {
        return routeRepository.findByUserId(userId)
                .flatMap(this::enrich);
    }

    private Mono<RouteResponseDto> enrich(Route route) {
        Mono<String> usernameMono = route.getUserId() != null
                ? userRepository.findById(route.getUserId())
                .map(User::getUsername).defaultIfEmpty("")
                : Mono.just("");

        Mono<Locomotive> locoMono = route.getLocomotiveId() != null
                ? locomotiveRepository.findById(route.getLocomotiveId())
                .defaultIfEmpty(new Locomotive())
                : Mono.just(new Locomotive());

        return Mono.zip(usernameMono, locoMono)
                .map(tuple -> RouteResponseDto.builder()
                        .id(route.getId())
                        .origin(route.getOrigin())
                        .destination(route.getDestination())
                        .status(route.getStatus())
                        .userId(route.getUserId())
                        .username(tuple.getT1())
                        .locomotiveId(route.getLocomotiveId())
                        .locomotiveName(tuple.getT2().getName())
                        .locomotiveNumber(tuple.getT2().getNumber())
                        .build());
    }
}