package com.zappy.service;

import com.zappy.dto.menu.MenuItemRequest;
import com.zappy.dto.menu.MenuItemResponse;
import com.zappy.exception.UnauthorizedException;
import com.zappy.model.entity.CategoryEntity;
import com.zappy.model.entity.MenuItemEntity;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private MenuService menuService;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private UserPrincipal adminPrincipal;
    private UserPrincipal waiterPrincipal;

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

        waiterPrincipal = new UserPrincipal(
                UUID.randomUUID(),
                "waiter@zappy.com",
                "hashed",
                AppRole.waiter_staff,
                restaurantId
        );
    }

    @Test
    @DisplayName("Should retrieve menu items for a restaurant")
    void getMenuItems_success() {
        MenuItemEntity item1 = new MenuItemEntity(restaurantId, null, "Butter Chicken", BigDecimal.valueOf(250.00));
        MenuItemEntity item2 = new MenuItemEntity(restaurantId, null, "Garlic Naan", BigDecimal.valueOf(60.00));

        when(menuItemRepository.findByRestaurantIdOrderByDisplayOrderAsc(restaurantId))
                .thenReturn(List.of(item1, item2));

        List<MenuItemResponse> result = menuService.getMenuItemsByRestaurant(restaurantId, null);

        assertEquals(2, result.size());
        assertEquals("Butter Chicken", result.get(0).name());
        assertEquals(BigDecimal.valueOf(250.00), result.get(0).price());
    }

    @Test
    @DisplayName("Should create menu item with category reference")
    void createMenuItem_success() {
        UUID catId = UUID.randomUUID();
        CategoryEntity category = new CategoryEntity(restaurantId, "Curries", null, null, 1);
        category.setId(catId);

        MenuItemRequest req = new MenuItemRequest(
                catId, "Paneer Tikka", "Spiced grilled cottage cheese",
                BigDecimal.valueOf(180.00), "http://paneer.jpg",
                true, false, 2, true, true, 20, 1, "tandoor"
        );

        MenuItemEntity entity = new MenuItemEntity(restaurantId, catId, "Paneer Tikka", BigDecimal.valueOf(180.00));
        entity.setCategory(category);

        when(categoryRepository.findByIdAndRestaurantId(catId, restaurantId)).thenReturn(Optional.of(category));
        when(menuItemRepository.save(any(MenuItemEntity.class))).thenReturn(entity);

        MenuItemResponse res = menuService.createMenuItem(restaurantId, req, adminPrincipal);

        assertNotNull(res);
        assertEquals("Paneer Tikka", res.name());
        verify(menuItemRepository).save(any(MenuItemEntity.class));
    }

    @Test
    @DisplayName("Should reject menu item creation for another restaurant")
    void createMenuItem_tenantMismatch_throwsUnauthorized() {
        MenuItemRequest req = new MenuItemRequest(
                null, "Samosa", null, BigDecimal.valueOf(40.00),
                null, true, true, 1, false, true, 10, 1, "kitchen"
        );

        assertThrows(UnauthorizedException.class, () ->
                menuService.createMenuItem(otherRestaurantId, req, adminPrincipal));

        verify(menuItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Waiter role cannot create menu items")
    void createMenuItem_waiterRole_throwsUnauthorized() {
        MenuItemRequest req = new MenuItemRequest(
                null, "Lassi", null, BigDecimal.valueOf(70.00),
                null, true, false, 0, false, true, 5, 1, "bar"
        );

        assertThrows(UnauthorizedException.class, () ->
                menuService.createMenuItem(restaurantId, req, waiterPrincipal));

        verify(menuItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should toggle menu item availability")
    void toggleAvailability_success() {
        UUID itemId = UUID.randomUUID();
        MenuItemEntity item = new MenuItemEntity(restaurantId, null, "Biryani", BigDecimal.valueOf(220.00));
        item.setId(itemId);
        item.setIsAvailable(true);

        when(menuItemRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(menuItemRepository.save(any(MenuItemEntity.class))).thenReturn(item);

        MenuItemResponse res = menuService.toggleAvailability(itemId, false, adminPrincipal);

        assertNotNull(res);
        assertFalse(item.getIsAvailable());
        verify(menuItemRepository).save(item);
    }

    @Test
    @DisplayName("Should delete menu item")
    void deleteMenuItem_success() {
        UUID itemId = UUID.randomUUID();
        MenuItemEntity item = new MenuItemEntity(restaurantId, null, "Salad", BigDecimal.valueOf(90.00));
        item.setId(itemId);

        when(menuItemRepository.findById(itemId)).thenReturn(Optional.of(item));

        menuService.deleteMenuItem(itemId, adminPrincipal);

        verify(menuItemRepository).delete(item);
    }
}

