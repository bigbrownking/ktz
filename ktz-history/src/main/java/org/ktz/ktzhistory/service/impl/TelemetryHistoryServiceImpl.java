package org.ktz.ktzhistory.service.impl;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzhistory.model.TelemetryRecord;
import org.ktz.ktzhistory.repository.TelemetryRepository;
import org.ktz.ktzhistory.service.TelemetryHistoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TelemetryHistoryServiceImpl implements TelemetryHistoryService {

    private final TelemetryRepository telemetryRepository;

    @Override
    public List<TelemetryRecord> getAll() {
        return telemetryRepository.findAll();
    }

    @Override
    public List<TelemetryRecord> getByLocomotiveNumber(String locomotiveNumber) {
        return telemetryRepository.findByLocomotiveNumber(locomotiveNumber);
    }

    @Override
    public void checkAccess(String role, String userLocomotiveNumber, String requestedLocomotiveNumber) {
        if ("ROLE_USER".equals(role) && !requestedLocomotiveNumber.equals(userLocomotiveNumber)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }
}