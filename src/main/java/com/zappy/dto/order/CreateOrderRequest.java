package com.zappy.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record CreateOrderRequest(
    UUID restaurant_id,
    UUID table_id,
    UUID table_session_id,
    UUID seat_session_id,
    Integer seat_number,
    String customer_name,
    String customer_phone,
    String special_instructions,
    String payment_method,
    String payment_status,

    @NotEmpty(message = "Order must have at least one item")
    @Valid
    List<OrderItemRequest> items
) {}
