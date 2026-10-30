package com.zappy.service;

import com.zappy.dto.table.TableRequest;
import com.zappy.dto.table.TableResponse;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.model.entity.TableEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.TableRepository;
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
class TableServiceTest {

    @Mock
    private TableRepository tableRepository;

    @InjectMocks
    private TableService tableService;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private UserPrincipal adminPrincipal;
    private UserPrincipal unauthorizedPrincipal;
    private TableEntity testTable;

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
                "other@zappy.com",
                "hashed",
                AppRole.restaurant_admin,
                otherRestaurantId
        );

        testTable = new TableEntity(restaurantId, "T1", 4, "available");
        testTable.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Should retrieve active tables ordered by table number")
    void testGetTablesByRestaurant() {
        when(tableRepository.findByRestaurantIdAndIsActiveTrueOrderByTableNumberAsc(restaurantId))
                .thenReturn(List.of(testTable));

        List<TableResponse> result = tableService.getTablesByRestaurant(restaurantId);

        assertEquals(1, result.size());
        assertEquals("T1", result.get(0).table_number());
        assertEquals(4, result.get(0).capacity());
    }

    @Test
    @DisplayName("Should create a new table when table does not exist")
    void testCreateNewTable() {
        TableRequest request = new TableRequest("T2", 6, "available", "https://qr.test/t2", true);

        when(tableRepository.findByRestaurantIdAndTableNumber(restaurantId, "T2"))
                .thenReturn(Optional.empty());
        when(tableRepository.save(any(TableEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TableResponse response = tableService.createOrUpsertTable(restaurantId, request, adminPrincipal);

        assertNotNull(response);
        assertEquals("T2", response.table_number());
        assertEquals(6, response.capacity());
        verify(tableRepository, times(1)).save(any(TableEntity.class));
    }

    @Test
    @DisplayName("Should reactivate existing soft-deleted table on upsert")
    void testUpsertReactivateTable() {
        testTable.setIsActive(false);
        TableRequest request = new TableRequest("T1", 8, "available", null, true);

        when(tableRepository.findByRestaurantIdAndTableNumber(restaurantId, "T1"))
                .thenReturn(Optional.of(testTable));
        when(tableRepository.save(any(TableEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TableResponse response = tableService.createOrUpsertTable(restaurantId, request, adminPrincipal);

        assertNotNull(response);
        assertTrue(response.is_active());
        assertEquals(8, response.capacity());
    }

    @Test
    @DisplayName("Should update table status successfully")
    void testUpdateTableStatus() {
        when(tableRepository.findById(testTable.getId())).thenReturn(Optional.of(testTable));
        when(tableRepository.save(any(TableEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TableResponse response = tableService.updateTableStatus(testTable.getId(), "occupied", adminPrincipal);

        assertEquals("occupied", response.status());
    }

    @Test
    @DisplayName("Should soft-delete table")
    void testDeleteTable() {
        when(tableRepository.findById(testTable.getId())).thenReturn(Optional.of(testTable));

        tableService.deleteTable(testTable.getId(), adminPrincipal);

        assertFalse(testTable.getIsActive());
        assertNotNull(testTable.getDeletedAt());
        verify(tableRepository, times(1)).save(testTable);
    }

    @Test
    @DisplayName("Should reject table update if tenant does not match")
    void testTenantAccessDenied() {
        when(tableRepository.findById(testTable.getId())).thenReturn(Optional.of(testTable));

        TableRequest request = new TableRequest("T1", 6, "available", null, true);

        assertThrows(AccessDeniedException.class, () ->
                tableService.updateTable(testTable.getId(), request, unauthorizedPrincipal)
        );
    }
}
