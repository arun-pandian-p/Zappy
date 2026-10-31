package com.zappy.dto.waiter;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateWaiterCallRequest(
    UUID restaurant_id,

    @NotNull(message = "Table ID is required")
    UUID table_id,

    String reason
) {}
