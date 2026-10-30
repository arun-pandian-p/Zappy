package com.zappy.dto.table;

import com.zappy.model.entity.TableEntity;
import java.time.Instant;
import java.util.UUID;

public record TableResponse(
    UUID id,
    UUID restaurant_id,
    String table_number,
    Integer capacity,
    String status,
    String qr_code_url,
    Boolean is_active,
    Instant deleted_at,
    Instant created_at,
    Instant updated_at
) {
    public static TableResponse fromEntity(TableEntity entity) {
        return new TableResponse(
            entity.getId(),
            entity.getRestaurantId(),
            entity.getTableNumber(),
            entity.getCapacity(),
            entity.getStatus(),
            entity.getQrCodeUrl(),
            entity.getIsActive(),
            entity.getDeletedAt(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}
