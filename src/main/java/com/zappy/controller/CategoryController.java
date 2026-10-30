package com.zappy.controller;

import com.zappy.dto.auth.GenericResponse;
import com.zappy.dto.menu.CategoryReorderRequest;
import com.zappy.dto.menu.CategoryRequest;
import com.zappy.dto.menu.CategoryResponse;
import com.zappy.security.UserPrincipal;
import com.zappy.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<CategoryResponse>> getCategories(@PathVariable UUID restaurantId) {
        List<CategoryResponse> categories = categoryService.getCategoriesByRestaurant(restaurantId);
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryResponse> getCategoryById(
            @PathVariable UUID id,
            @RequestParam UUID restaurantId) {
        CategoryResponse category = categoryService.getCategoryById(id, restaurantId);
        return ResponseEntity.ok(category);
    }

    @PostMapping("/restaurant/{restaurantId}")
    public ResponseEntity<CategoryResponse> createCategory(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CategoryResponse created = categoryService.createCategory(restaurantId, request, principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        CategoryResponse updated = categoryService.updateCategory(id, request, principal);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<GenericResponse> deleteCategory(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        categoryService.deleteCategory(id, principal);
        return ResponseEntity.ok(GenericResponse.ok("Category deleted successfully."));
    }

    @PutMapping("/restaurant/{restaurantId}/reorder")
    public ResponseEntity<GenericResponse> reorderCategories(
            @PathVariable UUID restaurantId,
            @Valid @RequestBody CategoryReorderRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        categoryService.reorderCategories(restaurantId, request, principal);
        return ResponseEntity.ok(GenericResponse.ok("Categories reordered successfully."));
    }
}

