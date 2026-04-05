package org.ktz.ktzgateway.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RouteResponseDto {
    private Long id;
    private String origin;
    private String destination;
    private String status;
    private Long userId;
    private String username;
    private Long locomotiveId;
    private String locomotiveName;
    private String locomotiveNumber;
    private String stations;
    private Integer distanceKm;
    private Integer estimatedMinutes;
    private Double startLat;
    private Double startLon;
    private Double endLat;
    private Double endLon;
    private String driverName;
    private String driverSurname;
    private Integer driverAge;
    private String driverPhotoUrl;
}
