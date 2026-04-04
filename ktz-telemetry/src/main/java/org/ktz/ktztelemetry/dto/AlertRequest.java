package org.ktz.ktztelemetry.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AlertRequest {
    private String locomotiveNumber;
    private String message;
    private String type;
}