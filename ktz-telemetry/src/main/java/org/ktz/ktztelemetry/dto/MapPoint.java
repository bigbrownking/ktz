package org.ktz.ktztelemetry.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MapPoint {
    private String locomotiveNumber;
    private String locomotiveName;
    private double latitude;
    private double longitude;
    private double speed;
    private String timestamp;
}