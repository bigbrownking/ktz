package org.ktz.ktzgateway.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String locomotiveName;
    private String locomotiveNumber;
    private String role;
}
