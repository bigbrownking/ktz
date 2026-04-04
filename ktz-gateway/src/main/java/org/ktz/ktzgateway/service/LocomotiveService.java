package org.ktz.ktzgateway.service;

import org.ktz.ktzgateway.dto.request.LocomotiveRequestDto;
import org.ktz.ktzgateway.dto.response.LocomotiveResponseDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface LocomotiveService {
    Mono<LocomotiveResponseDto> create(LocomotiveRequestDto dto);
    Mono<LocomotiveResponseDto> update(Long id, LocomotiveRequestDto dto);
    Mono<LocomotiveResponseDto> getById(Long id);
    Mono<Void> delete(Long id);
    Flux<LocomotiveResponseDto> getAll();
}