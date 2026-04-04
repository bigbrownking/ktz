package org.ktz.ktzsimulator.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "telemetry")
@Getter
@Setter
public class LocomotiveProperties {
    private int frequencyHz;
    private List<LocomotiveConfig> locomotives;

    @Getter
    @Setter
    public static class LocomotiveConfig {
        private String number;
        private TelemetryData.Type type;
        private String name;
    }
}
