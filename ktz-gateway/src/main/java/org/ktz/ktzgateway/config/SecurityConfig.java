package org.ktz.ktzgateway.config;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import reactor.core.publisher.Mono;
@Configuration
@EnableWebFluxSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(ex -> ex
                        .pathMatchers("/auth/**").permitAll()
                        .pathMatchers(
                                "/",
                                "/swagger-ui",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/webjars/**",
                                "/swagger-resources/**",
                                "/simulator/v3/api-docs",
                                "/simulator/v3/api-docs/**",
                                "/telemetry/v3/api-docs",
                                "/telemetry/v3/api-docs/**",
                                "/history/v3/api-docs",
                                "/history/v3/api-docs/**"
                        ).permitAll()
                        .pathMatchers(org.springframework.http.HttpMethod.GET, "/route/**", "/locomotive/**", "/user/**").permitAll()
                        .pathMatchers("/user/**").hasRole("ADMIN")
                        .pathMatchers("/route/**", "/locomotive/**").hasAnyRole("USER", "ADMIN")
                        .anyExchange().authenticated()
                )
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                // ← добавь JWT фильтр
                .addFilterAt(jwtAuthFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((exchange, e) -> {
                            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                            exchange.getResponse().getHeaders()
                                    .setContentType(MediaType.APPLICATION_JSON);
                            exchange.getResponse().getHeaders()
                                    .remove("WWW-Authenticate");
                            var body = "{\"error\":\"Unauthorized\",\"message\":\"Token required\"}";
                            var buffer = exchange.getResponse().bufferFactory()
                                    .wrap(body.getBytes());
                            return exchange.getResponse().writeWith(Mono.just(buffer));
                        })
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}