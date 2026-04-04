package org.ktz.ktztelemetry.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SosResponse {
    private String locomotiveNumber;
    private String locomotiveName;
    private double latitude;
    private double longitude;
    private String message;
    private String type;
    private String timestamp;
}