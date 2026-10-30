package com.zappy.service;

import com.zappy.dto.order.*;
import com.zappy.model.entity.OrderEntity;
import com.zappy.model.entity.OrderItemEntity;
import com.zappy.model.entity.RestaurantEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.OrderItemRepository;
import com.zappy.repository.OrderRepository;
import com.zappy.repository.RestaurantRepository;
import com.zappy.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private RestaurantRepository restaurantRepository;

    @InjectMocks
    private OrderService orderService;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private UserPrincipal adminPrincipal;
    private UserPrincipal unauthorizedPrincipal;
    private RestaurantEntity restaurant;
    private OrderEntity order;

    @BeforeEach
    void setUp() {
        restaurantId = UUID.randomUUID();
        otherRestaurantId = UUID.randomUUID();

        adminPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "admin@zappy.com",
                "hashed",
                AppRole.restaurant_admin,
                restaurantId
        );

        unauthorizedPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "unauth@zappy.com",
                "hashed",
                AppRole.restaurant_admin,
                otherRestaurantId
        );

        restaurant = new RestaurantEntity();
        restaurant.setId(restaurantId);
        restaurant.setName("Test Restaurant");
        restaurant.setTaxRate(BigDecimal.valueOf(5.00));
        restaurant.setServiceChargeRate(BigDecimal.valueOf(2.00));

        order = new OrderEntity();
        order.setId(UUID.randomUUID());
        order.setRestaurantId(restaurantId);
        order.setOrderNumber(1);
        order.setTokenNo("T-01");
        order.setStatus("pending");
        order.setPaymentStatus("pending");
        order.setSubtotal(BigDecimal.valueOf(100.00));
        order.setTaxAmount(BigDecimal.valueOf(5.00));
        order.setServiceCharge(BigDecimal.valueOf(2.00));
        order.setTotalAmount(BigDecimal.valueOf(107.00));

        OrderItemEntity item = new OrderItemEntity("Pizza", BigDecimal.valueOf(100.00), 1);
        order.addItem(item);
    }

    @Test
    @DisplayName("Should create order with correctly calculated subtotal, tax, service charge and total")
    void testCreateOrder() {
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(orderRepository.findMaxOrderNumberByRestaurantId(restaurantId)).thenReturn(5);
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateOrderRequest request = new CreateOrderRequest(
                restaurantId,
                UUID.randomUUID(),
                null,
                null,
                1,
                "John Doe",
                "+1234567890",
                "Extra spicy",
                "cash",
                "pending",
                List.of(
                        new OrderItemRequest(UUID.randomUUID(), "Burger", BigDecimal.valueOf(150.00), 2, "No onions"),
                        new OrderItemRequest(UUID.randomUUID(), "Coke", BigDecimal.valueOf(50.00), 1, "Cold")
                )
        );

        OrderResponse response = orderService.createOrder(restaurantId, request, null);

        assertNotNull(response);
        assertEquals(6, response.order_number());
        assertEquals("T-06", response.token_no());
        assertEquals(2, response.order_items().size());
        assertEquals(BigDecimal.valueOf(350.00), response.subtotal());
        // tax 5% of 350 = 17.50
        assertEquals(BigDecimal.valueOf(17.50).setScale(2), response.tax_amount());
        // service charge 2% of 350 = 7.00
        assertEquals(BigDecimal.valueOf(7.00).setScale(2), response.service_charge());
        // total = 350 + 17.50 + 7.00 = 374.50
        assertEquals(BigDecimal.valueOf(374.50).setScale(2), response.total_amount());
    }

    @Test
    @DisplayName("Should update order status to preparing and set startedPreparingAt")
    void testUpdateOrderStatusPreparing() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(order.getId(), "preparing", null, adminPrincipal);

        assertEquals("preparing", response.status());
        assertNotNull(response.started_preparing_at());
    }

    @Test
    @DisplayName("Should update order status to cancelled with reason")
    void testUpdateOrderStatusCancelled() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderStatus(order.getId(), "cancelled", "Customer changed mind", adminPrincipal);

        assertEquals("cancelled", response.status());
        assertEquals("Customer changed mind", response.cancel_reason());
        assertNotNull(response.cancelled_at());
    }

    @Test
    @DisplayName("Should update order payment status and method")
    void testUpdateOrderPayment() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any(OrderEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.updateOrderPayment(order.getId(), "paid", "credit_card", adminPrincipal);

        assertEquals("paid", response.payment_status());
        assertEquals("credit_card", response.payment_method());
    }

    @Test
    @DisplayName("Should reject order status update if tenant does not match")
    void testTenantAccessDenied() {
        when(orderRepository.findById(order.getId())).thenReturn(Optional.of(order));

        assertThrows(AccessDeniedException.class, () ->
                orderService.updateOrderStatus(order.getId(), "confirmed", null, unauthorizedPrincipal)
        );
    }
}
