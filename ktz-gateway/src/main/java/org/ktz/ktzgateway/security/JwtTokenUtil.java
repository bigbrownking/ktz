package org.ktz.ktzgateway.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    @Value("${jwt.refresh.expiration}")
    private long refreshTokenExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, String role, String locomotiveNumber, String locomotiveName) {
        JwtBuilder builder = Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey())
                .claim("role", role)
                .claim("tokenType", "ACCESS");

        if (locomotiveNumber != null) {
            builder.claim("locomotiveNumber", locomotiveNumber);
            builder.claim("locomotiveName",   locomotiveName);
        }

        return builder.compact();
    }

    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpirationMs))
                .signWith(getSigningKey())
                .claim("tokenType", "REFRESH")
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUsernameFromToken(String token) {
        return parse(token).getSubject();
    }

    public String getTokenType(String token) {
        return parse(token).get("tokenType", String.class);
    }

    public boolean validateToken(String token) {
        try {
            parse(token);
            return true;
        } catch (MalformedJwtException e)     { log.error("Invalid JWT: {}", e.getMessage()); }
        catch (ExpiredJwtException e)          { log.error("JWT expired: {}", e.getMessage()); }
        catch (UnsupportedJwtException e)      { log.error("JWT unsupported: {}", e.getMessage()); }
        catch (IllegalArgumentException e)     { log.error("JWT empty: {}", e.getMessage()); }
        return false;
    }

    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = parse(token);
            return "REFRESH".equals(claims.get("tokenType", String.class));
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid refresh token: {}", e.getMessage());
            return false;
        }
    }
}