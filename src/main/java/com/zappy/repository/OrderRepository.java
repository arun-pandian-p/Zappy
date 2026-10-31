package com.zappy.repository;

import com.zappy.model.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {

    List<OrderEntity> findByRestaurantIdOrderByCreatedAtDesc(UUID restaurantId);

    List<OrderEntity> findByRestaurantIdAndStatusOrderByCreatedAtDesc(UUID restaurantId, String status);

    List<OrderEntity> findByRestaurantIdAndStatusInOrderByCreatedAtDesc(UUID restaurantId, List<String> statuses);

    List<OrderEntity> findByRestaurantIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(UUID restaurantId, Instant since);

    Optional<OrderEntity> findByIdAndRestaurantId(UUID id, UUID restaurantId);

    @Query("SELECT COALESCE(MAX(o.orderNumber), 0) FROM OrderEntity o WHERE o.restaurantId = :restaurantId")
    Integer findMaxOrderNumberByRestaurantId(@Param("restaurantId") UUID restaurantId);

    long countByRestaurantIdAndCreatedAtGreaterThanEqual(UUID restaurantId, Instant since);
}

