package com.zappy.dto.waiter;

import com.zappy.model.entity.WaiterCallEntity;
import java.time.Instant;
import java.util.UUID;

public record WaiterCallResponse(
    UUID id,
    UUID restaurant_id,
    UUID table_id,
    String reason,
    String status,
    UUID responded_by,
    Instant responded_at,
    Instant created_at,
    TableSummary table
) {
    public record TableSummary(
        UUID id,
        String table_number
    ) {}

    public static WaiterCallResponse fromEntity(WaiterCallEntity entity) {
        TableSummary tableSummary = null;
        if (entity.getTable() != null) {
            tableSummary = new TableSummary(
                entity.getTable().getId(),
                entity.getTable().getTableNumber()
            );
        }

        return new WaiterCallResponse(
            entity.getId(),
            entity.getRestaurantId(),
            entity.getTableId(),
            entity.getReason(),
            entity.getStatus(),
            entity.getRespondedBy(),
            entity.getRespondedAt(),
            entity.getCreatedAt(),
            tableSummary
        );
    }
}
