package com.zappy.dto.auth;

import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long expiresIn,
    UserDto user
) {
    public record UserDto(
        UUID id,
        String email,
        String role,
        UUID restaurantId
    ) {}

    public static AuthResponse of(String accessToken, String refreshToken, long expiresIn, UUID id, String email, String role, UUID restaurantId) {
        return new AuthResponse(
            accessToken,
            refreshToken,
            "Bearer",
            expiresIn,
            new UserDto(id, email, role, restaurantId)
        );
    }
}

