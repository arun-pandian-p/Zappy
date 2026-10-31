package com.zappy.controller;

import com.zappy.dto.order.OrderResponse;
import com.zappy.security.UserPrincipal;
import com.zappy.service.KitchenService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/kitchen")
@PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'kitchen', 'waiter')")
public class KitchenController {

    private final KitchenService kitchenService;

    public KitchenController(KitchenService kitchenService) {
        this.kitchenService = kitchenService;
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getActiveKitchenOrders(
            @RequestParam UUID restaurantId,
            @RequestParam(required = false) String station,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<OrderResponse> orders = kitchenService.getActiveKitchenOrders(restaurantId, station, principal);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/orders/{id}/preparing")
    public ResponseEntity<OrderResponse> startPreparing(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderResponse updated = kitchenService.startPreparing(id, principal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/orders/{id}/ready")
    public ResponseEntity<OrderResponse> markReady(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderResponse updated = kitchenService.markReady(id, principal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<Map<String, Object>> updateItemStatus(
            @PathVariable UUID itemId,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal principal) {
        kitchenService.updateOrderItemStatus(itemId, status, principal);
        return ResponseEntity.ok(Map.of("success", true, "status", status));
    }
}
