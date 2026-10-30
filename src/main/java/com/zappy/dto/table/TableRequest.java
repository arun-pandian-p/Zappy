package com.zappy.dto.table;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record TableRequest(
    @NotBlank(message = "Table number is required")
    String table_number,

    @Min(value = 1, message = "Capacity must be at least 1")
    Integer capacity,

    String status,

    String qr_code_url,

    Boolean is_active
) {}

