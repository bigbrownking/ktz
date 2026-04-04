package org.ktz.ktztelemetry.health;

import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class EmaBuffer {

    private static final double ALPHA       = 0.2;
    private static final int    BUFFER_SIZE = 60;

    private final ConcurrentHashMap<String, LocoState> states = new ConcurrentHashMap<>();

    public TelemetryData apply(TelemetryData raw) {
        if (raw == null || raw.getLocomotiveNumber() == null) return null;

        LocoState state = states.computeIfAbsent(
                raw.getLocomotiveNumber(), k -> new LocoState());

        if (state.lastTimestamp != null &&
                raw.getTimestamp() != null &&
                !raw.getTimestamp().isAfter(state.lastTimestamp)) {
            return null;
        }
        if (raw.getTimestamp() != null) {
            state.lastTimestamp = raw.getTimestamp();
        }

        TelemetryData smoothed = new TelemetryData();
        smoothed.setLocomotiveNumber(raw.getLocomotiveNumber());
        smoothed.setLocomotiveName(raw.getLocomotiveName());
        smoothed.setType(raw.getType());
        smoothed.setTimestamp(raw.getTimestamp());
        smoothed.setLatitude(raw.getLatitude());
        smoothed.setLongitude(raw.getLongitude());

        smoothed.setSpeed(           state.ema("speed",          raw.getSpeed()));
        smoothed.setCoolantTemp(     state.ema("coolantTemp",     raw.getCoolantTemp()));
        smoothed.setOilTemp(         state.ema("oilTemp",         raw.getOilTemp()));
        smoothed.setOilPressure(     state.ema("oilPressure",     raw.getOilPressure()));
        smoothed.setTurboPressure(   state.ema("turboPressure",   raw.getTurboPressure()));
        smoothed.setFuelLevel(       state.ema("fuelLevel",       raw.getFuelLevel()));
        smoothed.setWaterLevel(      state.ema("waterLevel",      raw.getWaterLevel()));
        smoothed.setVoltage(         state.ema("voltage",         raw.getVoltage()));
        smoothed.setCurrent(         state.ema("current",         raw.getCurrent()));
        smoothed.setTractionForce(   state.ema("tractionForce",   raw.getTractionForce()));
        smoothed.setEngineRpm(       state.ema("engineRpm",       raw.getEngineRpm()));
        smoothed.setSectionVoltage(  state.ema("sectionVoltage",  raw.getSectionVoltage()));
        smoothed.setPowerRecuperation(state.ema("powerRecup",     raw.getPowerRecuperation()));

        state.buffer.addLast(smoothed);
        if (state.buffer.size() > BUFFER_SIZE) {
            state.buffer.pollFirst();
        }

        return smoothed;
    }

    /**
     * Возвращает буфер последних сглаженных значений для локомотива.
     */
    public Deque<TelemetryData> getBuffer(String locomotiveNumber) {
        LocoState state = states.get(locomotiveNumber);
        return state != null ? new ArrayDeque<>(state.buffer) : new ArrayDeque<>();
    }

    /**
     * Сбрасывает состояние EMA для локомотива.
     */
    public void reset(String locomotiveNumber) {
        states.remove(locomotiveNumber);
    }

    public int stateSize() {
        return states.size();
    }

    // ── Внутреннее состояние на локомотив ─────────────────────────

    private static class LocoState {
        Instant lastTimestamp = null;
        final ConcurrentHashMap<String, Double> emaValues = new ConcurrentHashMap<>();
        final Deque<TelemetryData> buffer = new ArrayDeque<>();

        double ema(String param, double newValue) {
            return emaValues.compute(param, (k, prev) -> {
                if (prev == null) return newValue;
                double result = ALPHA * newValue + (1 - ALPHA) * prev;
                return Math.round(result * 100.0) / 100.0;
            });
        }
    }
}