package com.zappy.service;

import com.zappy.dto.menu.MenuItemRequest;
import com.zappy.dto.menu.MenuItemResponse;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.exception.UnauthorizedException;
import com.zappy.model.entity.CategoryEntity;
import com.zappy.model.entity.MenuItemEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.CategoryRepository;
import com.zappy.repository.MenuItemRepository;
import com.zappy.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MenuService {

    private static final Logger logger = LoggerFactory.getLogger(MenuService.class);

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;

    public MenuService(MenuItemRepository menuItemRepository, CategoryRepository categoryRepository) {
        this.menuItemRepository = menuItemRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> getMenuItemsByRestaurant(UUID restaurantId, UUID categoryId) {
        List<MenuItemEntity> items;
        if (categoryId != null) {
            items = menuItemRepository.findByRestaurantIdAndCategoryIdOrderByDisplayOrderAsc(restaurantId, categoryId);
        } else {
            items = menuItemRepository.findByRestaurantIdOrderByDisplayOrderAsc(restaurantId);
        }

        return items.stream()
                .map(MenuItemResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MenuItemResponse getMenuItemById(UUID id, UUID restaurantId) {
        MenuItemEntity item = menuItemRepository.findByIdAndRestaurantId(id, restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
        return MenuItemResponse.fromEntity(item);
    }

    @Transactional
    public MenuItemResponse createMenuItem(UUID restaurantId, MenuItemRequest request, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);

        MenuItemEntity item = new MenuItemEntity(
                restaurantId,
                request.category_id(),
                request.name().trim(),
                request.price()
        );

        if (request.category_id() != null) {
            CategoryEntity category = categoryRepository.findByIdAndRestaurantId(request.category_id(), restaurantId)
                    .orElse(null);
            item.setCategory(category);
        }

        item.setDescription(request.description());
        item.setImageUrl(request.image_url());
        if (request.is_vegetarian() != null) item.setIsVegetarian(request.is_vegetarian());
        if (request.is_vegan() != null) item.setIsVegan(request.is_vegan());
        if (request.spicy_level() != null) item.setSpicyLevel(request.spicy_level());
        if (request.is_popular() != null) item.setIsPopular(request.is_popular());
        if (request.is_available() != null) item.setIsAvailable(request.is_available());
        if (request.prep_time_minutes() != null) item.setPrepTimeMinutes(request.prep_time_minutes());
        if (request.display_order() != null) item.setDisplayOrder(request.display_order());
        if (request.kitchen_station() != null) item.setKitchenStation(request.kitchen_station());

        MenuItemEntity saved = menuItemRepository.save(item);
        logger.info("Menu item '{}' ({}) created for restaurant {}", saved.getName(), saved.getId(), restaurantId);
        return MenuItemResponse.fromEntity(saved);
    }

    @Transactional
    public MenuItemResponse updateMenuItem(UUID id, MenuItemRequest request, UserPrincipal principal) {
        MenuItemEntity item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));

        validateTenantAccess(item.getRestaurantId(), principal);

        if (request.name() != null && !request.name().isBlank()) {
            item.setName(request.name().trim());
        }
        if (request.price() != null) {
            item.setPrice(request.price());
        }
        if (request.category_id() != null) {
            CategoryEntity category = categoryRepository.findByIdAndRestaurantId(request.category_id(), item.getRestaurantId())
                    .orElse(null);
            item.setCategory(category);
            item.setCategoryId(request.category_id());
        }
        if (request.description() != null) item.setDescription(request.description());
        if (request.image_url() != null) item.setImageUrl(request.image_url());
        if (request.is_vegetarian() != null) item.setIsVegetarian(request.is_vegetarian());
        if (request.is_vegan() != null) item.setIsVegan(request.is_vegan());
        if (request.spicy_level() != null) item.setSpicyLevel(request.spicy_level());
        if (request.is_popular() != null) item.setIsPopular(request.is_popular());
        if (request.is_available() != null) item.setIsAvailable(request.is_available());
        if (request.prep_time_minutes() != null) item.setPrepTimeMinutes(request.prep_time_minutes());
        if (request.display_order() != null) item.setDisplayOrder(request.display_order());
        if (request.kitchen_station() != null) item.setKitchenStation(request.kitchen_station());

        MenuItemEntity saved = menuItemRepository.save(item);
        logger.info("Menu item '{}' ({}) updated for restaurant {}", saved.getName(), saved.getId(), item.getRestaurantId());
        return MenuItemResponse.fromEntity(saved);
    }

    @Transactional
    public MenuItemResponse toggleAvailability(UUID id, boolean isAvailable, UserPrincipal principal) {
        MenuItemEntity item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));

        validateTenantAccess(item.getRestaurantId(), principal);

        item.setIsAvailable(isAvailable);
        MenuItemEntity saved = menuItemRepository.save(item);
        logger.info("Menu item '{}' ({}) availability set to {} for restaurant {}", saved.getName(), id, isAvailable, item.getRestaurantId());
        return MenuItemResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteMenuItem(UUID id, UserPrincipal principal) {
        MenuItemEntity item = menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));

        validateTenantAccess(item.getRestaurantId(), principal);

        menuItemRepository.delete(item);
        logger.info("Menu item '{}' ({}) deleted from restaurant {}", item.getName(), id, item.getRestaurantId());
    }

    private void validateTenantAccess(UUID targetRestaurantId, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Authentication required.");
        }
        if (principal.getRole() == AppRole.super_admin) {
            return;
        }
        if (principal.getRole() != AppRole.restaurant_admin && principal.getRole() != AppRole.manager) {
            throw new UnauthorizedException("Access denied: You do not have permission to manage menu items.");
        }
        if (principal.getRestaurantId() == null || !principal.getRestaurantId().equals(targetRestaurantId)) {
            throw new UnauthorizedException("Access denied: You do not have permission to manage this restaurant's menu items.");
        }
    }
}

