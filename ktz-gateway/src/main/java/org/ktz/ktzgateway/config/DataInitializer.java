package org.ktz.ktzgateway.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzgateway.model.Locomotive;
import org.ktz.ktzgateway.model.User;
import org.ktz.ktzgateway.repository.LocomotiveRepository;
import org.ktz.ktzgateway.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final LocomotiveRepository locomotiveRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        initData().subscribe(
                null,
                e -> log.error("DataInitializer error: {}", e.getMessage(), e),
                () -> log.info("DataInitializer completed")
        );
    }

    private Mono<Void> initData() {
        return upsertLocomotive("TE33A-001", "Астана-Кокшетау", "TE33A")
                .flatMap(loco1 ->
                        upsertLocomotive("KZ8A-007", "Алматы-Шымкент", "KZ8A")
                                .flatMap(loco2 ->
                                        upsertUser("admin", "Админ", "Системный",
                                                "admin123", "ROLE_ADMIN", null)
                                                .then(upsertUser("user", "Машинист", "Тестовый",
                                                        "user123", "ROLE_USER", loco1.getId()))
                                )
                )
                .then();
    }

    private Mono<Locomotive> upsertLocomotive(String number, String name, String type) {
        return locomotiveRepository.findByNumber(number)
                .switchIfEmpty(
                        locomotiveRepository.save(buildLocomotive(number, name, type))
                                .doOnSuccess(l -> log.info("Created locomotive: {} id={}", number, l.getId()))
                );
    }
    private Mono<User> upsertUser(String username, String name, String surname,
                                  String password, String role, Long locomotiveId) {
        return userRepository.findByUsername(username)
                .flatMap(existing -> {
                    if (!java.util.Objects.equals(existing.getLocomotiveId(), locomotiveId)) {
                        existing.setLocomotiveId(locomotiveId);
                        return userRepository.save(existing)
                                .doOnSuccess(u -> log.info("Updated user: {} locomotiveId={}",
                                        username, locomotiveId));
                    }
                    log.info("User already exists: {} locomotiveId={}", username, existing.getLocomotiveId());
                    return Mono.just(existing);
                })
                .switchIfEmpty(
                        userRepository.save(buildUser(username, name, surname, password, role, locomotiveId))
                                .doOnSuccess(u -> log.info("Created user: {} [{}] locomotiveId={}",
                                        username, role, locomotiveId))
                );
    }

    private Locomotive buildLocomotive(String number, String name, String type) {
        Locomotive l = new Locomotive();
        l.setNumber(number);
        l.setName(name);
        l.setType(type);
        return l;
    }

    private User buildUser(String username, String name, String surname,
                           String password, String role, Long locomotiveId) {
        User u = new User();
        u.setUsername(username);
        u.setName(name);
        u.setSurname(surname);
        u.setPassword(passwordEncoder.encode(password));
        u.setRole(role);
        u.setAge(0);
        u.setLocomotiveId(locomotiveId);
        return u;
    }
}