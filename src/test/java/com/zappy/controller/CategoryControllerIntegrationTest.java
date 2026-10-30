package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.menu.CategoryRequest;
import com.zappy.model.entity.CategoryEntity;
import com.zappy.model.entity.RestaurantEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.CategoryRepository;
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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CategoryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

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
    @DisplayName("GET /api/categories/restaurant/{id} returns categories publicly")
    void getCategories_public_returns200() throws Exception {
        CategoryEntity c = new CategoryEntity(restaurantId, "Appetizers", "Great starters", null, 1);
        categoryRepository.save(c);

        mockMvc.perform(get("/api/categories/restaurant/" + restaurantId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Appetizers"));
    }

    @Test
    @DisplayName("POST /api/categories/restaurant/{id} creates category with valid JWT")
    void createCategory_authenticated_returns201() throws Exception {
        CategoryRequest req = new CategoryRequest("Main Course", "Delicious curries", null, 2, true);

        mockMvc.perform(post("/api/categories/restaurant/" + restaurantId)
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Main Course"))
                .andExpect(jsonPath("$.display_order").value(2));
    }

    @Test
    @DisplayName("POST /api/categories/restaurant/{id} returns 403 without JWT")
    void createCategory_unauthenticated_returns403() throws Exception {
        CategoryRequest req = new CategoryRequest("Drinks", null, null, 1, true);

        mockMvc.perform(post("/api/categories/restaurant/" + restaurantId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/categories/restaurant/{otherId} enforces tenant isolation (403)")
    void createCategory_tenantMismatch_returns403() throws Exception {
        CategoryRequest req = new CategoryRequest("Snacks", null, null, 1, true);

        mockMvc.perform(post("/api/categories/restaurant/" + otherRestaurantId)
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("DELETE /api/categories/{id} deletes category")
    void deleteCategory_authenticated_returns200() throws Exception {
        CategoryEntity c = new CategoryEntity(restaurantId, "Desserts", null, null, 1);
        CategoryEntity saved = categoryRepository.save(c);

        mockMvc.perform(delete("/api/categories/" + saved.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
