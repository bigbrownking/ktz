package org.ktz.ktzgateway.service;

import org.ktz.ktzgateway.dto.request.UserRequestDto;
import org.ktz.ktzgateway.dto.response.UserResponseDto;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.http.codec.multipart.FilePart;

public interface UserService {

    Mono<UserResponseDto> create(Mono<UserRequestDto> dto,
                                 Mono<FilePart> photo);

    Mono<UserResponseDto> update(Long id,
                                 Mono<UserRequestDto> dto,
                                 Mono<FilePart> photo);

    Mono<UserResponseDto> getById(Long id);

    Mono<Void> delete(Long id);
    Flux<UserResponseDto> getAll();
}