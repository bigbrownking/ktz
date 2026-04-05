package org.ktz.ktzgateway.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzgateway.model.User;
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
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureAdmin().block();
            log.info("DataInitializer completed");
        } catch (Exception e) {
            log.error("DataInitializer error: {}", e.getMessage(), e);
        }
    }

    private Mono<Void> ensureAdmin() {
        return userRepository.findByUsername("admin")
                .switchIfEmpty(
                        userRepository.save(buildAdmin())
                                .doOnSuccess(u -> log.info("Created default admin account (username=admin)"))
                )
                .then();
    }

    private User buildAdmin() {
        User u = new User();
        u.setUsername("admin");
        u.setName("Admin");
        u.setSurname("System");
        u.setPassword(passwordEncoder.encode("admin123"));
        u.setRole("ROLE_ADMIN");
        u.setAge(0);
        return u;
    }
}
