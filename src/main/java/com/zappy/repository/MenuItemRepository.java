package com.zappy.repository;

import com.zappy.model.entity.MenuItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItemEntity, UUID> {

    List<MenuItemEntity> findByRestaurantIdOrderByDisplayOrderAsc(UUID restaurantId);

    List<MenuItemEntity> findByRestaurantIdAndCategoryIdOrderByDisplayOrderAsc(UUID restaurantId, UUID categoryId);

    Optional<MenuItemEntity> findByIdAndRestaurantId(UUID id, UUID restaurantId);

    long countByCategoryId(UUID categoryId);

    @Modifying
    @Query("UPDATE MenuItemEntity m SET m.categoryId = NULL WHERE m.categoryId = :categoryId")
    void detachCategoryFromItems(@Param("categoryId") UUID categoryId);
}

