package com.zappy.dto.order;

import jakarta.validation.constraints.NotBlank;

public record OrderPaymentUpdateRequest(
    @NotBlank(message = "Payment status is required")
    String payment_status,

    String payment_method
) {}

