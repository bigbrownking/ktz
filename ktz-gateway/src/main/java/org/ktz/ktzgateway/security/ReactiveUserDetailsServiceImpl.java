package org.ktz.ktzgateway.security;

import lombok.RequiredArgsConstructor;
import org.ktz.ktzgateway.model.Locomotive;
import org.ktz.ktzgateway.repository.LocomotiveRepository;
import org.ktz.ktzgateway.repository.UserRepository;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ReactiveUserDetailsServiceImpl implements ReactiveUserDetailsService {

    private final UserRepository userRepository;
    private final LocomotiveRepository locomotiveRepository;

    @Override
    public Mono<UserDetails> findByUsername(String username) {
        return userRepository.findByUsername(username)
                .switchIfEmpty(Mono.error(
                        new UsernameNotFoundException("User not found: " + username)))
                .flatMap(user -> {
                    if (user.getLocomotiveId() == null) {
                        return Mono.just((UserDetails) new UserDetailsImpl(user, null));
                    }
                    return locomotiveRepository.findById(user.getLocomotiveId())
                            .map(Locomotive::getNumber)
                            .defaultIfEmpty("")
                            .map(number -> (UserDetails) new UserDetailsImpl(user, number));
                });
    }
}