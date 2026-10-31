package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.order.CreateOrderRequest;
import com.zappy.dto.order.OrderItemRequest;
import com.zappy.dto.order.OrderPaymentUpdateRequest;
import com.zappy.dto.order.OrderStatusUpdateRequest;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private UUID restaurantId;
    private String adminToken;
    private TableEntity table;

    @BeforeEach
    void setUp() {
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        tableRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
        restaurantRepository.deleteAll();

        restaurantId = UUID.randomUUID();
        RestaurantEntity restaurant = new RestaurantEntity();
        restaurant.setId(restaurantId);
        restaurant.setName("Orders Bistro");
        restaurant.setSlug("orders-bistro-" + restaurantId.toString().substring(0, 8));
        restaurant.setTaxRate(BigDecimal.valueOf(5.00));
        restaurant.setServiceChargeRate(BigDecimal.valueOf(0.00));
        restaurantRepository.save(restaurant);

        table = new TableEntity(restaurantId, "T1", 4, "available");
        table = tableRepository.save(table);

        UUID adminUserId = UUID.randomUUID();
        UserEntity user = new UserEntity(adminUserId, "admin@orders.com", "password123");
        userRepository.save(user);

        UserRoleEntity role = new UserRoleEntity(adminUserId, restaurantId, AppRole.restaurant_admin);
        userRoleRepository.save(role);

        UserPrincipal adminPrincipal = new UserPrincipal(
                adminUserId,
                "admin@orders.com",
                "password123",
                AppRole.restaurant_admin,
                restaurantId
        );
        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminPrincipal);
    }

    @Test
    @DisplayName("POST /api/orders - public customer can create order")
    void testCreateOrderPublic() throws Exception {
        CreateOrderRequest request = new CreateOrderRequest(
                restaurantId,
                table.getId(),
                null,
                null,
                1,
                "Alice",
                "+1987654321",
                "No ice",
                "card",
                "pending",
                List.of(
                        new OrderItemRequest(null, "Cold Coffee", BigDecimal.valueOf(100.00), 2, null)
                )
        );

        mockMvc.perform(post("/api/orders")
                        .param("restaurantId", restaurantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.order_number").value(1))
                .andExpect(jsonPath("$.customer_name").value("Alice"))
                .andExpect(jsonPath("$.subtotal").value(200.0))
                .andExpect(jsonPath("$.tax_amount").value(10.0))
                .andExpect(jsonPath("$.total_amount").value(210.0));
    }

    @Test
    @DisplayName("GET /api/orders/{id} - can retrieve single order publicly")
    void testGetOrderById() throws Exception {
        OrderEntity o = new OrderEntity();
        o.setId(UUID.randomUUID());
        o.setRestaurantId(restaurantId);
        o.setOrderNumber(10);
        o.setCustomerName("Bob");
        o.setStatus("confirmed");
        o.setTotalAmount(BigDecimal.valueOf(50.00));
        o = orderRepository.save(o);

        mockMvc.perform(get("/api/orders/" + o.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(o.getId().toString()))
                .andExpect(jsonPath("$.customer_name").value("Bob"));
    }

    @Test
    @DisplayName("GET /api/orders - authenticated staff can retrieve orders")
    void testGetOrdersAuthenticated() throws Exception {
        OrderEntity o = new OrderEntity();
        o.setId(UUID.randomUUID());
        o.setRestaurantId(restaurantId);
        o.setOrderNumber(1);
        o.setStatus("pending");
        orderRepository.save(o);

        mockMvc.perform(get("/api/orders")
                        .param("restaurantId", restaurantId.toString())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].order_number").value(1));
    }

    @Test
    @DisplayName("PATCH /api/orders/{id}/status - update order status")
    void testUpdateOrderStatus() throws Exception {
        OrderEntity o = new OrderEntity();
        o.setId(UUID.randomUUID());
        o.setRestaurantId(restaurantId);
        o.setStatus("pending");
        o = orderRepository.save(o);

        OrderStatusUpdateRequest req = new OrderStatusUpdateRequest("preparing", null);

        mockMvc.perform(patch("/api/orders/" + o.getId() + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("preparing"))
                .andExpect(jsonPath("$.started_preparing_at").isNotEmpty());
    }

    @Test
    @DisplayName("PATCH /api/orders/{id}/payment - update order payment")
    void testUpdateOrderPayment() throws Exception {
        OrderEntity o = new OrderEntity();
        o.setId(UUID.randomUUID());
        o.setRestaurantId(restaurantId);
        o.setPaymentStatus("pending");
        o = orderRepository.save(o);

        OrderPaymentUpdateRequest req = new OrderPaymentUpdateRequest("paid", "cash");

        mockMvc.perform(patch("/api/orders/" + o.getId() + "/payment")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.payment_status").value("paid"))
                .andExpect(jsonPath("$.payment_method").value("cash"));
    }
}

