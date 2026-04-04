package org.ktz.ktztelemetry.service;

import org.ktz.ktztelemetry.dto.ChatMessage;
import reactor.core.publisher.Mono;

public interface ChatService {
    Mono<Void> sendToLocomotive(ChatMessage message);
    Mono<Void> sendToDispatcher(ChatMessage message);
    Mono<Void> broadcast(ChatMessage message);
}