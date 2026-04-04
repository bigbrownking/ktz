package org.ktz.ktztelemetry.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SosRequest {
    private String locomotiveNumber;
    private String locomotiveName;
    private double latitude;
    private double longitude;
    private String message;
}