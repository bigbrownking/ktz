package org.ktz.ktzgateway.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.request.RouteRequestDto;
import org.ktz.ktzgateway.dto.response.RouteResponseDto;
import org.ktz.ktzgateway.service.RouteService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/route")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @PostMapping
    public Mono<RouteResponseDto> create(@RequestBody RouteRequestDto dto) {
        return routeService.create(dto);
    }

    @GetMapping
    public Flux<RouteResponseDto> getAll(
            @RequestParam(required = false, defaultValue = "false") boolean sortByDestination) {
        if (sortByDestination) {
            return routeService.getAllSortedByDestination();
        }
        return routeService.getAll();
    }

    @GetMapping("/{id}")
    public Mono<RouteResponseDto> getById(@PathVariable Long id) {
        return routeService.getById(id);
    }

    @GetMapping("/user/{userId}")
    public Flux<RouteResponseDto> getByUser(@PathVariable Long userId) {
        return routeService.getByUserId(userId);
    }

    @PutMapping("/{id}")
    public Mono<RouteResponseDto> update(
            @PathVariable Long id,
            @RequestBody RouteRequestDto dto) {
        return routeService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> delete(@PathVariable Long id) {
        return routeService.delete(id);
    }
}