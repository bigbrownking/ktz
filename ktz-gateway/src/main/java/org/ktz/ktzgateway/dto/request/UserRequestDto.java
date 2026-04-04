package org.ktz.ktzgateway.dto.request;

import lombok.Data;

@Data
public class UserRequestDto {
    private String name;
    private String surname;
    private String username;
    private int age;
    private String route;
    private String password;
    private String role;
    private Long locomotiveId;
}
