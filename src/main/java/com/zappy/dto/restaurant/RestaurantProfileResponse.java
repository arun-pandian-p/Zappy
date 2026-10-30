package com.zappy.dto.restaurant;

import com.zappy.model.entity.RestaurantEntity;

import java.math.BigDecimal;
import java.util.UUID;

public record RestaurantProfileResponse(
    UUID id,
    String name,
    String slug,
    String description,
    String logo_url,
    String cover_image_url,
    String banner_image_url,
    String favicon_url,
    String menu_title,
    String address,
    String phone,
    String email,
    String google_review_url,
    BigDecimal tax_rate,
    BigDecimal service_charge_rate,
    String currency,
    String primary_color,
    String secondary_color,
    String font_family,
    String subscription_tier,
    Boolean is_active,
    Boolean ads_enabled,
    Boolean onboarding_completed,
    Object settings,
    Object printer_settings,
    Object review_settings,
    Object theme_config,
    Object feature_toggles
) {
    public static RestaurantProfileResponse fromEntity(RestaurantEntity entity) {
        return new RestaurantProfileResponse(
            entity.getId(),
            entity.getName(),
            entity.getSlug(),
            entity.getDescription(),
            entity.getLogoUrl(),
            entity.getCoverImageUrl(),
            entity.getBannerImageUrl(),
            entity.getFaviconUrl(),
            entity.getMenuTitle(),
            entity.getAddress(),
            entity.getPhone(),
            entity.getEmail(),
            entity.getGoogleReviewUrl(),
            entity.getTaxRate(),
            entity.getServiceChargeRate(),
            entity.getCurrency(),
            entity.getPrimaryColor(),
            entity.getSecondaryColor(),
            entity.getFontFamily(),
            entity.getSubscriptionTier(),
            entity.getIsActive(),
            entity.getAdsEnabled(),
            entity.getOnboardingCompleted() != null ? entity.getOnboardingCompleted() : true,
            entity.getSettings(),
            entity.getPrinterSettings(),
            entity.getReviewSettings(),
            entity.getThemeConfig(),
            entity.getFeatureToggles()
        );
    }
}

