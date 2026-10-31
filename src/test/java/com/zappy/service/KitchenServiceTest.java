package com.zappy.service;

import com.zappy.dto.order.OrderResponse;
import com.zappy.model.entity.OrderEntity;
import com.zappy.model.entity.OrderItemEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.OrderItemRepository;
import com.zappy.repository.OrderRepository;
import com.zappy.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class KitchenServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private KitchenService kitchenService;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private UserPrincipal staffPrincipal;
    private UserPrincipal unauthorizedPrincipal;
    private OrderEntity order;
    private OrderItemEntity item;

    @BeforeEach
    void setUp() {
        restaurantId = UUID.randomUUID();
        otherRestaurantId = UUID.randomUUID();

        staffPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "cook@zappy.com",
                "pwd",
                AppRole.kitchen,
                restaurantId
        );

        unauthorizedPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "other@zappy.com",
                "pwd",
                AppRole.kitchen,
                otherRestaurantId
        );

        order = new OrderEntity();
        order.setId(UUID.randomUUID());
        order.setRestaurantId(restaurantId);
        order.setStatus("pending");
        order.setOrderNumber(10);

        item = new OrderItemEntity("Burger", java.math.BigDecimal.valueOf(100), 1);
        item.setId(UUID.randomUUID());
        order.addItem(item);
    }

    @Test
    @DisplayName("Should start preparing order and update all items to preparing")
    void testStartPreparing() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = kitchenService.startPreparing(order.getId(), staffPrincipal);

        assertEquals("preparing", res.status());
        assertNotNull(order.getStartedPreparingAt());
        assertEquals("preparing", item.getStatus());
    }

    @Test
    @DisplayName("Should mark order ready and update all items to ready")
    void testMarkReady() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = kitchenService.markReady(order.getId(), staffPrincipal);

        assertEquals("ready", res.status());
        assertNotNull(order.getReadyAt());
        assertEquals("ready", item.getStatus());
    }

    @Test
    @DisplayName("Should update single order item status")
    void testUpdateOrderItemStatus() {
        when(orderItemRepository.findById(item.getId())).thenReturn(Optional.of(item));

        kitchenService.updateOrderItemStatus(item.getId(), "preparing", staffPrincipal);

        assertEquals("preparing", item.getStatus());
        verify(orderItemRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("Should reject action if user does not belong to order restaurant")
    void testTenantAccessDenied() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThrows(AccessDeniedException.class, () ->
                kitchenService.startPreparing(order.getId(), unauthorizedPrincipal)
        );
    }
}
