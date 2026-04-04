package org.ktz.ktzgateway.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzgateway.dto.AuthResponse;
import org.ktz.ktzgateway.dto.LoginRequest;
import org.ktz.ktzgateway.dto.RefreshRequest;
import org.ktz.ktzgateway.repository.LocomotiveRepository;
import org.ktz.ktzgateway.repository.UserRepository;
import org.ktz.ktzgateway.security.JwtTokenUtil;
import org.ktz.ktzgateway.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final LocomotiveRepository locomotiveRepository;
    private final JwtTokenUtil jwtTokenUtil;
    private final PasswordEncoder passwordEncoder;

    public Mono<AuthResponse> login(LoginRequest request) {
        return userRepository.findByUsername(request.getUsername())
                .filter(user -> passwordEncoder.matches(request.getPassword(), user.getPassword()))
                .flatMap(user -> {
                    if (user.getLocomotiveId() == null) {
                        return Mono.just(AuthResponse.builder()
                                .token(jwtTokenUtil.generateToken(
                                        user.getUsername(), user.getRole(), null, null))
                                .refreshToken(jwtTokenUtil.generateRefreshToken(user.getUsername()))
                                .role(user.getRole())
                                .build());
                    }
                    return locomotiveRepository.findById(user.getLocomotiveId())
                            .map(loco -> AuthResponse.builder()
                                    .token(jwtTokenUtil.generateToken(
                                            user.getUsername(), user.getRole(),
                                            loco.getNumber(), loco.getName()))
                                    .refreshToken(jwtTokenUtil.generateRefreshToken(user.getUsername()))
                                    .locomotiveName(loco.getName())
                                    .locomotiveNumber(loco.getNumber())
                                    .role(user.getRole())
                                    .build());
                })
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")));
    }

    public Mono<AuthResponse> refresh(RefreshRequest request) {
        if (!jwtTokenUtil.validateRefreshToken(request.getRefreshToken())) {
            return Mono.error(
                    new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));
        }

        String username = jwtTokenUtil.getUsernameFromToken(request.getRefreshToken());

        return userRepository.findByUsername(username)
                .flatMap(user -> {
                    if (user.getLocomotiveId() == null) {
                        return Mono.just(AuthResponse.builder()
                                .token(jwtTokenUtil.generateToken(
                                        user.getUsername(), user.getRole(), null, null))
                                .role(user.getRole())
                                .build());
                    }
                    return locomotiveRepository.findById(user.getLocomotiveId())
                            .map(loco -> AuthResponse.builder()
                                    .token(jwtTokenUtil.generateToken(
                                            user.getUsername(), user.getRole(),
                                            loco.getNumber(), loco.getName()))
                                    .locomotiveName(loco.getName())
                                    .locomotiveNumber(loco.getNumber())
                                    .role(user.getRole())
                                    .build());
                })
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }
}
