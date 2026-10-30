package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.menu.MenuItemRequest;
import com.zappy.model.entity.CategoryEntity;
import com.zappy.model.entity.MenuItemEntity;
import com.zappy.model.entity.RestaurantEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.CategoryRepository;
import com.zappy.repository.MenuItemRepository;
import com.zappy.repository.RestaurantRepository;
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
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MenuControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private com.zappy.repository.UserRepository userRepository;

    @Autowired
    private com.zappy.repository.UserRoleRepository userRoleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private String adminToken;

    @BeforeEach
    void setUp() {
        menuItemRepository.deleteAll();
        categoryRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
        restaurantRepository.deleteAll();

        restaurantId = UUID.randomUUID();
        otherRestaurantId = UUID.randomUUID();

        RestaurantEntity r1 = new RestaurantEntity();
        r1.setId(restaurantId);
        r1.setName("Test Restaurant");
        r1.setSlug("test-rest");
        restaurantRepository.save(r1);

        RestaurantEntity r2 = new RestaurantEntity();
        r2.setId(otherRestaurantId);
        r2.setName("Other Restaurant");
        r2.setSlug("other-rest");
        restaurantRepository.save(r2);

        UUID adminUserId = UUID.randomUUID();
        com.zappy.model.entity.UserEntity u1 = new com.zappy.model.entity.UserEntity(adminUserId, "admin@zappy.com", "pwd");
        userRepository.save(u1);
        userRoleRepository.save(new com.zappy.model.entity.UserRoleEntity(adminUserId, restaurantId, AppRole.restaurant_admin));

        UserPrincipal adminPrincipal = new UserPrincipal(
                adminUserId,
                "admin@zappy.com",
                "pwd",
                AppRole.restaurant_admin,
                restaurantId
        );
        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminPrincipal);
    }

    @Test
    @DisplayName("GET /api/menu-items/restaurant/{id} returns items publicly")
    void getMenuItems_public_returns200() throws Exception {
        MenuItemEntity item = new MenuItemEntity(restaurantId, null, "Spring Rolls", BigDecimal.valueOf(120.00));
        menuItemRepository.save(item);

        mockMvc.perform(get("/api/menu-items/restaurant/" + restaurantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Spring Rolls"))
                .andExpect(jsonPath("$[0].price").value(120.00));
    }

    @Test
    @DisplayName("POST /api/menu-items/restaurant/{id} creates item with valid JWT")
    void createMenuItem_authenticated_returns201() throws Exception {
        CategoryEntity category = new CategoryEntity(restaurantId, "Appetizers", null, null, 1);
        CategoryEntity savedCategory = categoryRepository.save(category);

        MenuItemRequest req = new MenuItemRequest(
                savedCategory.getId(),
                "Chicken Tikka",
                "Clay oven grilled chicken",
                BigDecimal.valueOf(240.00),
                "http://tikka.jpg",
                false,
                false,
                3,
                true,
                true,
                20,
                1,
                "tandoor"
        );

        mockMvc.perform(post("/api/menu-items/restaurant/" + restaurantId)
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Chicken Tikka"))
                .andExpect(jsonPath("$.price").value(240.00))
                .andExpect(jsonPath("$.category_id").value(savedCategory.getId().toString()));
    }

    @Test
    @DisplayName("POST /api/menu-items/restaurant/{id} returns 403 without JWT")
    void createMenuItem_unauthenticated_returns403() throws Exception {
        MenuItemRequest req = new MenuItemRequest(
                null, "Water Bottle", null, BigDecimal.valueOf(20.00),
                null, true, true, 0, false, true, 1, 1, "kitchen"
        );

        mockMvc.perform(post("/api/menu-items/restaurant/" + restaurantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/menu-items/restaurant/{otherId} enforces tenant isolation (403)")
    void createMenuItem_tenantMismatch_returns403() throws Exception {
        MenuItemRequest req = new MenuItemRequest(
                null, "Ice Cream", null, BigDecimal.valueOf(80.00),
                null, true, false, 0, false, true, 5, 1, "dessert"
        );

        mockMvc.perform(post("/api/menu-items/restaurant/" + otherRestaurantId)
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /api/menu-items/{id}/availability toggles item availability")
    void toggleAvailability_authenticated_returns200() throws Exception {
        MenuItemEntity item = new MenuItemEntity(restaurantId, null, "Soup", BigDecimal.valueOf(110.00));
        item.setIsAvailable(true);
        MenuItemEntity saved = menuItemRepository.save(item);

        mockMvc.perform(patch("/api/menu-items/" + saved.getId() + "/availability")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("is_available", false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.is_available").value(false));
    }

    @Test
    @DisplayName("DELETE /api/menu-items/{id} removes menu item")
    void deleteMenuItem_authenticated_returns200() throws Exception {
        MenuItemEntity item = new MenuItemEntity(restaurantId, null, "Bread", BigDecimal.valueOf(30.00));
        MenuItemEntity saved = menuItemRepository.save(item);

        mockMvc.perform(delete("/api/menu-items/" + saved.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
