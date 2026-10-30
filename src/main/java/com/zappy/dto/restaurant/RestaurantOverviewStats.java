package com.zappy.dto.restaurant;

import java.math.BigDecimal;

public record RestaurantOverviewStats(
    long totalOrdersToday,
    BigDecimal totalRevenueToday,
    long activeTables,
    long totalTables,
    long pendingOrders,
    long completedOrdersToday,
    double averageRating
) {}

