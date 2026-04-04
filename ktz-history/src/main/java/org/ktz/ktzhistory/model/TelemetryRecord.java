package org.ktz.ktzhistory.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "telemetry")
@Getter
@Setter
public class TelemetryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TelemetryData.Type type;

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

    public static TelemetryRecord from(TelemetryData data) {
        TelemetryRecord record = new TelemetryRecord();
        record.setType(data.getType());
        record.setTimestamp(data.getTimestamp());
        record.setSpeed(data.getSpeed());
        record.setTractionForce(data.getTractionForce());
        record.setVoltage(data.getVoltage());
        record.setCurrent(data.getCurrent());
        record.setEngineRpm(data.getEngineRpm());
        record.setCoolantTemp(data.getCoolantTemp());
        record.setOilTemp(data.getOilTemp());
        record.setOilPressure(data.getOilPressure());
        record.setTurboPressure(data.getTurboPressure());
        record.setFuelLevel(data.getFuelLevel());
        record.setWaterLevel(data.getWaterLevel());
        record.setSectionVoltage(data.getSectionVoltage());
        record.setPowerRecuperation(data.getPowerRecuperation());
        return record;
    }
}