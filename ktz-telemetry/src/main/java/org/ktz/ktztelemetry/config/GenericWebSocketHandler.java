package org.ktz.ktztelemetry.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class GenericWebSocketHandler implements WebSocketHandler {

    private final WebSocketSinks wsSinks;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // /ws/alert/TE33A-001  →  topic = "alert/TE33A-001"
        String path  = session.getHandshakeInfo().getUri().getPath();
        String topic = path.replaceFirst("^/ws/", "");

        log.info("WS client subscribed to topic: {}", topic);

        return session.send(
                wsSinks.subscribe(topic)
                        .map(data -> {
                            try {
                                return session.textMessage(mapper.writeValueAsString(data));
                            } catch (Exception e) {
                                log.error("Serialization error: {}", e.getMessage());
                                return session.textMessage("{}");
                            }
                        })
        ).doFinally(sig ->
                log.info("WS client unsubscribed from topic: {}", topic)
        );
    }
}