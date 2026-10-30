package com.zappy.service;

import com.zappy.dto.menu.CategoryReorderRequest;
import com.zappy.dto.menu.CategoryRequest;
import com.zappy.dto.menu.CategoryResponse;
import com.zappy.exception.UnauthorizedException;
import com.zappy.model.entity.CategoryEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.CategoryRepository;
import com.zappy.repository.MenuItemRepository;
import com.zappy.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private MenuItemRepository menuItemRepository;

    @InjectMocks
    private CategoryService categoryService;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private UserPrincipal adminPrincipal;
    private UserPrincipal superAdminPrincipal;

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

        superAdminPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "super@zappy.com",
                "hashed",
                AppRole.super_admin,
                null
        );
    }

    @Test
    @DisplayName("Should retrieve categories for a restaurant")
    void getCategories_success() {
        CategoryEntity c1 = new CategoryEntity(restaurantId, "Starters", "Tasty starters", null, 1);
        CategoryEntity c2 = new CategoryEntity(restaurantId, "Mains", "Hearty mains", null, 2);

        when(categoryRepository.findByRestaurantIdOrderByDisplayOrderAsc(restaurantId))
                .thenReturn(List.of(c1, c2));

        List<CategoryResponse> result = categoryService.getCategoriesByRestaurant(restaurantId);

        assertEquals(2, result.size());
        assertEquals("Starters", result.get(0).name());
        assertEquals("Mains", result.get(1).name());
    }

    @Test
    @DisplayName("Should successfully create a category for tenant restaurant")
    void createCategory_success() {
        CategoryRequest req = new CategoryRequest("Beverages", "Chilled drinks", "http://img.png", 3, true);
        CategoryEntity entity = new CategoryEntity(restaurantId, "Beverages", "Chilled drinks", "http://img.png", 3);

        when(categoryRepository.save(any(CategoryEntity.class))).thenReturn(entity);

        CategoryResponse res = categoryService.createCategory(restaurantId, req, adminPrincipal);

        assertNotNull(res);
        assertEquals("Beverages", res.name());
        assertEquals(3, res.display_order());
        verify(categoryRepository).save(any(CategoryEntity.class));
    }

    @Test
    @DisplayName("Should reject category creation across different tenant")
    void createCategory_tenantMismatch_throwsUnauthorized() {
        CategoryRequest req = new CategoryRequest("Beverages", "Chilled drinks", null, 3, true);

        assertThrows(UnauthorizedException.class, () ->
                categoryService.createCategory(otherRestaurantId, req, adminPrincipal));

        verify(categoryRepository, never()).save(any());
    }

    @Test
    @DisplayName("Super admin can create category for any restaurant")
    void createCategory_superAdmin_success() {
        CategoryRequest req = new CategoryRequest("Desserts", "Sweet treats", null, 4, true);
        CategoryEntity entity = new CategoryEntity(otherRestaurantId, "Desserts", "Sweet treats", null, 4);

        when(categoryRepository.save(any(CategoryEntity.class))).thenReturn(entity);

        CategoryResponse res = categoryService.createCategory(otherRestaurantId, req, superAdminPrincipal);

        assertNotNull(res);
        assertEquals("Desserts", res.name());
        verify(categoryRepository).save(any(CategoryEntity.class));
    }

    @Test
    @DisplayName("Should safely delete category and detach existing menu items")
    void deleteCategory_success() {
        UUID catId = UUID.randomUUID();
        CategoryEntity entity = new CategoryEntity(restaurantId, "Soups", null, null, 1);
        entity.setId(catId);

        when(categoryRepository.findById(catId)).thenReturn(Optional.of(entity));

        categoryService.deleteCategory(catId, adminPrincipal);

        verify(menuItemRepository).detachCategoryFromItems(catId);
        verify(categoryRepository).delete(entity);
    }

    @Test
    @DisplayName("Should reorder categories successfully")
    void reorderCategories_success() {
        UUID c1Id = UUID.randomUUID();
        UUID c2Id = UUID.randomUUID();

        CategoryEntity c1 = new CategoryEntity(restaurantId, "C1", null, null, 1);
        c1.setId(c1Id);
        CategoryEntity c2 = new CategoryEntity(restaurantId, "C2", null, null, 2);
        c2.setId(c2Id);

        when(categoryRepository.findByIdAndRestaurantId(c1Id, restaurantId)).thenReturn(Optional.of(c1));
        when(categoryRepository.findByIdAndRestaurantId(c2Id, restaurantId)).thenReturn(Optional.of(c2));

        CategoryReorderRequest req = new CategoryReorderRequest(List.of(
                new CategoryReorderRequest.CategoryOrderItem(c1Id, 2),
                new CategoryReorderRequest.CategoryOrderItem(c2Id, 1)
        ));

        categoryService.reorderCategories(restaurantId, req, adminPrincipal);

        assertEquals(2, c1.getDisplayOrder());
        assertEquals(1, c2.getDisplayOrder());
        verify(categoryRepository, times(2)).save(any(CategoryEntity.class));
    }
}

