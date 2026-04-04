package org.ktz.ktztelemetry.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class ChatMessage {
    private String from;
    private String to;
    private String locomotiveNumber;
    private String message;
    private String type;
    private Instant timestamp;
}