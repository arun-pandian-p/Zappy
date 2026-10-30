package com.zappy.repository;

import com.zappy.model.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {

    List<CategoryEntity> findByRestaurantIdOrderByDisplayOrderAsc(UUID restaurantId);

    List<CategoryEntity> findByRestaurantIdAndIsActiveTrueOrderByDisplayOrderAsc(UUID restaurantId);

    Optional<CategoryEntity> findByIdAndRestaurantId(UUID id, UUID restaurantId);

    boolean existsByRestaurantIdAndNameIgnoreCase(UUID restaurantId, String name);

    boolean existsByRestaurantIdAndNameIgnoreCaseAndIdNot(UUID restaurantId, String name, UUID id);
}

