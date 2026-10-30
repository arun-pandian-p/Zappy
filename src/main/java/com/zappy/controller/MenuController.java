package com.zappy.controller;

import com.zappy.dto.auth.GenericResponse;
import com.zappy.dto.menu.MenuItemRequest;
import com.zappy.dto.menu.MenuItemResponse;
import com.zappy.security.UserPrincipal;
import com.zappy.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/menu-items")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<MenuItemResponse>> getMenuItems(
            @PathVariable UUID restaurantId,
            @RequestParam(required = false) UUID categoryId) {
        List<MenuItemResponse> items = menuService.getMenuItemsByRestaurant(restaurantId, categoryId);
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemResponse> getMenuItemById(
            @PathVariable UUID id,
            @RequestParam UUID restaurantId) {
        MenuItemResponse item = menuService.getMenuItemById(id, restaurantId);
        return ResponseEntity.ok(item);
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<MenuItemResponse> createMenuItem(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody MenuItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        MenuItemResponse created = menuService.createMenuItem(restaurantId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MenuItemResponse> updateMenuItem(
            @PathVariable UUID id,
            @Valid @RequestBody MenuItemRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        MenuItemResponse updated = menuService.updateMenuItem(id, request, principal);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<MenuItemResponse> toggleAvailability(
            @PathVariable UUID id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserPrincipal principal) {
        boolean isAvailable = body.getOrDefault("is_available", true);
        MenuItemResponse updated = menuService.toggleAvailability(id, isAvailable, principal);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deleteMenuItem(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        menuService.deleteMenuItem(id, principal);
        return ResponseEntity.ok(GenericResponse.ok("Menu item deleted successfully."));
    }
}

