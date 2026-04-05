package org.ktz.ktzgateway.dto.request;

import lombok.Data;

@Data
public class RouteRequestDto {
    private String origin;
    private String destination;
    private String status;
    private Long userId;
    private Long locomotiveId;
    private String stations;
    private Integer distanceKm;
    private Integer estimatedMinutes;
    private Double startLat;
    private Double startLon;
    private Double endLat;
    private Double endLon;
}
