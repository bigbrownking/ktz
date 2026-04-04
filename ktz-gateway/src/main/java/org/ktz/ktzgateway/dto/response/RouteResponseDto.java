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
}