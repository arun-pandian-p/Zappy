package com.zappy.dto.menu;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CategoryRequest(
    @NotBlank(message = "Category name is required")
    String name,
    String description,
    String image_url,
    Integer display_order,
    Boolean is_active
) {}

