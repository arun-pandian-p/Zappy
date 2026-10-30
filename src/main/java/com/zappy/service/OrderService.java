package com.zappy.service;

import com.zappy.dto.order.*;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.model.entity.OrderEntity;
import com.zappy.model.entity.OrderItemEntity;
import com.zappy.model.entity.RestaurantEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.OrderItemRepository;
import com.zappy.repository.OrderRepository;
import com.zappy.repository.RestaurantRepository;
import com.zappy.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RestaurantRepository restaurantRepository;

    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RestaurantRepository restaurantRepository
    ) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.restaurantRepository = restaurantRepository;
    }

    public OrderResponse createOrder(UUID restaurantId, CreateOrderRequest request, UserPrincipal principal) {
        RestaurantEntity restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Restaurant not found: " + restaurantId));

        OrderEntity order = new OrderEntity();
        order.setId(UUID.randomUUID());
        order.setRestaurantId(restaurantId);
        order.setTableId(request.table_id());
        order.setTableSessionId(request.table_session_id());
        order.setSeatSessionId(request.seat_session_id());
        order.setSeatNumber(request.seat_number());
        order.setCustomerName(request.customer_name());
        order.setCustomerPhone(request.customer_phone());
        order.setSpecialInstructions(request.special_instructions());
        order.setStatus("pending");
        order.setPaymentStatus(request.payment_status() != null ? request.payment_status() : "pending");
        order.setPaymentMethod(request.payment_method());
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());

        // Assign incremental order number and token number
        Integer maxOrderNum = orderRepository.findMaxOrderNumberByRestaurantId(restaurantId);
        int nextOrderNum = (maxOrderNum != null ? maxOrderNum : 0) + 1;
        order.setOrderNumber(nextOrderNum);
        order.setTokenNo(String.format("T-%02d", (nextOrderNum % 100 == 0 ? 100 : nextOrderNum % 100)));

        // Calculate Subtotal from Items
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItemRequest itemReq : request.items()) {
            BigDecimal lineTotal = itemReq.price().multiply(BigDecimal.valueOf(itemReq.quantity() != null ? itemReq.quantity() : 1));
            subtotal = subtotal.add(lineTotal);

            OrderItemEntity item = new OrderItemEntity();
            item.setId(UUID.randomUUID());
            item.setMenuItemId(itemReq.menu_item_id());
            item.setName(itemReq.name());
            item.setPrice(itemReq.price());
            item.setQuantity(itemReq.quantity() != null ? itemReq.quantity() : 1);
            item.setSpecialInstructions(itemReq.special_instructions());
            item.setStatus("pending");
            item.setCreatedAt(Instant.now());
            order.addItem(item);
        }

        BigDecimal taxRate = restaurant.getTaxRate() != null ? restaurant.getTaxRate() : BigDecimal.ZERO;
        BigDecimal serviceChargeRate = restaurant.getServiceChargeRate() != null ? restaurant.getServiceChargeRate() : BigDecimal.ZERO;

        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal serviceCharge = subtotal.multiply(serviceChargeRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount).add(serviceCharge);

        order.setSubtotal(subtotal);
        order.setTaxAmount(taxAmount);
        order.setServiceCharge(serviceCharge);
        order.setTotalAmount(totalAmount);

        OrderEntity saved = orderRepository.save(order);
        log.info("Order created successfully #{} ({}) for restaurant {} with {} items, total: {}", 
                saved.getOrderNumber(), saved.getId(), restaurantId, saved.getItems().size(), saved.getTotalAmount());

        return OrderResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrders(UUID restaurantId, String status, List<String> statuses, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);

        List<OrderEntity> orders;
        if (statuses != null && !statuses.isEmpty()) {
            orders = orderRepository.findByRestaurantIdAndStatusInOrderByCreatedAtDesc(restaurantId, statuses);
        } else if (status != null && !status.isBlank()) {
            orders = orderRepository.findByRestaurantIdAndStatusOrderByCreatedAtDesc(restaurantId, status);
        } else {
            orders = orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        }

        return orders.stream().map(OrderResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID id, UserPrincipal principal) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        // If authenticated staff, validate restaurant access
        if (principal != null) {
            validateTenantAccess(order.getRestaurantId(), principal);
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getTodayOrders(UUID restaurantId, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);
        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        return orderRepository.findByRestaurantIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(restaurantId, startOfDay)
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    public OrderResponse updateOrderStatus(UUID id, String status, String cancelReason, UserPrincipal principal) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        validateTenantAccess(order.getRestaurantId(), principal);

        order.setStatus(status);
        order.setUpdatedAt(Instant.now());

        if ("preparing".equalsIgnoreCase(status) && order.getStartedPreparingAt() == null) {
            order.setStartedPreparingAt(Instant.now());
        } else if ("ready".equalsIgnoreCase(status) && order.getReadyAt() == null) {
            order.setReadyAt(Instant.now());
        } else if ("cancelled".equalsIgnoreCase(status)) {
            order.setCancelledAt(Instant.now());
            if (cancelReason != null) {
                order.setCancelReason(cancelReason);
            }
        }

        // Keep items in sync
        if (order.getItems() != null) {
            for (OrderItemEntity item : order.getItems()) {
                item.setStatus(status);
            }
        }

        OrderEntity saved = orderRepository.save(order);
        log.info("Order #{} ({}) status updated to '{}' for restaurant {}", 
                saved.getOrderNumber(), saved.getId(), status, saved.getRestaurantId());

        return OrderResponse.fromEntity(saved);
    }

    public OrderResponse updateOrderPayment(UUID id, String paymentStatus, String paymentMethod, UserPrincipal principal) {
        OrderEntity order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        validateTenantAccess(order.getRestaurantId(), principal);

        order.setPaymentStatus(paymentStatus);
        if (paymentMethod != null && !paymentMethod.isBlank()) {
            order.setPaymentMethod(paymentMethod);
        }
        order.setUpdatedAt(Instant.now());

        OrderEntity saved = orderRepository.save(order);
        log.info("Order #{} ({}) payment updated to '{}' ({})", 
                saved.getOrderNumber(), saved.getId(), paymentStatus, paymentMethod);

        return OrderResponse.fromEntity(saved);
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
