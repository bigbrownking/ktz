package org.ktz.ktzsimulator.model;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class TelemetryData {
    public enum Type { TE33A, KZ8A }

    private Type type;
    private Instant timestamp;

    private double speed;
    private double tractionForce;
    private double voltage;
    private double current;

    // TE33A
    private double engineRpm;
    private double coolantTemp;
    private double oilTemp;
    private double oilPressure;
    private double turboPressure;
    private double fuelLevel;
    private double waterLevel;

    // KZ8A
    private double sectionVoltage;
    private double powerRecuperation;
}