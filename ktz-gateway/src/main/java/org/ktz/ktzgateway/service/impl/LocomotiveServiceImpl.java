package org.ktz.ktzgateway.service.impl;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.request.LocomotiveRequestDto;
import org.ktz.ktzgateway.dto.response.LocomotiveResponseDto;
import org.ktz.ktzgateway.model.Locomotive;
import org.ktz.ktzgateway.repository.LocomotiveRepository;
import org.ktz.ktzgateway.repository.UserRepository;
import org.ktz.ktzgateway.service.LocomotiveService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class LocomotiveServiceImpl implements LocomotiveService {

    private final LocomotiveRepository locomotiveRepository;
    private final UserRepository userRepository;

    @Override
    public Mono<LocomotiveResponseDto> create(LocomotiveRequestDto dto) {
        Locomotive loco = new Locomotive();
        loco.setName(dto.getName());
        loco.setType(dto.getType());
        loco.setNumber(dto.getNumber());
        return locomotiveRepository.save(loco)
                .flatMap(this::enrichWithUser);
    }

    @Override
    public Mono<LocomotiveResponseDto> update(Long id, LocomotiveRequestDto dto) {
        return locomotiveRepository.findById(id)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Locomotive not found")))
                .flatMap(existing -> {
                    existing.setName(dto.getName());
                    existing.setType(dto.getType());
                    existing.setNumber(dto.getNumber());
                    return locomotiveRepository.save(existing);
                })
                .flatMap(this::enrichWithUser);
    }

    @Override
    public Mono<LocomotiveResponseDto> getById(Long id) {
        return locomotiveRepository.findById(id)
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Locomotive not found")))
                .flatMap(this::enrichWithUser);
    }

    @Override
    public Mono<Void> delete(Long id) {
        return locomotiveRepository.deleteById(id);
    }

    @Override
    public Flux<LocomotiveResponseDto> getAll() {
        return locomotiveRepository.findAll()
                .flatMap(this::enrichWithUser);
    }

    private Mono<LocomotiveResponseDto> enrichWithUser(Locomotive loco) {
        return userRepository.findByLocomotiveId(loco.getId())
                .map(user -> toDto(loco, user.getUsername()))
                .defaultIfEmpty(toDto(loco, null));
    }

    private LocomotiveResponseDto toDto(Locomotive loco, String username) {
        return LocomotiveResponseDto.builder()
                .id(loco.getId())
                .name(loco.getName())
                .type(loco.getType())
                .number(loco.getNumber())
                .assignedUsername(username)
                .build();
    }
}