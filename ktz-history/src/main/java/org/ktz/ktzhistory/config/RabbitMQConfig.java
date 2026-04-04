package org.ktz.ktzhistory.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE = "telemetry.exchange";
    public static final String QUEUE = "telemetry.raw.history";
    public static final String ROUTING_KEY = "telemetry.#";

    @Bean
    public TopicExchange telemetryExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue historyQueue() {
        return new Queue(QUEUE, true);
    }

    @Bean
    public Binding historyBinding(Queue historyQueue, TopicExchange telemetryExchange) {
        return BindingBuilder
                .bind(historyQueue)
                .to(telemetryExchange)
                .with(ROUTING_KEY);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}