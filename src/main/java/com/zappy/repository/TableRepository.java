package com.zappy.repository;

import com.zappy.model.entity.TableEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TableRepository extends JpaRepository<TableEntity, UUID> {

    List<TableEntity> findByRestaurantIdAndIsActiveTrueOrderByTableNumberAsc(UUID restaurantId);

    Optional<TableEntity> findByIdAndRestaurantId(UUID id, UUID restaurantId);

    Optional<TableEntity> findByRestaurantIdAndTableNumberIgnoreCaseAndIsActiveTrue(UUID restaurantId, String tableNumber);

    Optional<TableEntity> findByRestaurantIdAndTableNumber(UUID restaurantId, String tableNumber);

    long countByRestaurantIdAndIsActiveTrue(UUID restaurantId);
}
