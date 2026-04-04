package org.ktz.ktzhistory.service;

import org.ktz.ktzhistory.model.TelemetryRecord;

import java.util.List;

public interface TelemetryHistoryService {
    List<TelemetryRecord> getAll();
    List<TelemetryRecord> getByLocomotiveNumber(String locomotiveNumber);
    void checkAccess(String role, String userLocomotiveNumber, String requestedLocomotiveNumber);
}