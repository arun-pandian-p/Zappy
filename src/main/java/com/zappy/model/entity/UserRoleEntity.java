package com.zappy.model.entity;

import com.zappy.model.enums.AppRole;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_roles", schema = "public")
public class UserRoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "restaurant_id")
    private UUID restaurantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private AppRole role;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    public UserRoleEntity() {}

    public UserRoleEntity(UUID userId, UUID restaurantId, AppRole role) {
        this.userId = userId;
        this.restaurantId = restaurantId;
        this.role = role;
        this.createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getRestaurantId() {
        return restaurantId;
    }

    public void setRestaurantId(UUID restaurantId) {
        this.restaurantId = restaurantId;
    }

    public AppRole getRole() {
        return role;
    }

    public void setRole(AppRole role) {
        this.role = role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}

