package org.ktz.ktzhistory.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzhistory.model.TelemetryRecord;
import org.ktz.ktzhistory.service.TelemetryHistoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/history")
@RequiredArgsConstructor
public class TelemetryHistoryController {

    private final TelemetryHistoryService telemetryHistoryService;

    @GetMapping("/telemetry")
    public List<TelemetryRecord> getHistory(
            @RequestHeader("X-Role") String role,
            @RequestHeader(value = "X-Locomotive-Number", required = false) String locomotiveNumber) {

        if ("ROLE_ADMIN".equals(role)) {
            return telemetryHistoryService.getAll();
        }
        return telemetryHistoryService.getByLocomotiveNumber(locomotiveNumber);
    }

    @GetMapping("/telemetry/{locomotiveNumber}")
    public List<TelemetryRecord> getByLocomotive(
            @PathVariable String locomotiveNumber,
            @RequestHeader("X-Role") String role,
            @RequestHeader(value = "X-Locomotive-Number", required = false) String userLocomotiveNumber) {

        telemetryHistoryService.checkAccess(role, userLocomotiveNumber, locomotiveNumber);
        return telemetryHistoryService.getByLocomotiveNumber(locomotiveNumber);
    }
}