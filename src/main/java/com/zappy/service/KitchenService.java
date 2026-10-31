package com.zappy.service;

import com.zappy.dto.order.OrderResponse;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.model.entity.OrderEntity;
import com.zappy.model.entity.OrderItemEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.OrderItemRepository;
import com.zappy.repository.OrderRepository;
import com.zappy.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class KitchenService {

    private static final Logger log = LoggerFactory.getLogger(KitchenService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public KitchenService(OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveKitchenOrders(UUID restaurantId, String station, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);

        List<String> activeStatuses = List.of("pending", "confirmed", "preparing");
        List<OrderEntity> orders = orderRepository.findByRestaurantIdAndStatusInOrderByCreatedAtDesc(restaurantId, activeStatuses);

        return orders.stream().map(OrderResponse::fromEntity).toList();
    }

    public OrderResponse startPreparing(UUID orderId, UserPrincipal principal) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        validateTenantAccess(order.getRestaurantId(), principal);

        order.setStatus("preparing");
        if (order.getStartedPreparingAt() == null) {
            order.setStartedPreparingAt(Instant.now());
        }
        order.setUpdatedAt(Instant.now());

        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                item.setStatus("preparing");
            }
        }

        OrderEntity saved = orderRepository.save(order);
        log.info("Kitchen started preparing order #{} ({})", saved.getOrderNumber(), orderId);

        return OrderResponse.fromEntity(saved);
    }

    public OrderResponse markReady(UUID orderId, UserPrincipal principal) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        validateTenantAccess(order.getRestaurantId(), principal);

        order.setStatus("ready");
        if (order.getReadyAt() == null) {
            order.setReadyAt(Instant.now());
        }
        order.setUpdatedAt(Instant.now());

        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                item.setStatus("ready");
            }
        }

        OrderEntity saved = orderRepository.save(order);
        log.info("Kitchen marked order #{} ({}) ready", saved.getOrderNumber(), orderId);

        return OrderResponse.fromEntity(saved);
    }

    public void updateOrderItemStatus(UUID itemId, String status, UserPrincipal principal) {
        OrderItemEntity item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found with id: " + itemId));

        OrderEntity order = item.getOrder();
        if (order != null) {
            validateTenantAccess(order.getRestaurantId(), principal);
        }

        item.setStatus(status);
        orderItemRepository.save(item);

        // Check if all items in order are ready
        if (order != null && "ready".equalsIgnoreCase(status) && order.getItems() != null) {
            boolean allReady = order.getItems().stream().allMatch(i -> "ready".equalsIgnoreCase(i.getStatus()));
            if (allReady) {
                order.setStatus("ready");
                order.setReadyAt(Instant.now());
                orderRepository.save(order);
            }
        }
    }

    private void validateTenantAccess(UUID targetRestaurantId, UserPrincipal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (principal.getRole() == AppRole.super_admin) {
            return;
        }
        if (principal.getRestaurantId() == null || !principal.getRestaurantId().equals(targetRestaurantId)) {
            throw new AccessDeniedException("Access denied: You do not have permission for this restaurant");
        }
    }
}
