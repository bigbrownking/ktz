package org.ktz.ktzsimulator.config;

import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiGatewayConfig {

    @Bean
    public OpenApiCustomizer gatewayCompatibleServers() {
        return openApi -> openApi.setServers(List.of(new Server().url("/").description("Through gateway")));
    }
}
