package org.ktz.ktztelemetry.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktztelemetry.dto.AlertRequest;
import org.ktz.ktztelemetry.service.AlertService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/telemetry/alert")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @PostMapping("/send")
    public Mono<Void> send(
            @RequestHeader("X-Role") String role,
            @RequestBody AlertRequest request) {

        if (!"ROLE_ADMIN".equals(role)) {
            return Mono.error(new org.springframework.web.server
                    .ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN));
        }
        return alertService.sendAlert(request);
    }

    @PostMapping("/broadcast")
    public Mono<Void> broadcast(
            @RequestHeader("X-Role") String role,
            @RequestBody AlertRequest request) {

        if (!"ROLE_ADMIN".equals(role)) {
            return Mono.error(new org.springframework.web.server
                    .ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN));
        }
        return alertService.sendToAll(request);
    }
}