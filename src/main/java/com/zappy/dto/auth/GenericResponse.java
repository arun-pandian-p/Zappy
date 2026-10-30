package com.zappy.dto.auth;

public record GenericResponse(
    boolean success,
    String message
) {
    public static GenericResponse ok(String message) {
        return new GenericResponse(true, message);
    }

    public static GenericResponse error(String message) {
        return new GenericResponse(false, message);
    }
}

