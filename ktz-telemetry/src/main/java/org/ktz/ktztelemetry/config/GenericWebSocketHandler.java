package org.ktz.ktztelemetry.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class GenericWebSocketHandler implements WebSocketHandler {

    private final WebSocketSinks wsSinks;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private static final String CHAT_TOPIC = "chat";

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String path  = session.getHandshakeInfo().getUri().getPath();
        String topic = path.replaceFirst("^/ws/", "");

        log.info("WS client connected to topic: {}", topic);

        if (topic.equals(CHAT_TOPIC)) {
            Mono<Void> receivingDone = session.receive()
                    .doOnNext(msg -> {
                        try {
                            Object payload = mapper.readValue(msg.getPayloadAsText(), Object.class);
                            wsSinks.send(CHAT_TOPIC, payload);
                        } catch (Exception e) {
                            log.warn("Chat parse error: {}", e.getMessage());
                        }
                    })
                    .doFinally(s -> log.info("Chat receive closed for session {}", session.getId()))
                    .then();

            Flux<org.springframework.web.reactive.socket.WebSocketMessage> outgoing =
                    wsSinks.subscribe(CHAT_TOPIC)
                            .takeUntilOther(receivingDone)
                            .map(data -> {
                                try {
                                    return session.textMessage(mapper.writeValueAsString(data));
                                } catch (Exception e) {
                                    return session.textMessage("{}");
                                }
                            });

            return session.send(outgoing)
                    .doFinally(s -> log.info("Chat session {} ended", session.getId()));
        }

        return session.send(
                wsSinks.subscribe(topic)
                        .map(data -> {
                            try {
                                return session.textMessage(mapper.writeValueAsString(data));
                            } catch (Exception e) {
                                return session.textMessage("{}");
                            }
                        })
        ).doFinally(sig -> log.info("WS client disconnected from topic: {}", topic));
    }
}
