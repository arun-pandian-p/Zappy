package com.zappy.controller;

import com.zappy.dto.table.TableRequest;
import com.zappy.dto.table.TableResponse;
import com.zappy.dto.table.TableStatusUpdateRequest;
import com.zappy.security.UserPrincipal;
import com.zappy.service.TableService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @GetMapping
    public ResponseEntity<List<TableResponse>> getTables(
            @RequestParam UUID restaurantId) {
        List<TableResponse> tables = tableService.getTablesByRestaurant(restaurantId);
        return ResponseEntity.ok(tables);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TableResponse> getTableById(@PathVariable UUID id) {
        TableResponse table = tableService.getTableById(id);
        return ResponseEntity.ok(table);
    }

    @GetMapping("/by-number")
    public ResponseEntity<TableResponse> getTableByNumber(
            @RequestParam UUID restaurantId,
            @RequestParam String tableNumber) {
        TableResponse table = tableService.getTableByNumber(restaurantId, tableNumber);
        return ResponseEntity.ok(table);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter')")
    public ResponseEntity<TableResponse> createTable(
            @RequestParam UUID restaurantId,
            @Valid @RequestBody TableRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TableResponse created = tableService.createOrUpsertTable(restaurantId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter')")
    public ResponseEntity<TableResponse> updateTable(
            @PathVariable UUID id,
            @Valid @RequestBody TableRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TableResponse updated = tableService.updateTable(id, request, principal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'cashier')")
    public ResponseEntity<TableResponse> updateTableStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            @AuthenticationPrincipal UserPrincipal principal) {
        TableResponse updated = tableService.updateTableStatus(id, status, principal);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager')")
    public ResponseEntity<Map<String, Object>> deleteTable(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        tableService.deleteTable(id, principal);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Table deleted successfully"
        ));
    }
}
