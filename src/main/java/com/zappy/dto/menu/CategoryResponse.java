package com.zappy.dto.menu;

import com.zappy.model.entity.CategoryEntity;
import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(
    UUID id,
    UUID restaurant_id,
    String name,
    String description,
    String image_url,
    Integer display_order,
    Boolean is_active,
    Instant created_at,
    Instant updated_at
) {
    public static CategoryResponse fromEntity(CategoryEntity entity) {
        return new CategoryResponse(
            entity.getId(),
            entity.getRestaurantId(),
            entity.getName(),
            entity.getDescription(),
            entity.getImageUrl(),
            entity.getDisplayOrder(),
            entity.getIsActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}

