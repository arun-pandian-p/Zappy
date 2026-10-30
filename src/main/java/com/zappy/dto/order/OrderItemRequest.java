package com.zappy.dto.order;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemRequest(
    UUID menu_item_id,

    @NotBlank(message = "Item name is required")
    String name,

    @NotNull(message = "Item price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    BigDecimal price,

    @Min(value = 1, message = "Quantity must be at least 1")
    Integer quantity,

    String special_instructions
) {}

