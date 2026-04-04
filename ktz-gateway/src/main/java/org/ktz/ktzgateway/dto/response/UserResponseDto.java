package org.ktz.ktzgateway.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponseDto {
    private Long id;
    private String name;
    private String surname;
    private String username;
    private int age;
    private String role;
    private Long locomotiveId;
    private String photoUrl;
}
