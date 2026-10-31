package com.zappy.service;

import com.zappy.dto.waiter.CreateWaiterCallRequest;
import com.zappy.dto.waiter.WaiterCallResponse;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.model.entity.WaiterCallEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.TableRepository;
import com.zappy.repository.WaiterCallRepository;
import com.zappy.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class WaiterService {

    private static final Logger log = LoggerFactory.getLogger(WaiterService.class);

    private final WaiterCallRepository waiterCallRepository;
    private final TableRepository tableRepository;

    public WaiterService(WaiterCallRepository waiterCallRepository, TableRepository tableRepository) {
        this.waiterCallRepository = waiterCallRepository;
        this.tableRepository = tableRepository;
    }

    public WaiterCallResponse createCall(UUID restaurantId, CreateWaiterCallRequest request) {
        // Validate table exists
        tableRepository.findByIdAndRestaurantId(request.table_id(), restaurantId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found for restaurant: " + request.table_id()));

        WaiterCallEntity call = new WaiterCallEntity(restaurantId, request.table_id(), request.reason());
        WaiterCallEntity saved = waiterCallRepository.save(call);

        log.info("Waiter call #{} created for table {} in restaurant {}", 
                saved.getId(), saved.getTableId(), restaurantId);

        return WaiterCallResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<WaiterCallResponse> getCalls(UUID restaurantId, String status, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);

        List<WaiterCallEntity> calls;
        if (status != null && !status.isBlank()) {
            calls = waiterCallRepository.findByRestaurantIdAndStatusOrderByCreatedAtDesc(restaurantId, status);
        } else {
            calls = waiterCallRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurantId);
        }

        return calls.stream().map(WaiterCallResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<WaiterCallResponse> getActiveCallsForTable(UUID restaurantId, UUID tableId) {
        return waiterCallRepository.findByRestaurantIdAndTableIdAndStatusNotOrderByCreatedAtDesc(
                restaurantId, tableId, "resolved"
        ).stream().map(WaiterCallResponse::fromEntity).toList();
    }

    public WaiterCallResponse acknowledgeCall(UUID id, UUID userId, UserPrincipal principal) {
        WaiterCallEntity call = waiterCallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waiter call not found with id: " + id));

        validateTenantAccess(call.getRestaurantId(), principal);

        call.setStatus("acknowledged");
        call.setRespondedBy(userId != null ? userId : (principal != null ? principal.getId() : null));
        call.setRespondedAt(Instant.now());

        WaiterCallEntity saved = waiterCallRepository.save(call);
        log.info("Waiter call #{} acknowledged by {}", id, call.getRespondedBy());

        return WaiterCallResponse.fromEntity(saved);
    }

    public WaiterCallResponse resolveCall(UUID id, UserPrincipal principal) {
        WaiterCallEntity call = waiterCallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Waiter call not found with id: " + id));

        validateTenantAccess(call.getRestaurantId(), principal);

        call.setStatus("resolved");
        call.setRespondedAt(Instant.now());

        WaiterCallEntity saved = waiterCallRepository.save(call);
        log.info("Waiter call #{} resolved", id);

        return WaiterCallResponse.fromEntity(saved);
    }

    private void validateTenantAccess(UUID targetRestaurantId, UserPrincipal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        if (principal.getRole() == AppRole.super_admin) {
            return;
        }
        if (principal.getRestaurantId() == null || !principal.getRestaurantId().equals(targetRestaurantId)) {
            throw new AccessDeniedException("Access denied: You do not have permission for this restaurant");
        }
    }
}
