package org.ktz.ktztelemetry.health;

import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class HealthIndexCalculator {

    private static final double[] COOLANT_TEMP    = { 70, 100,  60, 115 };
    private static final double[] OIL_PRESSURE    = {  3,   7,   2,   8 };
    private static final double[] FUEL_LEVEL      = { 15, 100,   5, 100 };
    private static final double[] SPEED           = {  0, 100,   0, 120 };
    private static final double[] VOLTAGE         = {300, 750, 250, 800 };
    private static final double[] CURRENT         = {  0, 1200,  0, 1500};
    private static final double[] OIL_TEMP        = { 60, 100,  50, 115 };
    private static final double[] TURBO_PRESSURE  = {0.8,  2.5, 0.5, 3.0};
    private static final double[] WATER_LEVEL     = { 50, 100,  20, 100 };

    public HealthIndex calculate(TelemetryData data) {
        List<HealthIndex.HealthFactor> factors = new ArrayList<>();

        factors.add(evalTemp    ("coolantTemp",   "Темп. охл. жидкости", data.getCoolantTemp(),   COOLANT_TEMP,   20));
        factors.add(evalPressure("oilPressure",   "Давление масла",      data.getOilPressure(),   OIL_PRESSURE,   18));
        factors.add(evalFuel    ("fuelLevel",     "Уровень топлива",     data.getFuelLevel(),     FUEL_LEVEL,     12));
        factors.add(evalSpeed   ("speed",         "Скорость",            data.getSpeed(),         SPEED,          10));
        factors.add(evalVoltage ("voltage",       "Напряжение ТЭД",      data.getVoltage(),       VOLTAGE,        10));
        factors.add(evalCurrent ("current",       "Ток ТЭД",             data.getCurrent(),       CURRENT,         8));
        factors.add(evalTemp    ("oilTemp",       "Температура масла",   data.getOilTemp(),       OIL_TEMP,        8));
        factors.add(evalPressure("turboPressure", "Давление турбины",    data.getTurboPressure(), TURBO_PRESSURE,  7));
        factors.add(evalFuel    ("waterLevel",    "Уровень воды",        data.getWaterLevel(),    WATER_LEVEL,     7));

        double totalPenalty = factors.stream()
                .mapToDouble(HealthIndex.HealthFactor::getContribution)
                .sum();

        double score = Math.max(0, Math.min(100, 100 - totalPenalty));

        List<HealthIndex.HealthFactor> sorted = factors.stream()
                .sorted(Comparator.comparingDouble(HealthIndex.HealthFactor::getContribution).reversed())
                .toList();

        return HealthIndex.builder()
                .locomotiveNumber(data.getLocomotiveNumber())
                .calculatedAt(Instant.now())
                .score(round(score))
                .grade(toGrade(score))
                .category(toCategory(score))
                .categoryLabel(toCategoryLabel(score))
                .topFactors(sorted.stream().limit(5).toList())
                .allFactors(sorted)
                .recommendations(buildRecommendations(sorted))
                .build();
    }
    private HealthIndex.HealthFactor evalTemp(String param, String label,
                                              double value, double[] r, double weight) {
        double penalty = 0;
        String status  = "OK";
        String desc    = label + ": " + round(value) + " (норма)";

        if (value > r[3]) {
            penalty = 100;
            status  = "CRIT";
            desc    = label + " КРИТИЧНО: " + round(value) + " (макс " + r[3] + ")";
        } else if (value > r[1]) {
            penalty = normalize(value, r[1], r[3]) * 100;
            status  = "WARN";
            desc    = label + " повышена: " + round(value) + " (норма ≤ " + r[1] + ")";
        } else if (value < r[0] && value > 0) {
            penalty = normalize(r[0] - value, 0, r[0] - r[2]) * 30;
            status  = "WARN";
            desc    = label + " низкая: " + round(value);
        }
        return factor(param, label, value, penalty, weight, status, desc);
    }

    private HealthIndex.HealthFactor evalPressure(String param, String label,
                                                  double value, double[] r, double weight) {
        double penalty = 0;
        String status  = "OK";
        String desc    = label + ": " + round(value) + " (норма)";

        if (value < r[2]) {
            penalty = 100;
            status  = "CRIT";
            desc    = label + " КРИТИЧНО низкое: " + round(value);
        } else if (value < r[0]) {
            penalty = normalize(r[0] - value, 0, r[0] - r[2]) * 100;
            status  = "WARN";
            desc    = label + " понижено: " + round(value) + " (норма ≥ " + r[0] + ")";
        } else if (value > r[3]) {
            penalty = 80;
            status  = "CRIT";
            desc    = label + " КРИТИЧНО высокое: " + round(value);
        } else if (value > r[1]) {
            penalty = normalize(value, r[1], r[3]) * 60;
            status  = "WARN";
            desc    = label + " повышено: " + round(value);
        }
        return factor(param, label, value, penalty, weight, status, desc);
    }

    private HealthIndex.HealthFactor evalFuel(String param, String label,
                                              double value, double[] r, double weight) {
        double penalty = 0;
        String status  = "OK";
        String desc    = label + ": " + round(value) + "%";

        if (value < r[2]) {
            penalty = 100;
            status  = "CRIT";
            desc    = label + " КРИТИЧНО мало: " + round(value) + "% (мин " + r[2] + "%)";
        } else if (value < r[0]) {
            penalty = normalize(r[0] - value, 0, r[0] - r[2]) * 100;
            status  = "WARN";
            desc    = label + " на исходе: " + round(value) + "% (норма ≥ " + r[0] + "%)";
        }
        return factor(param, label, value, penalty, weight, status, desc);
    }

    private HealthIndex.HealthFactor evalSpeed(String param, String label,
                                               double value, double[] r, double weight) {
        double penalty = 0;
        String status  = "OK";
        String desc    = "Скорость: " + round(value) + " км/ч";

        if (value > r[3]) {
            penalty = 100;
            status  = "CRIT";
            desc    = "ПРЕВЫШЕНИЕ скорости: " + round(value) + " (макс " + r[3] + ")";
        } else if (value > r[1]) {
            penalty = normalize(value, r[1], r[3]) * 80;
            status  = "WARN";
            desc    = "Повышенная скорость: " + round(value) + " км/ч";
        }
        return factor(param, label, value, penalty, weight, status, desc);
    }

    private HealthIndex.HealthFactor evalVoltage(String param, String label,
                                                 double value, double[] r, double weight) {
        return evalPressure(param, label, value, r, weight);
    }

    private HealthIndex.HealthFactor evalCurrent(String param, String label,
                                                 double value, double[] r, double weight) {
        double penalty = 0;
        String status  = "OK";
        String desc    = "Ток: " + round(value) + " А";

        if (value > r[3]) {
            penalty = 100;
            status  = "CRIT";
            desc    = "ПЕРЕГРУЗКА по току: " + round(value) + " А";
        } else if (value > r[1]) {
            penalty = normalize(value, r[1], r[3]) * 70;
            status  = "WARN";
            desc    = "Повышенный ток: " + round(value) + " А";
        }
        return factor(param, label, value, penalty, weight, status, desc);
    }


    private HealthIndex.HealthFactor factor(String param, String label, double value,
                                            double penalty, double weight,
                                            String status, String desc) {
        return HealthIndex.HealthFactor.builder()
                .paramName(param)
                .label(label)
                .rawValue(round(value))
                .penalty(round(penalty))
                .weight(weight)
                .contribution(round(penalty * weight / 100.0))
                .status(status)
                .description(desc)
                .build();
    }

    private double normalize(double value, double min, double max) {
        if (max <= min) return 0;
        return Math.max(0, Math.min(1, (value - min) / (max - min)));
    }

    private String toGrade(double score) {
        if (score >= 90) return "A";
        if (score >= 75) return "B";
        if (score >= 55) return "C";
        if (score >= 35) return "D";
        return "E";
    }

    private HealthIndex.Category toCategory(double score) {
        if (score >= 80) return HealthIndex.Category.NORM;
        if (score >= 50) return HealthIndex.Category.WARN;
        return HealthIndex.Category.CRIT;
    }

    private String toCategoryLabel(double score) {
        if (score >= 80) return "Норма";
        if (score >= 50) return "Внимание";
        return "Критично";
    }

    private List<String> buildRecommendations(List<HealthIndex.HealthFactor> factors) {
        List<String> recs = new ArrayList<>();
        for (HealthIndex.HealthFactor f : factors) {
            if ("CRIT".equals(f.getStatus())) {
                recs.add("🔴 СРОЧНО: " + f.getDescription());
            } else if ("WARN".equals(f.getStatus())) {
                recs.add("🟡 Внимание: " + f.getDescription());
            }
            if (recs.size() >= 5) break;
        }
        if (recs.isEmpty()) recs.add("✅ Все параметры в норме");
        return recs;
    }

    private double round(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}