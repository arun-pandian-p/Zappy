package com.zappy.service;

import com.zappy.dto.menu.CategoryReorderRequest;
import com.zappy.dto.menu.CategoryRequest;
import com.zappy.dto.menu.CategoryResponse;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.exception.UnauthorizedException;
import com.zappy.model.entity.CategoryEntity;
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
public class CategoryService {

    private static final Logger logger = LoggerFactory.getLogger(CategoryService.class);

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    public CategoryService(CategoryRepository categoryRepository, MenuItemRepository menuItemRepository) {
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getCategoriesByRestaurant(UUID restaurantId) {
        return categoryRepository.findByRestaurantIdOrderByDisplayOrderAsc(restaurantId)
                .stream()
                .filter(c -> c.getName() != null && !c.getName().trim().equalsIgnoreCase("uncategorized"))
                .map(CategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(UUID id, UUID restaurantId) {
        CategoryEntity entity = categoryRepository.findByIdAndRestaurantId(id, restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return CategoryResponse.fromEntity(entity);
    }

    @Transactional
    public CategoryResponse createCategory(UUID restaurantId, CategoryRequest request, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);

        CategoryEntity entity = new CategoryEntity(
                restaurantId,
                request.name().trim(),
                request.description(),
                request.image_url(),
                request.display_order() != null ? request.display_order() : 0
        );

        if (request.is_active() != null) {
            entity.setIsActive(request.is_active());
        }

        CategoryEntity saved = categoryRepository.save(entity);
        logger.info("Category '{}' ({}) created for restaurant {}", saved.getName(), saved.getId(), restaurantId);
        return CategoryResponse.fromEntity(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(UUID id, CategoryRequest request, UserPrincipal principal) {
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        validateTenantAccess(entity.getRestaurantId(), principal);

        if (request.name() != null && !request.name().isBlank()) {
            entity.setName(request.name().trim());
        }
        if (request.description() != null) {
            entity.setDescription(request.description());
        }
        if (request.image_url() != null) {
            entity.setImageUrl(request.image_url());
        }
        if (request.display_order() != null) {
            entity.setDisplayOrder(request.display_order());
        }
        if (request.is_active() != null) {
            entity.setIsActive(request.is_active());
        }

        CategoryEntity saved = categoryRepository.save(entity);
        logger.info("Category '{}' ({}) updated for restaurant {}", saved.getName(), saved.getId(), entity.getRestaurantId());
        return CategoryResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteCategory(UUID id, UserPrincipal principal) {
        CategoryEntity entity = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));

        validateTenantAccess(entity.getRestaurantId(), principal);

        // Safely detach items referencing this category to avoid foreign key violations
        menuItemRepository.detachCategoryFromItems(id);

        categoryRepository.delete(entity);
        logger.info("Category '{}' ({}) deleted from restaurant {}", entity.getName(), id, entity.getRestaurantId());
    }

    @Transactional
    public void reorderCategories(UUID restaurantId, CategoryReorderRequest request, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);

        if (request.items() != null) {
            for (CategoryReorderRequest.CategoryOrderItem item : request.items()) {
                categoryRepository.findByIdAndRestaurantId(item.id(), restaurantId)
                        .ifPresent(category -> {
                            category.setDisplayOrder(item.display_order());
                            categoryRepository.save(category);
                        });
            }
        }
        logger.info("Reordered {} categories for restaurant {}", request.items() != null ? request.items().size() : 0, restaurantId);
    }

    private void validateTenantAccess(UUID targetRestaurantId, UserPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("Authentication required.");
        }
        if (principal.getRole() == AppRole.super_admin) {
            return;
        }
        if (principal.getRole() != AppRole.restaurant_admin && principal.getRole() != AppRole.manager) {
            throw new UnauthorizedException("Access denied: You do not have permission to manage categories.");
        }
        if (principal.getRestaurantId() == null || !principal.getRestaurantId().equals(targetRestaurantId)) {
            throw new UnauthorizedException("Access denied: You do not have permission to manage this restaurant's categories.");
        }
    }
}

