package com.zappy.controller;

import com.zappy.dto.order.*;
import com.zappy.security.UserPrincipal;
import com.zappy.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestParam UUID restaurantId,
            @Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderResponse created = orderService.createOrder(restaurantId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier')")
    public ResponseEntity<List<OrderResponse>> getOrders(
            @RequestParam UUID restaurantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) List<String> statuses,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<OrderResponse> orders = orderService.getOrders(restaurantId, status, statuses, principal);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderResponse order = orderService.getOrderById(id, principal);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier')")
    public ResponseEntity<List<OrderResponse>> getTodayOrders(
            @RequestParam UUID restaurantId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<OrderResponse> orders = orderService.getTodayOrders(restaurantId, principal);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'kitchen', 'cashier')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody OrderStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderResponse updated = orderService.updateOrderStatus(id, request.status(), request.cancel_reason(), principal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/payment")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'cashier')")
    public ResponseEntity<OrderResponse> updateOrderPayment(
            @PathVariable UUID id,
            @Valid @RequestBody OrderPaymentUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        OrderResponse updated = orderService.updateOrderPayment(id, request.payment_status(), request.payment_method(), principal);
        return ResponseEntity.ok(updated);
    }
}
