package com.zappy.security;

import com.zappy.model.entity.UserEntity;
import com.zappy.model.entity.UserRoleEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.UserRepository;
import com.zappy.repository.UserRoleRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public CustomUserDetailsService(UserRepository userRepository, UserRoleRepository userRoleRepository) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        UserEntity user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return buildPrincipal(user);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(UUID id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + id));

        return buildPrincipal(user);
    }

    private UserPrincipal buildPrincipal(UserEntity user) {
        Optional<UserRoleEntity> roleEntity = userRoleRepository.findFirstByUserId(user.getId());
        AppRole role = roleEntity.map(UserRoleEntity::getRole).orElse(AppRole.restaurant_admin);
        UUID restaurantId = roleEntity.map(UserRoleEntity::getRestaurantId).orElse(null);

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getEncryptedPassword(),
                role,
                restaurantId
        );
    }
}

