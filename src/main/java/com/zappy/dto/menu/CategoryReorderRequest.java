package com.zappy.dto.menu;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record CategoryReorderRequest(
    @NotEmpty(message = "Items list cannot be empty")
    List<CategoryOrderItem> items
) {
    public record CategoryOrderItem(
        UUID id,
        Integer display_order
    ) {}
}

