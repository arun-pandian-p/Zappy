package com.zappy.repository;

import com.zappy.model.entity.PasswordResetTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, UUID> {
    Optional<PasswordResetTokenEntity> findByTokenHash(String tokenHash);
}

