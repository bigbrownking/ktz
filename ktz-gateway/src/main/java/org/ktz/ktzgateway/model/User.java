package org.ktz.ktzgateway.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Table("users")
public class User {
    @Id
    private Long id;
    private String name;
    private String surname;
    private String username;
    private int age;
    private String password;
    private String role;
    private Long locomotiveId;
    private String photoUrl;
}