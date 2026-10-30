package com.zappy.security;

import com.zappy.model.enums.AppRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

public class UserPrincipal implements UserDetails {

    private final UUID id;
    private final String email;
    private final String password;
    private final AppRole role;
    private final UUID restaurantId;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID id, String email, String password, AppRole role, UUID restaurantId) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.role = role;
        this.restaurantId = restaurantId;
        this.authorities = Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + (role != null ? role.name() : "GUEST"))
        );
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public AppRole getRole() {
        return role;
    }

    public UUID getRestaurantId() {
        return restaurantId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
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

