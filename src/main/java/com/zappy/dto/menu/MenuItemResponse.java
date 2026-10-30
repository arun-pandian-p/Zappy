package com.zappy.dto.menu;

import com.zappy.model.entity.MenuItemEntity;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MenuItemResponse(
    UUID id,
    UUID restaurant_id,
    UUID category_id,
    String name,
    String description,
    BigDecimal price,
    String image_url,
    Boolean is_vegetarian,
    Boolean is_vegan,
    Integer spicy_level,
    Boolean is_popular,
    Boolean is_available,
    Integer prep_time_minutes,
    Integer display_order,
    String kitchen_station,
    Instant created_at,
    Instant updated_at,
    CategorySummary category
) {
    public record CategorySummary(
        UUID id,
        String name,
        Integer display_order
    ) {}

    public static MenuItemResponse fromEntity(MenuItemEntity entity) {
        CategorySummary categorySummary = null;
        if (entity.getCategory() != null) {
            categorySummary = new CategorySummary(
                entity.getCategory().getId(),
                entity.getCategory().getName(),
                entity.getCategory().getDisplayOrder()
            );
        }

        return new MenuItemResponse(
            entity.getId(),
            entity.getRestaurantId(),
            entity.getCategoryId(),
            entity.getName(),
            entity.getDescription(),
            entity.getPrice(),
            entity.getImageUrl(),
            entity.getIsVegetarian(),
            entity.getIsVegan(),
            entity.getSpicyLevel(),
            entity.getIsPopular(),
            entity.getIsAvailable(),
            entity.getPrepTimeMinutes(),
            entity.getDisplayOrder(),
            entity.getKitchenStation(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            categorySummary
        );
    }
}

