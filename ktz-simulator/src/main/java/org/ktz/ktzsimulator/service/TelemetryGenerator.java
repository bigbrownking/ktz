package org.ktz.ktzsimulator.service;

import org.ktz.ktzsimulator.model.TelemetryData;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;

public interface TelemetryGenerator {
    TelemetryData generate(TelemetryData.Type type, String number, String name);
}