package com.zappy.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
    @NotBlank(message = "Email or username is required")
    String email,

    @NotBlank(message = "Password is required")
    String password
) {}

