package org.ktz.ktztelemetry.controller;

import lombok.RequiredArgsConstructor;
import org.ktz.ktztelemetry.dto.ChatMessage;
import org.ktz.ktztelemetry.service.ChatService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import reactor.core.publisher.Mono;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // диспетчер → машинист
    @MessageMapping("/chat/to-locomotive")
    public Mono<Void> toLocomotive(@Payload ChatMessage message) {
        return chatService.sendToLocomotive(message);
    }

    // машинист → диспетчер
    @MessageMapping("/chat/to-dispatcher")
    public Mono<Void> toDispatcher(@Payload ChatMessage message) {
        return chatService.sendToDispatcher(message);
    }

    // broadcast
    @MessageMapping("/chat/broadcast")
    public Mono<Void> broadcast(@Payload ChatMessage message) {
        return chatService.broadcast(message);
    }
}