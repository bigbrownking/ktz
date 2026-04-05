package org.ktz.ktztelemetry.config;

import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiGatewayConfig {

    /**
     * SpringDoc can infer {@code servers} from the proxied request (e.g. {@code http://telemetry:8082}),
     * which makes Swagger UI in the browser call Docker hostnames. A relative server keeps "Try it out"
     * on the gateway origin (e.g. {@code http://localhost:8080}).
     */
    @Bean
    public OpenApiCustomizer gatewayCompatibleServers() {
        return openApi -> openApi.setServers(List.of(new Server().url("/").description("Through gateway")));
    }
}
