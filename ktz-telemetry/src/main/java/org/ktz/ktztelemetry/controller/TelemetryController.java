package org.ktz.ktztelemetry.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktztelemetry.model.TelemetryData;
import org.ktz.ktztelemetry.service.TelemetryService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/telemetry")
@RequiredArgsConstructor
public class TelemetryController {

    private final TelemetryService telemetryService;

    @GetMapping("/current")
    public Flux<TelemetryData> getCurrent(
            @RequestHeader("X-Role") String role,
            @RequestHeader(value = "X-Locomotive-Number", required = false) String locomotiveNumber) {

        if ("ROLE_ADMIN".equals(role)) {
            return telemetryService.getAll();
        }
        return telemetryService.getByLocomotiveNumber(locomotiveNumber);
    }
}