package com.zappy.service;

import com.zappy.dto.table.TableRequest;
import com.zappy.dto.table.TableResponse;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.model.entity.TableEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.TableRepository;
import com.zappy.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class TableService {

    private static final Logger log = LoggerFactory.getLogger(TableService.class);

    private final TableRepository tableRepository;

    public TableService(TableRepository tableRepository) {
        this.tableRepository = tableRepository;
    }

    @Transactional(readOnly = true)
    public List<TableResponse> getTablesByRestaurant(UUID restaurantId) {
        return tableRepository.findByRestaurantIdAndIsActiveTrueOrderByTableNumberAsc(restaurantId)
                .stream()
                .map(TableResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public TableResponse getTableById(UUID id) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));
        return TableResponse.fromEntity(table);
    }

    @Transactional(readOnly = true)
    public TableResponse getTableByNumber(UUID restaurantId, String tableNumber) {
        TableEntity table = tableRepository.findByRestaurantIdAndTableNumberIgnoreCaseAndIsActiveTrue(restaurantId, tableNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found: " + tableNumber));
        return TableResponse.fromEntity(table);
    }

    public TableResponse createOrUpsertTable(UUID restaurantId, TableRequest request, UserPrincipal principal) {
        validateTenantAccess(restaurantId, principal);

        // Check if table with same table_number exists for this restaurant
        Optional<TableEntity> existingOpt = tableRepository.findByRestaurantIdAndTableNumber(restaurantId, request.table_number());

        TableEntity table;
        if (existingOpt.isPresent()) {
            table = existingOpt.get();
            table.setIsActive(request.is_active() != null ? request.is_active() : true);
            table.setDeletedAt(null);
            if (request.capacity() != null) {
                table.setCapacity(request.capacity());
            }
            if (request.status() != null && !request.status().isBlank()) {
                table.setStatus(request.status());
            }
            if (request.qr_code_url() != null) {
                table.setQrCodeUrl(request.qr_code_url());
            }
            log.info("Reactivated/updated existing table '{}' ({}) for restaurant {}", 
                    table.getTableNumber(), table.getId(), restaurantId);
        } else {
            table = new TableEntity();
            table.setId(UUID.randomUUID());
            table.setRestaurantId(restaurantId);
            table.setTableNumber(request.table_number());
            table.setCapacity(request.capacity() != null ? request.capacity() : 4);
            table.setStatus(request.status() != null && !request.status().isBlank() ? request.status() : "available");
            table.setQrCodeUrl(request.qr_code_url());
            table.setIsActive(request.is_active() != null ? request.is_active() : true);
            table.setCreatedAt(Instant.now());
            table.setUpdatedAt(Instant.now());
            log.info("Created new table '{}' ({}) for restaurant {}", 
                    table.getTableNumber(), table.getId(), restaurantId);
        }

        TableEntity saved = tableRepository.save(table);
        return TableResponse.fromEntity(saved);
    }

    public TableResponse updateTable(UUID id, TableRequest request, UserPrincipal principal) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));

        validateTenantAccess(table.getRestaurantId(), principal);

        if (request.table_number() != null && !request.table_number().isBlank()) {
            table.setTableNumber(request.table_number());
        }
        if (request.capacity() != null) {
            table.setCapacity(request.capacity());
        }
        if (request.status() != null && !request.status().isBlank()) {
            table.setStatus(request.status());
        }
        if (request.qr_code_url() != null) {
            table.setQrCodeUrl(request.qr_code_url());
        }
        if (request.is_active() != null) {
            table.setIsActive(request.is_active());
            if (!request.is_active() && table.getDeletedAt() == null) {
                table.setDeletedAt(Instant.now());
            } else if (request.is_active()) {
                table.setDeletedAt(null);
            }
        }

        table.setUpdatedAt(Instant.now());
        TableEntity saved = tableRepository.save(table);
        log.info("Updated table '{}' ({}) for restaurant {}", 
                saved.getTableNumber(), saved.getId(), saved.getRestaurantId());
        return TableResponse.fromEntity(saved);
    }

    public TableResponse updateTableStatus(UUID id, String status, UserPrincipal principal) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));

        validateTenantAccess(table.getRestaurantId(), principal);

        table.setStatus(status);
        table.setUpdatedAt(Instant.now());
        TableEntity saved = tableRepository.save(table);
        log.info("Updated status of table '{}' ({}) to '{}'", 
                saved.getTableNumber(), saved.getId(), status);
        return TableResponse.fromEntity(saved);
    }

    public void deleteTable(UUID id, UserPrincipal principal) {
        TableEntity table = tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));

        validateTenantAccess(table.getRestaurantId(), principal);

        table.setIsActive(false);
        table.setDeletedAt(Instant.now());
        table.setUpdatedAt(Instant.now());
        tableRepository.save(table);
        log.info("Soft-deleted table '{}' ({}) for restaurant {}", 
                table.getTableNumber(), table.getId(), table.getRestaurantId());
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

