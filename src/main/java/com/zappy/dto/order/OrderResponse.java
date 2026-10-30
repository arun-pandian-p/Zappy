package com.zappy.dto.order;

import com.zappy.model.entity.OrderEntity;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
    UUID id,
    UUID restaurant_id,
    UUID table_id,
    UUID table_session_id,
    UUID seat_session_id,
    Integer seat_number,
    Integer order_number,
    String token_no,
    String customer_name,
    String customer_phone,
    String special_instructions,
    BigDecimal subtotal,
    BigDecimal tax_amount,
    BigDecimal service_charge,
    BigDecimal total_amount,
    String status,
    String payment_status,
    String payment_method,
    Instant started_preparing_at,
    Instant ready_at,
    Instant estimated_ready_at,
    Instant cancelled_at,
    String cancel_reason,
    Instant created_at,
    Instant updated_at,
    List<OrderItemResponse> order_items,
    TableSummary table
) {
    public record TableSummary(
        UUID id,
        String table_number
    ) {}

    public static OrderResponse fromEntity(OrderEntity entity) {
        TableSummary tableSummary = null;
        if (entity.getTable() != null) {
            tableSummary = new TableSummary(
                entity.getTable().getId(),
                entity.getTable().getTableNumber()
            );
        }

        List<OrderItemResponse> itemResponses = entity.getItems() != null
                ? entity.getItems().stream().map(OrderItemResponse::fromEntity).toList()
                : List.of();

        return new OrderResponse(
            entity.getId(),
            entity.getRestaurantId(),
            entity.getTableId(),
            entity.getTableSessionId(),
            entity.getSeatSessionId(),
            entity.getSeatNumber(),
            entity.getOrderNumber(),
            entity.getTokenNo(),
            entity.getCustomerName(),
            entity.getCustomerPhone(),
            entity.getSpecialInstructions(),
            entity.getSubtotal(),
            entity.getTaxAmount(),
            entity.getServiceCharge(),
            entity.getTotalAmount(),
            entity.getStatus(),
            entity.getPaymentStatus(),
            entity.getPaymentMethod(),
            entity.getStartedPreparingAt(),
            entity.getReadyAt(),
            entity.getEstimatedReadyAt(),
            entity.getCancelledAt(),
            entity.getCancelReason(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            itemResponses,
            tableSummary
        );
    }
}
