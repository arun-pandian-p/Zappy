package com.zappy.model.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "restaurants", schema = "public")
public class RestaurantEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Column(name = "description")
    private String description;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "cover_image_url")
    private String coverImageUrl;

    @Column(name = "banner_image_url")
    private String bannerImageUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "menu_title")
    private String menuTitle;

    @Column(name = "address")
    private String address;

    @Column(name = "phone")
    private String phone;

    @Column(name = "email")
    private String email;

    @Column(name = "google_review_url")
    private String googleReviewUrl;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate = BigDecimal.valueOf(5.00);

    @Column(name = "service_charge_rate", precision = 5, scale = 2)
    private BigDecimal serviceChargeRate = BigDecimal.valueOf(0.00);

    @Column(name = "currency")
    private String currency = "INR";

    @Column(name = "primary_color")
    private String primaryColor = "#3B82F6";

    @Column(name = "secondary_color")
    private String secondaryColor = "#10B981";

    @Column(name = "font_family")
    private String fontFamily = "Inter";

    @Column(name = "subscription_tier")
    private String subscriptionTier = "free";

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "ads_enabled")
    private Boolean adsEnabled = true;

    @Column(name = "settings", columnDefinition = "text")
    private String settings;

    @Column(name = "printer_settings", columnDefinition = "text")
    private String printerSettings;

    @Column(name = "review_settings", columnDefinition = "text")
    private String reviewSettings;

    @Column(name = "theme_config", columnDefinition = "text")
    private String themeConfig;

    @Column(name = "feature_toggles", columnDefinition = "text")
    private String featureToggles;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    public RestaurantEntity() {}

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public String getBannerImageUrl() {
        return bannerImageUrl;
    }

    public void setBannerImageUrl(String bannerImageUrl) {
        this.bannerImageUrl = bannerImageUrl;
    }

    public String getFaviconUrl() {
        return faviconUrl;
    }

    public void setFaviconUrl(String faviconUrl) {
        this.faviconUrl = faviconUrl;
    }

    public String getMenuTitle() {
        return menuTitle;
    }

    public void setMenuTitle(String menuTitle) {
        this.menuTitle = menuTitle;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGoogleReviewUrl() {
        return googleReviewUrl;
    }

    public void setGoogleReviewUrl(String googleReviewUrl) {
        this.googleReviewUrl = googleReviewUrl;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    public void setTaxRate(BigDecimal taxRate) {
        this.taxRate = taxRate;
    }

    public BigDecimal getServiceChargeRate() {
        return serviceChargeRate;
    }

    public void setServiceChargeRate(BigDecimal serviceChargeRate) {
        this.serviceChargeRate = serviceChargeRate;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public String getSecondaryColor() {
        return secondaryColor;
    }

    public void setSecondaryColor(String secondaryColor) {
        this.secondaryColor = secondaryColor;
    }

    public String getFontFamily() {
        return fontFamily;
    }

    public void setFontFamily(String fontFamily) {
        this.fontFamily = fontFamily;
    }

    public String getSubscriptionTier() {
        return subscriptionTier;
    }

    public void setSubscriptionTier(String subscriptionTier) {
        this.subscriptionTier = subscriptionTier;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getAdsEnabled() {
        return adsEnabled;
    }

    public void setAdsEnabled(Boolean adsEnabled) {
        this.adsEnabled = adsEnabled;
    }

    public String getSettings() {
        return settings;
    }

    public void setSettings(String settings) {
        this.settings = settings;
    }

    public String getPrinterSettings() {
        return printerSettings;
    }

    public void setPrinterSettings(String printerSettings) {
        this.printerSettings = printerSettings;
    }

    public String getReviewSettings() {
        return reviewSettings;
    }

    public void setReviewSettings(String reviewSettings) {
        this.reviewSettings = reviewSettings;
    }

    public String getThemeConfig() {
        return themeConfig;
    }

    public void setThemeConfig(String themeConfig) {
        this.themeConfig = themeConfig;
    }

    public String getFeatureToggles() {
        return featureToggles;
    }

    public void setFeatureToggles(String featureToggles) {
        this.featureToggles = featureToggles;
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
