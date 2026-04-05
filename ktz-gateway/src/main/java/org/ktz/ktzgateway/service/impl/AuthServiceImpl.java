package org.ktz.ktzgateway.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzgateway.dto.AuthResponse;
import org.ktz.ktzgateway.dto.LoginRequest;
import org.ktz.ktzgateway.dto.RefreshRequest;
import org.ktz.ktzgateway.model.Locomotive;
import org.ktz.ktzgateway.model.User;
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
                .flatMap(user -> buildResponse(user, true))
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
                .flatMap(user -> buildResponse(user, true))
                .switchIfEmpty(Mono.error(
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found")));
    }

    private Mono<AuthResponse> buildResponse(User user, boolean includeRefresh) {
        Mono<Locomotive> locoMono = user.getLocomotiveId() != null
                ? locomotiveRepository.findById(user.getLocomotiveId()).defaultIfEmpty(new Locomotive())
                : Mono.just(new Locomotive());

        return locoMono.map(loco -> {
            String token = jwtTokenUtil.generateToken(
                    user.getUsername(), user.getRole(), loco.getNumber(), loco.getName());
            AuthResponse.AuthResponseBuilder b = AuthResponse.builder()
                    .token(token)
                    .role(user.getRole())
                    .userId(user.getId())
                    .username(user.getUsername())
                    .name(user.getName())
                    .surname(user.getSurname())
                    .photoUrl(user.getPhotoUrl())
                    .age(user.getAge())
                    .locomotiveName(loco.getName())
                    .locomotiveNumber(loco.getNumber());
            if (includeRefresh) {
                b.refreshToken(jwtTokenUtil.generateRefreshToken(user.getUsername()));
            }
            return b.build();
        });
    }
}
