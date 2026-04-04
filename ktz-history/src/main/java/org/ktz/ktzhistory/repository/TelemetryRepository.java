package org.ktz.ktzhistory.repository;

import org.ktz.ktzhistory.model.TelemetryData;
import org.ktz.ktzhistory.model.TelemetryRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TelemetryRepository extends JpaRepository<TelemetryRecord, Long> {

    List<TelemetryRecord> findByType(TelemetryData.Type type);

    List<TelemetryRecord> findByTimestampBetween(Instant from, Instant to);

    List<TelemetryRecord> findByTypeAndTimestampBetween(TelemetryData.Type type, Instant from, Instant to);

    List<TelemetryRecord> findByLocomotiveNumber(String locomotiveNumber);
}