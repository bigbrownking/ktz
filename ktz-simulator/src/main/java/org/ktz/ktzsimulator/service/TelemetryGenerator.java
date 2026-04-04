package org.ktz.ktzsimulator.service;

import org.ktz.ktzsimulator.model.TelemetryData;

public interface TelemetryGenerator {
    TelemetryData generate(TelemetryData.Type type, String number, String name,
                           double startLat, double startLon,
                           double endLat, double endLon);
}