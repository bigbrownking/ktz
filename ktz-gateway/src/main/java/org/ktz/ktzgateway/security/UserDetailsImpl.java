package org.ktz.ktzgateway.security;

import lombok.Getter;
import org.ktz.ktzgateway.model.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class UserDetailsImpl implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final String locomotiveId;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(User user, String locomotiveNumber) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.password = user.getPassword();
        this.locomotiveId = locomotiveNumber;
        this.authorities = List.of(new SimpleGrantedAuthority(user.getRole()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}