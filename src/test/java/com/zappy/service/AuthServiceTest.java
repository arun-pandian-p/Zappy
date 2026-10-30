package com.zappy.service;

import com.zappy.dto.auth.*;
import com.zappy.exception.InvalidTokenException;
import com.zappy.model.entity.PasswordResetTokenEntity;
import com.zappy.model.entity.UserEntity;
import com.zappy.model.entity.UserRoleEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.PasswordResetTokenRepository;
import com.zappy.repository.UserRepository;
import com.zappy.repository.UserRoleRepository;
import com.zappy.security.JwtTokenProvider;
import com.zappy.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private PasswordResetTokenRepository resetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @InjectMocks
    private AuthService authService;

    private UUID userId;
    private UUID restaurantId;
    private UserEntity userEntity;
    private UserRoleEntity userRoleEntity;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        restaurantId = UUID.randomUUID();

        userEntity = new UserEntity(userId, "admin@zappy.com", "$2a$10$hashedPassword");
        userRoleEntity = new UserRoleEntity(userId, restaurantId, AppRole.restaurant_admin);
    }

    @Test
    @DisplayName("Login with valid credentials returns tokens and user role")
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest("admin@zappy.com", "correctPassword");

        when(userRepository.findByEmailIgnoreCase("admin@zappy.com")).thenReturn(Optional.of(userEntity));
        when(passwordEncoder.matches("correctPassword", userEntity.getEncryptedPassword())).thenReturn(true);
        when(userRoleRepository.findFirstByUserId(userId)).thenReturn(Optional.of(userRoleEntity));
        when(tokenProvider.generateAccessToken(any(UserPrincipal.class))).thenReturn("mock-access-token");
        when(tokenProvider.generateRefreshToken(any(UserPrincipal.class))).thenReturn("mock-refresh-token");
        when(tokenProvider.getAccessTokenExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.accessToken());
        assertEquals("mock-refresh-token", response.refreshToken());
        assertEquals("admin@zappy.com", response.user().email());
        assertEquals(AppRole.restaurant_admin.name(), response.user().role());
        assertEquals(restaurantId, response.user().restaurantId());
        verify(userRepository).save(userEntity);
    }

    @Test
    @DisplayName("Login with invalid password throws BadCredentialsException")
    void testLoginInvalidPassword() {
        LoginRequest request = new LoginRequest("admin@zappy.com", "wrongPassword");

        when(userRepository.findByEmailIgnoreCase("admin@zappy.com")).thenReturn(Optional.of(userEntity));
        when(passwordEncoder.matches("wrongPassword", userEntity.getEncryptedPassword())).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Login with non-existent user throws BadCredentialsException")
    void testLoginUserNotFound() {
        LoginRequest request = new LoginRequest("unknown@zappy.com", "password");

        when(userRepository.findByEmailIgnoreCase("unknown@zappy.com")).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Forgot password returns generic message whether user exists or not")
    void testForgotPasswordGenericResponse() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("admin@zappy.com");

        when(userRepository.findByEmailIgnoreCase("admin@zappy.com")).thenReturn(Optional.of(userEntity));

        GenericResponse response = authService.forgotPassword(request);

        assertTrue(response.success());
        assertTrue(response.message().contains("If an account with that email exists"));
        verify(resetTokenRepository).save(any(PasswordResetTokenEntity.class));
    }

    @Test
    @DisplayName("Reset password succeeds with valid single-use token")
    void testResetPasswordSuccess() {
        String token = "valid-reset-token";
        ResetPasswordRequest request = new ResetPasswordRequest(token, "newSecurePassword123");

        PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity(
                userId, token, Instant.now().plus(1, ChronoUnit.HOURS)
        );

        when(resetTokenRepository.findByTokenHash(token)).thenReturn(Optional.of(tokenEntity));
        when(userRepository.findById(userId)).thenReturn(Optional.of(userEntity));
        when(passwordEncoder.encode("newSecurePassword123")).thenReturn("$2a$10$newHashedPassword");

        GenericResponse response = authService.resetPassword(request);

        assertTrue(response.success());
        assertNotNull(tokenEntity.getUsedAt());
        assertEquals("$2a$10$newHashedPassword", userEntity.getEncryptedPassword());
        verify(resetTokenRepository).save(tokenEntity);
        verify(userRepository).save(userEntity);
    }

    @Test
    @DisplayName("Reset password rejects expired token")
    void testResetPasswordExpiredToken() {
        String token = "expired-token";
        ResetPasswordRequest request = new ResetPasswordRequest(token, "newPassword123");

        PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity(
                userId, token, Instant.now().minus(1, ChronoUnit.HOURS)
        );

        when(resetTokenRepository.findByTokenHash(token)).thenReturn(Optional.of(tokenEntity));

        assertThrows(InvalidTokenException.class, () -> authService.resetPassword(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reset password rejects reused token")
    void testResetPasswordTokenReuse() {
        String token = "already-used-token";
        ResetPasswordRequest request = new ResetPasswordRequest(token, "newPassword123");

        PasswordResetTokenEntity tokenEntity = new PasswordResetTokenEntity(
                userId, token, Instant.now().plus(1, ChronoUnit.HOURS)
        );
        tokenEntity.setUsedAt(Instant.now().minus(5, ChronoUnit.MINUTES));

        when(resetTokenRepository.findByTokenHash(token)).thenReturn(Optional.of(tokenEntity));

        assertThrows(InvalidTokenException.class, () -> authService.resetPassword(request));
        verify(userRepository, never()).save(any());
    }
}

