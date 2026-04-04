package org.ktz.ktztelemetry.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE    = "telemetry.exchange";
    public static final String QUEUE       = "telemetry.raw.telemetry";
    public static final String ROUTING_KEY = "telemetry.#";

    @Bean
    public TopicExchange telemetryExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue telemetryQueue() {
        return new Queue(QUEUE, true);
    }

    @Bean
    public Binding telemetryBinding(Queue telemetryQueue, TopicExchange telemetryExchange) {
        return BindingBuilder.bind(telemetryQueue).to(telemetryExchange).with(ROUTING_KEY);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }
}