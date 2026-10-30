package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.table.TableRequest;
import com.zappy.model.entity.RestaurantEntity;
import com.zappy.model.entity.TableEntity;
import com.zappy.model.entity.UserEntity;
import com.zappy.model.entity.UserRoleEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.RestaurantRepository;
import com.zappy.repository.TableRepository;
import com.zappy.repository.UserRepository;
import com.zappy.repository.UserRoleRepository;
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
class TableControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private UUID restaurantId;
    private String adminToken;

    @BeforeEach
    void setUp() {
        tableRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
        restaurantRepository.deleteAll();

        restaurantId = UUID.randomUUID();
        RestaurantEntity restaurant = new RestaurantEntity();
        restaurant.setId(restaurantId);
        restaurant.setName("Tables Bistro");
        restaurant.setSlug("tables-bistro-" + restaurantId.toString().substring(0, 8));
        restaurantRepository.save(restaurant);

        UUID adminUserId = UUID.randomUUID();
        UserEntity user = new UserEntity(adminUserId, "admin@tables.com", "password123");
        userRepository.save(user);

        UserRoleEntity role = new UserRoleEntity(adminUserId, restaurantId, AppRole.restaurant_admin);
        userRoleRepository.save(role);

        UserPrincipal adminPrincipal = new UserPrincipal(
                adminUserId,
                "admin@tables.com",
                "password123",
                AppRole.restaurant_admin,
                restaurantId
        );
        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(adminPrincipal);
    }

    @Test
    @DisplayName("GET /api/tables - public read access allowed")
    void testGetTablesPublic() throws Exception {
        TableEntity t1 = new TableEntity(restaurantId, "T1", 4, "available");
        tableRepository.save(t1);

        mockMvc.perform(get("/api/tables")
                        .param("restaurantId", restaurantId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].table_number").value("T1"))
                .andExpect(jsonPath("$[0].capacity").value(4));
    }

    @Test
    @DisplayName("GET /api/tables/by-number - find table by number")
    void testGetTableByNumber() throws Exception {
        TableEntity t1 = new TableEntity(restaurantId, "T10", 6, "available");
        tableRepository.save(t1);

        mockMvc.perform(get("/api/tables/by-number")
                        .param("restaurantId", restaurantId.toString())
                        .param("tableNumber", "t10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.table_number").value("T10"))
                .andExpect(jsonPath("$.capacity").value(6));
    }

    @Test
    @DisplayName("POST /api/tables - create table with admin role")
    void testCreateTable() throws Exception {
        TableRequest request = new TableRequest("T5", 4, "available", "https://qr.test/t5", true);

        mockMvc.perform(post("/api/tables")
                        .param("restaurantId", restaurantId.toString())
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.table_number").value("T5"))
                .andExpect(jsonPath("$.capacity").value(4));
    }

    @Test
    @DisplayName("PATCH /api/tables/{id}/status - update status")
    void testUpdateTableStatus() throws Exception {
        TableEntity t1 = new TableEntity(restaurantId, "T1", 4, "available");
        t1 = tableRepository.save(t1);

        mockMvc.perform(patch("/api/tables/" + t1.getId() + "/status")
                        .param("status", "occupied")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("occupied"));
    }

    @Test
    @DisplayName("DELETE /api/tables/{id} - soft delete table")
    void testDeleteTable() throws Exception {
        TableEntity t1 = new TableEntity(restaurantId, "T1", 4, "available");
        t1 = tableRepository.save(t1);

        mockMvc.perform(delete("/api/tables/" + t1.getId())
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        TableEntity refreshed = tableRepository.findById(t1.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertFalse(refreshed.getIsActive());
    }

    @Test
    @DisplayName("POST /api/tables - unauthorized request without token is rejected")
    void testCreateTableUnauthorized() throws Exception {
        TableRequest request = new TableRequest("T7", 2, "available", null, true);

        mockMvc.perform(post("/api/tables")
                        .param("restaurantId", restaurantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
