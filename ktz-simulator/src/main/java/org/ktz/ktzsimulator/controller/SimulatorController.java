package org.ktz.ktzsimulator.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzsimulator.service.TelemetryPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/simulator")
@RequiredArgsConstructor
public class SimulatorController {

    private final TelemetryPublisher publisher;

    @PostMapping("/start")
    public String start(@RequestHeader("X-Role") String role) {
        if (!"ROLE_ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        publisher.start();
        return "Simulator started";
    }

    @PostMapping("/stop")
    public String stop(@RequestHeader("X-Role") String role) {
        if (!"ROLE_ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        publisher.stop();
        return "Simulator stopped";
    }
}