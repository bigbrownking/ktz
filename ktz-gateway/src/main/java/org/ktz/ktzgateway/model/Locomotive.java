package org.ktz.ktzgateway.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Getter
@Setter
@Table("locomotives")
public class Locomotive {
    @Id
    private Long id;
    private String name;
    private String type;
    private String number;
}
