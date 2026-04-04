package org.ktz.ktzgateway.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LocomotiveResponseDto {
    private Long id;
    private String name;
    private String type;
    private String number;
    private String assignedUsername;
}