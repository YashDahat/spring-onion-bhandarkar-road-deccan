package com.webappfoundation.restaurant.dto;

import com.webappfoundation.dto.CatalogItemDto;
import com.webappfoundation.restaurant.model.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** Request/response shapes for the Spring Onion domain (menu, wok bar, favourites, bookings, story, passport, tracking). */
public final class RestaurantDtos {
    private RestaurantDtos() {}

    // ── Menu ──
    public record MenuItemDto(Long id, String name, String slug, String description, BigDecimal price,
                              Cuisine cuisine, Course course, DietType diet, int spiceLevel, boolean signature,
                              boolean passport, boolean jainOption, String imageUrl, boolean active, int sortOrder,
                              String workflowCode, Set<Long> branchIds) {}

    public record UpsertMenuItemRequest(String name, String description, BigDecimal price, Cuisine cuisine,
                                        Course course, DietType diet, Integer spiceLevel, Boolean signature,
                                        Boolean passport, Boolean jainOption, String imageUrl, Boolean active,
                                        Integer sortOrder, Set<Long> branchIds) {}

    // ── Wok bar ──
    public record WokOptionDto(Long id, WokGroup groupCode, String name, String description, BigDecimal price,
                               DietType diet, boolean active, int sortOrder) {}

    public record UpsertWokOptionRequest(WokGroup groupCode, String name, String description, BigDecimal price,
                                         DietType diet, Boolean active, Integer sortOrder) {}

    public record WokBuildRequest(Long baseId, Long proteinId, Long sauceId, List<Long> addOnIds, Integer spiceLevel) {}

    public record WokComboDto(Long id, String name, String summary, BigDecimal price, DietType diet, int spiceLevel,
                              Long baseId, Long proteinId, Long sauceId, List<Long> addOnIds) {}

    // ── Favourites ──
    public record FavouriteDto(Long id, String itemType, Long itemId, CatalogItemDto item, Instant createdAt) {}

    public record ToggleFavouriteRequest(String itemType, Long itemId) {}

    public record ToggleFavouriteResult(boolean favourited) {}

    // ── Table bookings ──
    public record SlotDto(String time, String label, String sitting, int seatsLeft, boolean available) {}

    public record CreateReservationRequest(LocalDate date, String time, Integer partySize, Occasion occasion,
                                           String note, String contactName, String contactPhone, Long branchId) {}

    public record ReservationDto(Long id, LocalDate date, String time, String timeLabel, int partySize,
                                 Occasion occasion, String note, String contactName, String contactPhone,
                                 Long branchId, Long orderId, String orderNumber, String statusCode,
                                 String statusLabel, boolean cancellable, Instant createdAt) {}

    // ── Story ──
    public record StoryChapterDto(Long id, String eyebrow, String title, String body, String imageUrl,
                                  int sortOrder, boolean active) {}

    public record UpsertStoryChapterRequest(String eyebrow, String title, String body, String imageUrl,
                                            Integer sortOrder, Boolean active) {}

    // ── Oriental Passport ──
    public record StampDto(Long itemId, String name, String slug, Cuisine cuisine, DietType diet, String imageUrl,
                           boolean stamped, Instant stampedAt) {}

    public record MilestoneDto(int at, boolean reached, boolean claimed, String offerCode) {}

    public record PassportDto(int stampedCount, int total, List<StampDto> stamps, List<MilestoneDto> milestones) {}

    public record ClaimMilestoneResult(int milestone, String offerCode, String message) {}

    // ── Live tracking ──
    public record TrackStepDto(String code, String label, String state, Instant enteredAt, Integer targetMinutes) {}

    public record TrackDto(Long orderId, String orderNumber, String workflowCode, String currentStageCode,
                           String currentStageLabel, boolean cancelled, boolean finished, String fulfillmentType,
                           String paymentState, BigDecimal total, List<TrackStepDto> steps, Instant createdAt) {}
}
