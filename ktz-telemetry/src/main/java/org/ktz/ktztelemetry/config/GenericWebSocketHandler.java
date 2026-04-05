package org.ktz.ktztelemetry.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class GenericWebSocketHandler implements WebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(GenericWebSocketHandler.class);

    private final WebSocketSinks wsSinks;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    private static final String CHAT_TOPIC = "chat";

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        String path  = session.getHandshakeInfo().getUri().getPath();
        String topic = path.replaceFirst("^/ws/", "");

        log.info("WS client connected to topic: {} (session {})", topic, session.getId());

        if (topic.equals(CHAT_TOPIC)) {
            // Не используем takeUntilOther(receive): при раннем завершении receive подписка на sink
            // отменялась, и клиент переставал получать broadcast — как у второго участника чата.
            Flux<org.springframework.web.reactive.socket.WebSocketMessage> outgoing =
                    wsSinks.subscribe(CHAT_TOPIC)
                            .map(data -> {
                                try {
                                    return session.textMessage(mapper.writeValueAsString(data));
                                } catch (Exception e) {
                                    return session.textMessage("{}");
                                }
                            });

            return session.send(outgoing)
                    .and(session.receive()
                            .doOnNext(msg -> {
                                try {
                                    Object payload = mapper.readValue(msg.getPayloadAsText(), Object.class);
                                    wsSinks.send(CHAT_TOPIC, payload);
                                } catch (Exception e) {
                                    log.warn("Chat parse error: {}", e.getMessage());
                                }
                            })
                            .doFinally(s -> log.info("Chat receive closed for session {}", session.getId()))
                            .then())
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
        )
                .and(session.receive().then())
                .doFinally(sig -> log.info("WS client disconnected from topic: {} (session {}, signal {})", topic, session.getId(), sig));
    }
}
