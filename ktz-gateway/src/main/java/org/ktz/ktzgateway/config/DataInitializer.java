package org.ktz.ktzgateway.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.ktz.ktzgateway.model.User;
import org.ktz.ktzgateway.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        createIfNotExists("admin", "Админ",    "Системный", "admin123", "ROLE_ADMIN");
        createIfNotExists("user",  "Машинист", "Тестовый",  "user123",  "ROLE_USER");
    }

    private void createIfNotExists(String username, String name, String surname,
                                   String password, String role) {
        userRepository.findByUsername(username)
                .switchIfEmpty(
                        userRepository.save(buildUser(username, name, surname, password, role))
                                .doOnSuccess(u -> log.info(
                                        "Created default user: {} [{}]", username, role))
                                .doOnError(e -> log.error(
                                        "Failed to create user {}: {}", username, e.getMessage()))
                )
                .subscribe();
    }

    private User buildUser(String username, String name, String surname,
                           String password, String role) {
        User user = new User();
        user.setUsername(username);
        user.setName(name);
        user.setSurname(surname);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setAge(0);
        return user;
    }
}