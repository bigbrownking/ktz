package org.ktz.ktzhistory.service;

import org.ktz.ktzhistory.model.TelemetryData;
import org.ktz.ktzhistory.model.TelemetryRecord;
import org.ktz.ktzhistory.repository.TelemetryRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class TelemetryConsumer {

    private final TelemetryRepository repository;

    public TelemetryConsumer(TelemetryRepository repository) {
        this.repository = repository;
    }

    @RabbitListener(queues = "telemetry.raw.history")
    public void consume(TelemetryData data) {
        repository.save(TelemetryRecord.from(data));
    }
}