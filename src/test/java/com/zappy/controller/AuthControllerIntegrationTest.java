package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.auth.ForgotPasswordRequest;
import com.zappy.dto.auth.LoginRequest;
import com.zappy.dto.auth.ResetPasswordRequest;
import com.zappy.model.entity.PasswordResetTokenEntity;
import com.zappy.model.entity.UserEntity;
import com.zappy.model.entity.UserRoleEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.PasswordResetTokenRepository;
import com.zappy.repository.UserRepository;
import com.zappy.repository.UserRoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private UUID userId;
    private UUID restaurantId;

    @BeforeEach
    void setUp() {
        resetTokenRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();

        userId = UUID.randomUUID();
        restaurantId = UUID.randomUUID();

        UserEntity user = new UserEntity(userId, "admin@testrestaurant.com", passwordEncoder.encode("secretPassword123"));
        userRepository.save(user);

        UserRoleEntity role = new UserRoleEntity(userId, restaurantId, AppRole.restaurant_admin);
        userRoleRepository.save(role);
    }

    @Test
    @DisplayName("POST /api/auth/login - valid credentials returns 200 with JWT")
    void testLoginSuccess() throws Exception {
        LoginRequest request = new LoginRequest("admin@testrestaurant.com", "secretPassword123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value("admin@testrestaurant.com"))
                .andExpect(jsonPath("$.user.role").value("restaurant_admin"));
    }

    @Test
    @DisplayName("POST /api/auth/login - invalid credentials returns 401 with generic error")
    void testLoginInvalidCredentials() throws Exception {
        LoginRequest request = new LoginRequest("admin@testrestaurant.com", "wrongPassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid email/username or password."));
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password - returns 200 generic message without account enumeration")
    void testForgotPassword() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("admin@testrestaurant.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/auth/reset-password - resets password and invalidates token")
    void testResetPassword() throws Exception {
        String token = "test-reset-token-12345";
        PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity(
                userId, token, Instant.now().plus(1, ChronoUnit.HOURS)
        );
        resetTokenRepository.save(resetToken);

        ResetPasswordRequest request = new ResetPasswordRequest(token, "brandNewPassword999");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify login works with new password
        LoginRequest loginWithNewPass = new LoginRequest("admin@testrestaurant.com", "brandNewPassword999");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginWithNewPass)))
                .andExpect(status().isOk());
    }
}

