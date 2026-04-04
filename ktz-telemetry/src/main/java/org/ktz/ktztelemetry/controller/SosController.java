package org.ktz.ktztelemetry.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktztelemetry.dto.SosRequest;
import org.ktz.ktztelemetry.service.SosService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/telemetry/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosService sosService;

    @PostMapping
    public Mono<Void> sendSos(@RequestBody SosRequest request) {
        return sosService.sendSos(request);
    }
}