package com.zappy.dto.restaurant;

import java.math.BigDecimal;

public record RestaurantUpdateRequest(
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
    Boolean ads_enabled,
    Boolean onboarding_completed,
    Object settings,
    Object printer_settings,
    Object review_settings,
    Object theme_config,
    Object feature_toggles
) {
    public RestaurantUpdateRequest(
        String name, String slug, String description, String logo_url, String cover_image_url,
        String banner_image_url, String favicon_url, String menu_title, String address, String phone,
        String email, String google_review_url, BigDecimal tax_rate, BigDecimal service_charge_rate,
        String currency, String primary_color, String secondary_color, String font_family,
        Boolean ads_enabled, Object settings, Object printer_settings, Object review_settings,
        Object theme_config, Object feature_toggles
    ) {
        this(name, slug, description, logo_url, cover_image_url, banner_image_url, favicon_url,
             menu_title, address, phone, email, google_review_url, tax_rate, service_charge_rate,
             currency, primary_color, secondary_color, font_family, ads_enabled, true,
             settings, printer_settings, review_settings, theme_config, feature_toggles);
    }
}

