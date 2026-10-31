package com.zappy.repository;

import com.zappy.model.entity.WaiterCallEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WaiterCallRepository extends JpaRepository<WaiterCallEntity, UUID> {

    List<WaiterCallEntity> findByRestaurantIdOrderByCreatedAtDesc(UUID restaurantId);

    List<WaiterCallEntity> findByRestaurantIdAndStatusOrderByCreatedAtDesc(UUID restaurantId, String status);

    List<WaiterCallEntity> findByRestaurantIdAndTableIdAndStatusNotOrderByCreatedAtDesc(UUID restaurantId, UUID tableId, String status);
}
