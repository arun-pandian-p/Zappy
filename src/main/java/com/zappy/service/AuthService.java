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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository,
                       UserRoleRepository userRoleRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().trim();
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email/username or password."));

        if (user.getEncryptedPassword() == null ||
                !passwordEncoder.matches(request.password(), user.getEncryptedPassword())) {
            throw new BadCredentialsException("Invalid email/username or password.");
        }

        user.setLastSignInAt(Instant.now());
        userRepository.save(user);

        Optional<UserRoleEntity> roleEntity = userRoleRepository.findFirstByUserId(user.getId());
        AppRole role = roleEntity.map(UserRoleEntity::getRole).orElse(AppRole.restaurant_admin);
        UUID restaurantId = roleEntity.map(UserRoleEntity::getRestaurantId).orElse(null);

        UserPrincipal principal = new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getEncryptedPassword(),
                role,
                restaurantId
        );

        String accessToken = tokenProvider.generateAccessToken(principal);
        String refreshToken = tokenProvider.generateRefreshToken(principal);

        return AuthResponse.of(
                accessToken,
                refreshToken,
                tokenProvider.getAccessTokenExpirationMs() / 1000,
                user.getId(),
                user.getEmail(),
                role.name(),
                restaurantId
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.refreshToken();
        if (!tokenProvider.validateToken(refreshToken)) {
            throw new InvalidTokenException("Invalid or expired refresh token.");
        }

        UUID userId = tokenProvider.getUserIdFromToken(refreshToken);
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new BadCredentialsException("User not found for token."));

        Optional<UserRoleEntity> roleEntity = userRoleRepository.findFirstByUserId(user.getId());
        AppRole role = roleEntity.map(UserRoleEntity::getRole).orElse(AppRole.restaurant_admin);
        UUID restaurantId = roleEntity.map(UserRoleEntity::getRestaurantId).orElse(null);

        UserPrincipal principal = new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getEncryptedPassword(),
                role,
                restaurantId
        );

        String newAccessToken = tokenProvider.generateAccessToken(principal);
        String newRefreshToken = tokenProvider.generateRefreshToken(principal);

        return AuthResponse.of(
                newAccessToken,
                newRefreshToken,
                tokenProvider.getAccessTokenExpirationMs() / 1000,
                user.getId(),
                user.getEmail(),
                role.name(),
                restaurantId
        );
    }

    @Transactional
    public GenericResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.email().trim();
        Optional<UserEntity> userOpt = userRepository.findByEmailIgnoreCase(email);

        if (userOpt.isPresent()) {
            UserEntity user = userOpt.get();
            String token = UUID.randomUUID().toString() + UUID.randomUUID().toString().replace("-", "");
            Instant expiry = Instant.now().plus(1, ChronoUnit.HOURS);

            PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity(user.getId(), token, expiry);
            resetTokenRepository.save(resetToken);

            logger.info("Password reset requested for user {}. Token generated with 1 hour expiration.", user.getId());
        }

        // Return a generic response that does not reveal whether the account exists
        return GenericResponse.ok("If an account with that email exists, password reset instructions have been sent.");
    }

    @Transactional
    public GenericResponse resetPassword(ResetPasswordRequest request) {
        PasswordResetTokenEntity tokenEntity = resetTokenRepository.findByTokenHash(request.token())
                .orElseThrow(() -> new InvalidTokenException("Invalid or expired reset token."));

        if (tokenEntity.isExpired() || tokenEntity.isUsed()) {
            throw new InvalidTokenException("Invalid or expired reset token.");
        }

        if (request.newPassword() == null || request.newPassword().length() < 6) {
            throw new InvalidTokenException("Password must be at least 6 characters.");
        }

        UserEntity user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new InvalidTokenException("User no longer exists."));

        user.setEncryptedPassword(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        tokenEntity.setUsedAt(Instant.now());
        resetTokenRepository.save(tokenEntity);

        return GenericResponse.ok("Password has been updated successfully.");
    }

    @Transactional(readOnly = true)
    public AuthResponse.UserDto getCurrentUser(UserPrincipal principal) {
        return new AuthResponse.UserDto(
                principal.getId(),
                principal.getEmail(),
                principal.getRole() != null ? principal.getRole().name() : null,
                principal.getRestaurantId()
        );
    }
}

