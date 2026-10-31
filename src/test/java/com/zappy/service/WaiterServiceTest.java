package com.zappy.service;

import com.zappy.dto.waiter.CreateWaiterCallRequest;
import com.zappy.dto.waiter.WaiterCallResponse;
import com.zappy.model.entity.TableEntity;
import com.zappy.model.entity.WaiterCallEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.TableRepository;
import com.zappy.repository.WaiterCallRepository;
import com.zappy.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaiterServiceTest {

    @Mock
    private WaiterCallRepository waiterCallRepository;

    @Mock
    private TableRepository tableRepository;

    @InjectMocks
    private WaiterService waiterService;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private UUID tableId;
    private UserPrincipal waiterPrincipal;
    private UserPrincipal unauthorizedPrincipal;
    private TableEntity table;
    private WaiterCallEntity call;

    @BeforeEach
    void setUp() {
        restaurantId = UUID.randomUUID();
        otherRestaurantId = UUID.randomUUID();
        tableId = UUID.randomUUID();

        waiterPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "waiter@zappy.com",
                "pwd",
                AppRole.waiter,
                restaurantId
        );

        unauthorizedPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "other@zappy.com",
                "pwd",
                AppRole.waiter,
                otherRestaurantId
        );

        table = new TableEntity(restaurantId, "T1", 4, "available");
        table.setId(tableId);

        call = new WaiterCallEntity(restaurantId, tableId, "Request Water");
        call.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Should create waiter call for existing table")
    void testCreateCall() {
        when(tableRepository.findByIdAndRestaurantId(tableId, restaurantId)).thenReturn(Optional.of(table));
        when(waiterCallRepository.save(any(WaiterCallEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CreateWaiterCallRequest req = new CreateWaiterCallRequest(restaurantId, tableId, "Request Water");
        WaiterCallResponse res = waiterService.createCall(restaurantId, req);

        assertNotNull(res);
        assertEquals("Request Water", res.reason());
        assertEquals("pending", res.status());
    }

    @Test
    @DisplayName("Should retrieve waiter calls filtered by status")
    void testGetCalls() {
        when(waiterCallRepository.findByRestaurantIdAndStatusOrderByCreatedAtDesc(restaurantId, "pending"))
                .thenReturn(List.of(call));

        List<WaiterCallResponse> res = waiterService.getCalls(restaurantId, "pending", waiterPrincipal);

        assertEquals(1, res.size());
        assertEquals("Request Water", res.get(0).reason());
    }

    @Test
    @DisplayName("Should acknowledge waiter call")
    void testAcknowledgeCall() {
        when(waiterCallRepository.findById(call.getId())).thenReturn(Optional.of(call));
        when(waiterCallRepository.save(any(WaiterCallEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WaiterCallResponse res = waiterService.acknowledgeCall(call.getId(), waiterPrincipal.getId(), waiterPrincipal);

        assertEquals("acknowledged", res.status());
        assertEquals(waiterPrincipal.getId(), res.responded_by());
        assertNotNull(res.responded_at());
    }

    @Test
    @DisplayName("Should resolve waiter call")
    void testResolveCall() {
        when(waiterCallRepository.findById(call.getId())).thenReturn(Optional.of(call));
        when(waiterCallRepository.save(any(WaiterCallEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WaiterCallResponse res = waiterService.resolveCall(call.getId(), waiterPrincipal);

        assertEquals("resolved", res.status());
        assertNotNull(res.responded_at());
    }

    @Test
    @DisplayName("Should reject staff action for different restaurant")
    void testTenantAccessDenied() {
        when(waiterCallRepository.findById(call.getId())).thenReturn(Optional.of(call));

        assertThrows(AccessDeniedException.class, () ->
                waiterService.resolveCall(call.getId(), unauthorizedPrincipal)
        );
    }
}
