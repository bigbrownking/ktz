package org.ktz.ktzgateway.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Table("routes")
public class Route {
    @Id
    private Long id;
    private String origin;
    private String destination;
    private String status;
    private Long userId;
    private Long locomotiveId;
}