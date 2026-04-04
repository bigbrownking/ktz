package org.ktz.ktztelemetry.health;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
@Builder
public class HealthIndex {

    private String locomotiveNumber;
    private Instant calculatedAt;

    private double score;
    private String grade;
    private Category category;
    private String categoryLabel;

    private List<HealthFactor> topFactors;

    private List<HealthFactor> allFactors;

    private List<String> recommendations;

    public enum Category { NORM, WARN, CRIT }

    @Data
    @Builder
    public static class HealthFactor {
        private String paramName;
        private String label;
        private double rawValue;
        private double penalty;
        private double weight;
        private double contribution;
        private String status;
        private String description;
    }
}
