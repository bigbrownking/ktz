package org.ktz.ktztelemetry.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.ktz.ktztelemetry.model.TelemetryData;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public ReactiveRedisTemplate<String, TelemetryData> telemetryRedisTemplate(
            ReactiveRedisConnectionFactory factory,
            ObjectMapper objectMapper) {

        StringRedisSerializer keySerializer = new StringRedisSerializer();

        Jackson2JsonRedisSerializer<TelemetryData> valueSerializer =
                new Jackson2JsonRedisSerializer<>(objectMapper, TelemetryData.class);

        RedisSerializationContext<String, TelemetryData> context =
                RedisSerializationContext.<String, TelemetryData>
                                newSerializationContext(keySerializer)
                        .value(valueSerializer)
                        .build();

        return new ReactiveRedisTemplate<>(factory, context);
    }
}