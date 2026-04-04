package org.ktz.ktzgateway.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.request.LocomotiveRequestDto;
import org.ktz.ktzgateway.dto.response.LocomotiveResponseDto;
import org.ktz.ktzgateway.service.LocomotiveService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/locomotive")
@RequiredArgsConstructor
public class LocomotiveController {

    private final LocomotiveService locomotiveService;

    @PostMapping
    public Mono<LocomotiveResponseDto> create(@RequestBody LocomotiveRequestDto dto) {
        return locomotiveService.create(dto);
    }

    @GetMapping
    public Flux<LocomotiveResponseDto> getAll() {
        return locomotiveService.getAll();
    }

    @GetMapping("/{id}")
    public Mono<LocomotiveResponseDto> getById(@PathVariable Long id) {
        return locomotiveService.getById(id);
    }

    @PutMapping("/{id}")
    public Mono<LocomotiveResponseDto> update(
            @PathVariable Long id,
            @RequestBody LocomotiveRequestDto dto) {
        return locomotiveService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> delete(@PathVariable Long id) {
        return locomotiveService.delete(id);
    }
}