package org.ktz.ktzgateway.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;


@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter implements WebFilter {

    private final JwtTokenUtil jwtTokenUtil;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (HttpMethod.OPTIONS.equals(exchange.getRequest().getMethod())) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return chain.filter(exchange);
        }

        String token = authHeader.substring(7);

        if (!jwtTokenUtil.validateToken(token)) {
            log.warn("Invalid JWT token");
            return chain.filter(exchange);
        }

        try {
            String username = jwtTokenUtil.getUsernameFromToken(token);
            String roleClaim = jwtTokenUtil.parse(token).get("role", String.class);
            final String role = (roleClaim == null || roleClaim.isBlank()) ? "ROLE_USER" : roleClaim;

            var auth = new UsernamePasswordAuthenticationToken(
                    username,
                    null,
                    List.of(new SimpleGrantedAuthority(role))
            );

            ServerWebExchange mutated = exchange.mutate()
                    .request(r -> r.header(HttpHeaders.AUTHORIZATION, authHeader)
                            .header("X-Username", username)
                            .header("X-Role", role))
                    .build();

            return chain.filter(mutated)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));

        } catch (Exception e) {
            log.error("JWT processing error: {}", e.getMessage());
            return chain.filter(exchange);
        }
    }
}