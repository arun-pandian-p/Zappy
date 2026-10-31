package com.zappy.dto.order;

import jakarta.validation.constraints.NotBlank;

public record OrderStatusUpdateRequest(
    @NotBlank(message = "Order status is required")
    String status,

    String cancel_reason
) {}

