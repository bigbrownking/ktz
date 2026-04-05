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
    private Long userId;
    private String username;
    private String name;
    private String surname;
    private String photoUrl;
    private int age;
}
