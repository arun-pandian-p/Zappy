package com.zappy.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.zappy.dto.restaurant.RestaurantProfileResponse;
import com.zappy.dto.restaurant.RestaurantUpdateRequest;
import com.zappy.exception.ResourceNotFoundException;
import com.zappy.exception.UnauthorizedException;
import com.zappy.model.entity.RestaurantEntity;
import com.zappy.model.enums.AppRole;
import com.zappy.repository.RestaurantRepository;
import com.zappy.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RestaurantServiceTest {

    @Mock
    private RestaurantRepository restaurantRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private RestaurantService restaurantService;

    private UUID restaurantId;
    private UUID otherRestaurantId;
    private RestaurantEntity restaurant;
    private UserPrincipal adminPrincipal;
    private UserPrincipal otherAdminPrincipal;
    private UserPrincipal waiterPrincipal;
    private UserPrincipal superAdminPrincipal;

    @BeforeEach
    void setUp() {
        restaurantId = UUID.randomUUID();
        otherRestaurantId = UUID.randomUUID();

        restaurant = new RestaurantEntity();
        restaurant.setId(restaurantId);
        restaurant.setName("Bella Italia");
        restaurant.setSlug("bella-italia");
        restaurant.setCurrency("INR");
        restaurant.setTaxRate(BigDecimal.valueOf(5.00));

        adminPrincipal = new UserPrincipal(UUID.randomUUID(), "admin@bella.com", "pass", AppRole.restaurant_admin, restaurantId);
        otherAdminPrincipal = new UserPrincipal(UUID.randomUUID(), "other@other.com", "pass", AppRole.restaurant_admin, otherRestaurantId);
        waiterPrincipal = new UserPrincipal(UUID.randomUUID(), "waiter@bella.com", "pass", AppRole.waiter_staff, restaurantId);
        superAdminPrincipal = new UserPrincipal(UUID.randomUUID(), "super@zappy.com", "pass", AppRole.super_admin, null);
    }

    @Test
    @DisplayName("Admin can retrieve their assigned restaurant profile")
    void testGetRestaurantByIdSuccess() {
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

        RestaurantProfileResponse response = restaurantService.getRestaurantById(restaurantId, adminPrincipal);

        assertNotNull(response);
        assertEquals("Bella Italia", response.name());
        assertEquals("INR", response.currency());
    }

    @Test
    @DisplayName("Tenant isolation: User cannot access another restaurant's settings")
    void testTenantIsolationCrossTenantAccessBlocked() {
        assertThrows(UnauthorizedException.class, () ->
                restaurantService.getRestaurantById(restaurantId, otherAdminPrincipal));
    }

    @Test
    @DisplayName("Super admin can access any restaurant's profile")
    void testSuperAdminAccessAllowed() {
        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));

        RestaurantProfileResponse response = restaurantService.getRestaurantById(restaurantId, superAdminPrincipal);

        assertNotNull(response);
        assertEquals("Bella Italia", response.name());
    }

    @Test
    @DisplayName("Admin can update restaurant details and settings")
    void testUpdateRestaurantSuccess() {
        RestaurantUpdateRequest request = new RestaurantUpdateRequest(
                "Bella Italia Bistro",
                "bella-italia-bistro",
                "Updated description",
                null, null, null, null, null,
                "123 Main St", "+91 9876543210", "contact@bella.com",
                "https://g.page/review",
                BigDecimal.valueOf(18.00), BigDecimal.valueOf(2.50), "USD",
                "#FF5722", "#4CAF50", "Roboto", true,
                "{\"country\":\"India\"}",
                "{\"type\":\"bluetooth\",\"auto_print_billing\":true}",
                "{\"enabled\":true}",
                "{\"preset\":\"dark\"}",
                "{}"
        );

        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(restaurantRepository.save(any(RestaurantEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RestaurantProfileResponse response = restaurantService.updateRestaurant(restaurantId, request, adminPrincipal);

        assertNotNull(response);
        assertEquals("Bella Italia Bistro", response.name());
        assertEquals("USD", response.currency());
        assertEquals(BigDecimal.valueOf(18.00), response.tax_rate());
        verify(restaurantRepository).save(restaurant);
    }

    @Test
    @DisplayName("Role enforcement: Waiter role cannot modify restaurant settings")
    void testWaiterCannotUpdateRestaurantSettings() {
        RestaurantUpdateRequest request = new RestaurantUpdateRequest(
                "Hacked Name", null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null
        );

        assertThrows(UnauthorizedException.class, () ->
                restaurantService.updateRestaurant(restaurantId, request, waiterPrincipal));
    }

    @Test
    @DisplayName("Logo upload stores file and updates restaurant logo_url")
    void testUploadLogoSuccess() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "logo.png", "image/png", "fake-image-bytes".getBytes()
        );

        when(restaurantRepository.findById(restaurantId)).thenReturn(Optional.of(restaurant));
        when(fileStorageService.store(file)).thenReturn("/zappy-uploads/mock-logo.png");
        when(restaurantRepository.save(any(RestaurantEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RestaurantProfileResponse response = restaurantService.uploadLogo(restaurantId, file, adminPrincipal);

        assertNotNull(response);
        assertEquals("/zappy-uploads/mock-logo.png", response.logo_url());
        verify(fileStorageService).store(file);
        verify(restaurantRepository).save(restaurant);
    }
}

