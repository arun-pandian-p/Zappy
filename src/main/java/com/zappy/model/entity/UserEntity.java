package com.zappy.model.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users", schema = "auth")
public class UserEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "encrypted_password")
    private String encryptedPassword;

    @Column(name = "email_confirmed_at")
    private Instant emailConfirmedAt;

    @Column(name = "last_sign_in_at")
    private Instant lastSignInAt;

    @Column(name = "raw_user_meta_data", insertable = false, updatable = false)
    private String rawUserMetaData;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public UserEntity() {}

    public UserEntity(UUID id, String email, String encryptedPassword) {
        this.id = id;
        this.email = email;
        this.encryptedPassword = encryptedPassword;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEncryptedPassword() {
        return encryptedPassword;
    }

    public void setEncryptedPassword(String encryptedPassword) {
        this.encryptedPassword = encryptedPassword;
    }

    public Instant getEmailConfirmedAt() {
        return emailConfirmedAt;
    }

    public void setEmailConfirmedAt(Instant emailConfirmedAt) {
        this.emailConfirmedAt = emailConfirmedAt;
    }

    public Instant getLastSignInAt() {
        return lastSignInAt;
    }

    public void setLastSignInAt(Instant lastSignInAt) {
        this.lastSignInAt = lastSignInAt;
    }

    public String getRawUserMetaData() {
        return rawUserMetaData;
    }

    public void setRawUserMetaData(String rawUserMetaData) {
        this.rawUserMetaData = rawUserMetaData;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

