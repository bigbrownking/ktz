package org.ktz.ktzgateway.dto.request;

import lombok.Data;

@Data
public class RouteRequestDto {
    private String origin;
    private String destination;
    private String status;
    private Long userId;
}