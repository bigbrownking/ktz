package org.ktz.ktzgateway.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.AuthResponse;
import org.ktz.ktzgateway.dto.LoginRequest;
import org.ktz.ktzgateway.dto.RefreshRequest;
import org.ktz.ktzgateway.service.AuthService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public Mono<AuthResponse> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public Mono<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

}