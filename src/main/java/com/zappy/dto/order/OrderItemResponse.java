package com.zappy.dto.order;

import com.zappy.model.entity.OrderItemEntity;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderItemResponse(
    UUID id,
    UUID order_id,
    UUID menu_item_id,
    String name,
    BigDecimal price,
    Integer quantity,
    String status,
    String special_instructions,
    Instant created_at
) {
    public static OrderItemResponse fromEntity(OrderItemEntity entity) {
        return new OrderItemResponse(
            entity.getId(),
            entity.getOrderId(),
            entity.getMenuItemId(),
            entity.getName(),
            entity.getPrice(),
            entity.getQuantity(),
            entity.getStatus(),
            entity.getSpecialInstructions(),
            entity.getCreatedAt()
        );
    }
}

