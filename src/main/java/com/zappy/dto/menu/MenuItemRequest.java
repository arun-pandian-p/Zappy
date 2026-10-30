package com.zappy.dto.menu;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record MenuItemRequest(
    UUID category_id,

    @NotBlank(message = "Item name is required")
    String name,

    String description,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    BigDecimal price,

    String image_url,
    Boolean is_vegetarian,
    Boolean is_vegan,
    Integer spicy_level,
    Boolean is_popular,
    Boolean is_available,
    Integer prep_time_minutes,
    Integer display_order,
    String kitchen_station
) {}

