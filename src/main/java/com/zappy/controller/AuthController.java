package com.zappy.controller;

import com.zappy.dto.auth.*;
import com.zappy.security.UserPrincipal;
import com.zappy.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<GenericResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        GenericResponse response = authService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<GenericResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        GenericResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<GenericResponse> logout() {
        return ResponseEntity.ok(GenericResponse.ok("Logged out successfully."));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserDto> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(authService.getCurrentUser(principal));
    }
}

