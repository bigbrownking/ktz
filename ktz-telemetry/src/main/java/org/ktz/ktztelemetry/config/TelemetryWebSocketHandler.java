package org.ktz.ktztelemetry.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktztelemetry.service.TelemetryService;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelemetryWebSocketHandler implements WebSocketHandler {

    private final TelemetryService telemetryService;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Override
    public Mono<Void> handle(WebSocketSession session) {
        // Извлекаем номер локомотива из URL: /ws/telemetry/TE33A-001
        String path = session.getHandshakeInfo().getUri().getPath();
        String locomotiveNumber = path.substring(path.lastIndexOf('/') + 1);

        log.info("WS client connected for locomotive: {} (session {})", locomotiveNumber, session.getId());

        return session.send(
                telemetryService.getByLocomotiveNumber(locomotiveNumber)
                        .map(data -> {
                            try {
                                return session.textMessage(mapper.writeValueAsString(data));
                            } catch (Exception e) {
                                log.error("Serialization error: {}", e.getMessage());
                                return session.textMessage("{}");
                            }
                        })
        )
                .and(session.receive().then())
                .doFinally(sig ->
                        log.info("WS client disconnected for locomotive: {} (session {}, signal {})", locomotiveNumber, session.getId(), sig)
                );
    }
}