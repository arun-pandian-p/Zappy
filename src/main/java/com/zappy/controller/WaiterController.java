package com.zappy.controller;

import com.zappy.dto.waiter.AcknowledgeWaiterCallRequest;
import com.zappy.dto.waiter.CreateWaiterCallRequest;
import com.zappy.dto.waiter.WaiterCallResponse;
import com.zappy.security.UserPrincipal;
import com.zappy.service.WaiterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/waiter/calls")
public class WaiterController {

    private final WaiterService waiterService;

    public WaiterController(WaiterService waiterService) {
        this.waiterService = waiterService;
    }

    @PostMapping
    public ResponseEntity<WaiterCallResponse> createCall(
            @RequestParam UUID restaurantId,
            @Valid @RequestBody CreateWaiterCallRequest request) {
        WaiterCallResponse created = waiterService.createCall(restaurantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'cashier')")
    public ResponseEntity<List<WaiterCallResponse>> getCalls(
            @RequestParam UUID restaurantId,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<WaiterCallResponse> calls = waiterService.getCalls(restaurantId, status, principal);
        return ResponseEntity.ok(calls);
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<WaiterCallResponse>> getActiveCallsForTable(
            @PathVariable UUID tableId,
            @RequestParam UUID restaurantId) {
        List<WaiterCallResponse> calls = waiterService.getActiveCallsForTable(restaurantId, tableId);
        return ResponseEntity.ok(calls);
    }

    @PatchMapping("/{id}/acknowledge")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'cashier')")
    public ResponseEntity<WaiterCallResponse> acknowledgeCall(
            @PathVariable UUID id,
            @RequestBody(required = false) AcknowledgeWaiterCallRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = request != null ? request.userId() : null;
        WaiterCallResponse updated = waiterService.acknowledgeCall(id, userId, principal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('restaurant_admin', 'super_admin', 'manager', 'waiter', 'cashier')")
    public ResponseEntity<WaiterCallResponse> resolveCall(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        WaiterCallResponse updated = waiterService.resolveCall(id, principal);
        return ResponseEntity.ok(updated);
    }
}
