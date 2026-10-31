package com.zappy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.waiter.AcknowledgeWaiterCallRequest;
import com.zappy.dto.waiter.CreateWaiterCallRequest;
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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WaiterControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private WaiterCallRepository waiterCallRepository;

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
    private String waiterToken;
    private TableEntity table;

    @BeforeEach
    void setUp() {
        waiterCallRepository.deleteAll();
        tableRepository.deleteAll();
        userRoleRepository.deleteAll();
        userRepository.deleteAll();
        restaurantRepository.deleteAll();

        restaurantId = UUID.randomUUID();
        RestaurantEntity restaurant = new RestaurantEntity();
        restaurant.setId(restaurantId);
        restaurant.setName("Waiter Bistro");
        restaurant.setSlug("waiter-bistro-" + restaurantId.toString().substring(0, 8));
        restaurantRepository.save(restaurant);

        table = new TableEntity(restaurantId, "T1", 4, "available");
        table = tableRepository.save(table);

        UUID waiterId = UUID.randomUUID();
        UserEntity waiter = new UserEntity(waiterId, "waiter@bistro.com", "password123");
        userRepository.save(waiter);

        UserRoleEntity role = new UserRoleEntity(waiterId, restaurantId, AppRole.waiter);
        userRoleRepository.save(role);

        UserPrincipal waiterPrincipal = new UserPrincipal(
                waiterId,
                "waiter@bistro.com",
                "password123",
                AppRole.waiter,
                restaurantId
        );
        waiterToken = "Bearer " + jwtTokenProvider.generateAccessToken(waiterPrincipal);
    }

    @Test
    @DisplayName("POST /api/waiter/calls - public customer can create waiter call")
    void testCreateWaiterCallPublic() throws Exception {
        CreateWaiterCallRequest req = new CreateWaiterCallRequest(restaurantId, table.getId(), "Bring Menu");

        mockMvc.perform(post("/api/waiter/calls")
                        .param("restaurantId", restaurantId.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reason").value("Bring Menu"))
                .andExpect(jsonPath("$.status").value("pending"));
    }

    @Test
    @DisplayName("GET /api/waiter/calls - staff can retrieve calls")
    void testGetWaiterCallsStaff() throws Exception {
        WaiterCallEntity call = new WaiterCallEntity(restaurantId, table.getId(), "Water please");
        waiterCallRepository.save(call);

        mockMvc.perform(get("/api/waiter/calls")
                        .param("restaurantId", restaurantId.toString())
                        .header("Authorization", waiterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].reason").value("Water please"));
    }

    @Test
    @DisplayName("PATCH /api/waiter/calls/{id}/acknowledge - staff can acknowledge call")
    void testAcknowledgeCall() throws Exception {
        WaiterCallEntity call = new WaiterCallEntity(restaurantId, table.getId(), "Bill please");
        call = waiterCallRepository.save(call);

        AcknowledgeWaiterCallRequest req = new AcknowledgeWaiterCallRequest(null);

        mockMvc.perform(patch("/api/waiter/calls/" + call.getId() + "/acknowledge")
                        .header("Authorization", waiterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("acknowledged"));
    }

    @Test
    @DisplayName("PATCH /api/waiter/calls/{id}/resolve - staff can resolve call")
    void testResolveCall() throws Exception {
        WaiterCallEntity call = new WaiterCallEntity(restaurantId, table.getId(), "Assistance");
        call = waiterCallRepository.save(call);

        mockMvc.perform(patch("/api/waiter/calls/" + call.getId() + "/resolve")
                        .header("Authorization", waiterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("resolved"));
    }
}
