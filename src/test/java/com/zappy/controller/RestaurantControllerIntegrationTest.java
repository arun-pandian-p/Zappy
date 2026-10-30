package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.restaurant.RestaurantUpdateRequest;
import com.zappy.model.entity.RestaurantEntity;
import com.zappy.model.entity.UserEntity;
import com.zappy.model.entity.UserRoleEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.RestaurantRepository;
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
import org.springframework.mock.web.MockMultipartFile;
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
class RestaurantControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private String adminToken;
    private String otherAdminToken;

    @BeforeEach
    void setUp() {
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
        restaurantRepository.deleteAll();

        restaurantId = UUID.randomUUID();
        otherRestaurantId = UUID.randomUUID();

        RestaurantEntity r1 = new RestaurantEntity();
        r1.setId(restaurantId);
        r1.setName("Bistro Zappy");
        r1.setSlug("bistro-zappy");
        r1.setCurrency("INR");
        r1 = restaurantRepository.save(r1);
        restaurantId = r1.getId();

        RestaurantEntity r2 = new RestaurantEntity();
        r2.setId(otherRestaurantId);
        r2.setName("Other Restaurant");
        r2.setSlug("other-restaurant");
        r2.setCurrency("USD");
        r2 = restaurantRepository.save(r2);
        otherRestaurantId = r2.getId();

        UUID user1Id = UUID.randomUUID();
        UserEntity u1 = new UserEntity(user1Id, "admin@bistro.com", "hash");
        userRepository.save(u1);
        userRoleRepository.save(new UserRoleEntity(user1Id, restaurantId, AppRole.restaurant_admin));

        UUID user2Id = UUID.randomUUID();
        UserEntity u2 = new UserEntity(user2Id, "admin@other.com", "hash");
        userRepository.save(u2);
        userRoleRepository.save(new UserRoleEntity(user2Id, otherRestaurantId, AppRole.restaurant_admin));

        adminToken = tokenProvider.generateAccessToken(new UserPrincipal(user1Id, "admin@bistro.com", "hash", AppRole.restaurant_admin, restaurantId));
        otherAdminToken = tokenProvider.generateAccessToken(new UserPrincipal(user2Id, "admin@other.com", "hash", AppRole.restaurant_admin, otherRestaurantId));
    }

    @Test
    @DisplayName("GET /api/restaurants/{id} - admin can access own restaurant")
    void testGetRestaurantSuccess() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(restaurantId.toString()))
                .andExpect(jsonPath("$.name").value("Bistro Zappy"));
    }

    @Test
    @DisplayName("GET /api/restaurants/{id} - cross-tenant access is rejected with 403 Forbidden")
    void testTenantIsolationGetBlocked() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId)
                        .header("Authorization", "Bearer " + otherAdminToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/restaurants/{id} - admin can update restaurant settings")
    void testUpdateRestaurantSuccess() throws Exception {
        RestaurantUpdateRequest update = new RestaurantUpdateRequest(
                "Bistro Zappy Deluxe",
                "bistro-zappy-deluxe",
                "Fine dining modernized",
                null, null, null, null, null,
                "456 Market St", "+91 9999988888", "hello@bistrozappy.com",
                "https://g.page/bistro",
                BigDecimal.valueOf(12.00), BigDecimal.valueOf(5.00), "INR",
                "#3B82F6", "#10B981", "Inter", true,
                "{\"country\":\"India\",\"city\":\"Mumbai\"}",
                "{\"type\":\"usb\",\"printer_ip\":\"192.168.1.100\"}",
                "{\"enabled\":true,\"threshold\":4}",
                "{\"preset\":\"premium\"}",
                "{}"
        );

        mockMvc.perform(put("/api/restaurants/" + restaurantId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bistro Zappy Deluxe"))
                .andExpect(jsonPath("$.tax_rate").value(12.00));
    }

    @Test
    @DisplayName("POST /api/restaurants/{id}/logo - logo upload succeeds")
    void testUploadLogoSuccess() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "logo.png", "image/png", "sample-logo-content".getBytes()
        );

        mockMvc.perform(multipart("/api/restaurants/" + restaurantId + "/logo")
                        .file(file)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logo_url").isNotEmpty());
    }

    @Test
    @DisplayName("GET /api/restaurants/{id}/overview-stats - returns overview KPIs")
    void testGetOverviewStats() throws Exception {
        mockMvc.perform(get("/api/restaurants/" + restaurantId + "/overview-stats")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOrdersToday").isNumber())
                .andExpect(jsonPath("$.totalRevenueToday").isNumber());
    }
}
