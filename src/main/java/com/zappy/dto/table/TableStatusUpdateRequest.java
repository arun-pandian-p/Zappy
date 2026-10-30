package com.zappy.dto.table;

import jakarta.validation.constraints.NotBlank;

public record TableStatusUpdateRequest(
    @NotBlank(message = "Status is required")
    String status
) {}

