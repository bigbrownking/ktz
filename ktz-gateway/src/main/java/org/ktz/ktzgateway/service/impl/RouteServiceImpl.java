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
        return routeRepository.save(route).flatMap(this::enrich);
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
        return routeRepository.findAll().flatMap(this::enrich);
    }

    @Override
    public Flux<RouteResponseDto> getAllSortedByDestination() {
        return routeRepository.findAllByOrderByDestinationAsc().flatMap(this::enrich);
    }

    @Override
    public Flux<RouteResponseDto> getByUserId(Long userId) {
        return routeRepository.findByUserId(userId).flatMap(this::enrich);
    }

    private Mono<RouteResponseDto> enrich(Route route) {
        Mono<User> userMono = route.getUserId() != null
                ? userRepository.findById(route.getUserId()).defaultIfEmpty(new User())
                : Mono.just(new User());

        Mono<Locomotive> locoMono = route.getLocomotiveId() != null
                ? locomotiveRepository.findById(route.getLocomotiveId()).defaultIfEmpty(new Locomotive())
                : Mono.just(new Locomotive());

        return Mono.zip(userMono, locoMono)
                .map(tuple -> {
                    User u = tuple.getT1();
                    Locomotive l = tuple.getT2();
                    return RouteResponseDto.builder()
                            .id(route.getId())
                            .origin(route.getOrigin())
                            .destination(route.getDestination())
                            .status(route.getStatus())
                            .userId(route.getUserId())
                            .username(u.getUsername())
                            .locomotiveId(route.getLocomotiveId())
                            .locomotiveName(l.getName())
                            .locomotiveNumber(l.getNumber())
                            .stations(route.getStations())
                            .distanceKm(route.getDistanceKm())
                            .estimatedMinutes(route.getEstimatedMinutes())
                            .startLat(route.getStartLat())
                            .startLon(route.getStartLon())
                            .endLat(route.getEndLat())
                            .endLon(route.getEndLon())
                            .driverName(u.getName())
                            .driverSurname(u.getSurname())
                            .driverAge(u.getAge())
                            .driverPhotoUrl(u.getPhotoUrl())
                            .build();
                });
    }
}
