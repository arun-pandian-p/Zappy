package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.model.entity.*;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.*;
import com.zappy.security.JwtTokenProvider;
import com.zappy.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class KitchenControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private UUID restaurantId;
    private String kitchenToken;
    private OrderEntity order;
    private OrderItemEntity item;

    @BeforeEach
    void setUp() {
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
        restaurantRepository.deleteAll();

        restaurantId = UUID.randomUUID();
        RestaurantEntity restaurant = new RestaurantEntity();
        restaurant.setId(restaurantId);
        restaurant.setName("Kitchen Bistro");
        restaurant.setSlug("kitchen-bistro-" + restaurantId.toString().substring(0, 8));
        restaurantRepository.save(restaurant);

        UUID cookId = UUID.randomUUID();
        UserEntity cook = new UserEntity(cookId, "cook@kitchen.com", "password123");
        userRepository.save(cook);

        UserRoleEntity role = new UserRoleEntity(cookId, restaurantId, AppRole.kitchen);
        userRoleRepository.save(role);

        UserPrincipal cookPrincipal = new UserPrincipal(
                cookId,
                "cook@kitchen.com",
                "password123",
                AppRole.kitchen,
                restaurantId
        );
        kitchenToken = "Bearer " + jwtTokenProvider.generateAccessToken(cookPrincipal);

        order = new OrderEntity();
        order.setId(UUID.randomUUID());
        order.setRestaurantId(restaurantId);
        order.setOrderNumber(1);
        order.setStatus("pending");
        order.setTotalAmount(BigDecimal.valueOf(100.00));

        item = new OrderItemEntity("Pizza", BigDecimal.valueOf(100.00), 1);
        item.setId(UUID.randomUUID());
        order.addItem(item);

        order = orderRepository.save(order);
    }

    @Test
    @DisplayName("GET /api/kitchen/orders - list active orders for kitchen")
    void testGetActiveOrders() throws Exception {
        mockMvc.perform(get("/api/kitchen/orders")
                        .param("restaurantId", restaurantId.toString())
                        .header("Authorization", kitchenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].order_number").value(1));
    }

    @Test
    @DisplayName("PATCH /api/kitchen/orders/{id}/preparing - start preparing")
    void testStartPreparing() throws Exception {
        mockMvc.perform(patch("/api/kitchen/orders/" + order.getId() + "/preparing")
                        .header("Authorization", kitchenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("preparing"))
                .andExpect(jsonPath("$.started_preparing_at").isNotEmpty());
    }

    @Test
    @DisplayName("PATCH /api/kitchen/orders/{id}/ready - mark order ready")
    void testMarkReady() throws Exception {
        mockMvc.perform(patch("/api/kitchen/orders/" + order.getId() + "/ready")
                        .header("Authorization", kitchenToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ready"))
                .andExpect(jsonPath("$.ready_at").isNotEmpty());
    }
}
