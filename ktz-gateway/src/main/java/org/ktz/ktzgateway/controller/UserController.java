package org.ktz.ktzgateway.controller;


import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.request.UserRequestDto;
import org.ktz.ktzgateway.dto.response.UserResponseDto;
import org.ktz.ktzgateway.service.UserService;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping(value = "/create", consumes = "multipart/form-data")
    public Mono<UserResponseDto> create(
            @RequestPart("data") Mono<UserRequestDto> dto,
            @RequestPart(value = "photo", required = false) Mono<FilePart> photo
    ) {
        return userService.create(dto, photo);
    }

    @GetMapping("/{id}")
    public Mono<UserResponseDto> getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    @PutMapping(value = "/{id}", consumes = "multipart/form-data")
    public Mono<UserResponseDto> update(
            @PathVariable Long id,
            @RequestPart("data") Mono<UserRequestDto> dto,
            @RequestPart(value = "photo", required = false) Mono<FilePart> photo
    ) {
        return userService.update(id, dto, photo);
    }

    @DeleteMapping("/{id}")
    public Mono<Void> delete(@PathVariable Long id) {
        return userService.delete(id);
    }

    @GetMapping
    public Flux<UserResponseDto> getAll() {
        return userService.getAll();
    }
}