package org.ktz.ktzgateway.service.impl;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.request.UserRequestDto;
import org.ktz.ktzgateway.dto.response.UserResponseDto;
import org.ktz.ktzgateway.model.User;
import org.ktz.ktzgateway.repository.UserRepository;
import org.ktz.ktzgateway.service.MinioService;
import org.ktz.ktzgateway.service.UserService;
import org.ktz.ktzgateway.util.Mapper;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final MinioService minioService;
    private final PasswordEncoder passwordEncoder;
    private final Mapper mapper;

    @Override
    public Mono<UserResponseDto> create(Mono<UserRequestDto> dtoMono,
                                        Mono<FilePart> photoMono) {
        return dtoMono.flatMap(dto ->
                photoMono
                        .flatMap(file -> minioService.upload(file, "users/" + dto.getUsername()))
                        .defaultIfEmpty("")
                        .flatMap(photoUrl -> {
                            User user = mapper.mapToEntity(dto);
                            user.setPassword(passwordEncoder.encode(dto.getPassword()));
                            user.setPhotoUrl(photoUrl.isEmpty() ? null : photoUrl);
                            return userRepository.save(user)
                                    .map(saved -> mapper.mapToDto(saved, photoUrl));
                        })
        );
    }

    @Override
    public Mono<UserResponseDto> update(Long id,
                                        Mono<UserRequestDto> dtoMono,
                                        Mono<FilePart> photoMono) {
        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .flatMap(existing ->
                        dtoMono.flatMap(dto ->
                                photoMono
                                        .flatMap(file -> minioService.upload(file, "users/" + id))
                                        .defaultIfEmpty(existing.getPhotoUrl() != null ? existing.getPhotoUrl() : "")
                                        .flatMap(photoUrl -> {
                                            mapper.updateEntity(existing, dto);
                                            if (!dto.getPassword().isBlank()) {
                                                existing.setPassword(passwordEncoder.encode(dto.getPassword()));
                                            }
                                            existing.setPhotoUrl(photoUrl.isEmpty() ? null : photoUrl);
                                            return userRepository.save(existing)
                                                    .map(updated -> mapper.mapToDto(updated, photoUrl));
                                        })
                        )
                );
    }

    @Override
    public Mono<UserResponseDto> getById(Long id) {
        return userRepository.findById(id)
                .switchIfEmpty(Mono.error(new RuntimeException("User not found")))
                .map(user -> mapper.mapToDto(user, user.getPhotoUrl()));
    }

    @Override
    public Mono<Void> delete(Long id) {
        return userRepository.deleteById(id);
    }
    @Override
    public Flux<UserResponseDto> getAll() {
        return userRepository.findAll()
                .map(user -> mapper.mapToDto(user, user.getPhotoUrl()));
    }

}