package org.ktz.ktzgateway.service;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.dto.AuthResponse;
import org.ktz.ktzgateway.dto.LoginRequest;
import org.ktz.ktzgateway.dto.RefreshRequest;
import org.ktz.ktzgateway.repository.LocomotiveRepository;
import org.ktz.ktzgateway.repository.UserRepository;
import org.ktz.ktzgateway.security.JwtTokenUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;


public interface AuthService {
    Mono<AuthResponse> login(LoginRequest request);
    Mono<AuthResponse> refresh(RefreshRequest request);
}