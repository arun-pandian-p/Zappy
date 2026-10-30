package com.zappy.repository;

import com.zappy.model.entity.UserRoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRoleEntity, UUID> {
    List<UserRoleEntity> findByUserId(UUID userId);
    Optional<UserRoleEntity> findFirstByUserId(UUID userId);
}

