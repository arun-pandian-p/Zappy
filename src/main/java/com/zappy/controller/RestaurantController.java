package com.zappy.controller;

import com.zappy.dto.restaurant.RestaurantOverviewStats;
import com.zappy.dto.restaurant.RestaurantProfileResponse;
import com.zappy.dto.restaurant.RestaurantUpdateRequest;
import com.zappy.security.UserPrincipal;
import com.zappy.service.RestaurantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<RestaurantProfileResponse> getRestaurantById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        RestaurantProfileResponse response = restaurantService.getRestaurantById(id, principal);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<RestaurantProfileResponse> getRestaurantBySlug(@PathVariable String slug) {
        RestaurantProfileResponse response = restaurantService.getRestaurantBySlug(slug);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RestaurantProfileResponse> updateRestaurant(
            @PathVariable UUID id,
            @Valid @RequestBody RestaurantUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        RestaurantProfileResponse response = restaurantService.updateRestaurant(id, request, principal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/logo")
    public ResponseEntity<RestaurantProfileResponse> uploadLogo(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        RestaurantProfileResponse response = restaurantService.uploadLogo(id, file, principal);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/overview-stats")
    public ResponseEntity<RestaurantOverviewStats> getOverviewStats(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        RestaurantOverviewStats stats = restaurantService.getOverviewStats(id, principal);
        return ResponseEntity.ok(stats);
    }
}

