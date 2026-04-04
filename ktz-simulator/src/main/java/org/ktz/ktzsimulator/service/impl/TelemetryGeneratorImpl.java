package org.ktz.ktzsimulator.service.impl;

import org.ktz.ktzsimulator.model.TelemetryData;
import org.ktz.ktzsimulator.service.TelemetryGenerator;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;

@Service
public class TelemetryGeneratorImpl implements TelemetryGenerator {
    private final Random rand = new Random();

    @Override
    public TelemetryData generate(TelemetryData.Type type, String number,
                                  String name, double startLat, double startLon,
                                  double endLat, double endLon) {
        TelemetryData t = new TelemetryData();
        t.setType(type);
        t.setLocomotiveNumber(number);
        t.setLocomotiveName(name);
        t.setTimestamp(Instant.now());

        double progress = rand.nextDouble();
        t.setLatitude(startLat + (endLat - startLat) * progress);
        t.setLongitude(startLon + (endLon - startLon) * progress);

        if (type == TelemetryData.Type.TE33A) {
            t.setEngineRpm(900 + rand.nextDouble() * 10);
            t.setCoolantTemp(85 + rand.nextDouble() * 5);
            t.setOilTemp(100 + rand.nextDouble() * 7);
            t.setOilPressure(4 + rand.nextDouble() * 1.5);
            t.setTurboPressure(1.2 + rand.nextDouble() * 0.3);
            t.setFuelLevel(1000 + rand.nextDouble() * 4000);
            t.setWaterLevel(4000 + rand.nextDouble() * 1000);
            t.setSpeed(rand.nextDouble() * 120);
            t.setTractionForce(350 + rand.nextDouble() * 40);
            t.setVoltage(0);
            t.setCurrent(0);
        } else {
            t.setSpeed(rand.nextDouble() * 120);
            t.setTractionForce(800 + rand.nextDouble() * 30);
            t.setVoltage(25);
            t.setCurrent(1000 + rand.nextDouble() * 500);
            t.setSectionVoltage(25);
            t.setPowerRecuperation(rand.nextDouble() * 2000);
        }
        return t;
    }
}
