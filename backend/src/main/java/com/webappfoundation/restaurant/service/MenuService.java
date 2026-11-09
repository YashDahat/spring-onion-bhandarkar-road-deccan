package com.webappfoundation.restaurant.service;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.restaurant.RestaurantConstants;
import com.webappfoundation.restaurant.dto.RestaurantDtos.MenuItemDto;
import com.webappfoundation.restaurant.dto.RestaurantDtos.UpsertMenuItemRequest;
import com.webappfoundation.restaurant.model.*;
import com.webappfoundation.restaurant.repository.MenuItemRepository;
import com.webappfoundation.service.AuditActions;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static com.webappfoundation.restaurant.RestaurantUtil.*;

/** The digital menu: public browse (cuisine / diet / search / outlet filters) + admin CRUD and bulk import. */
@Service
public class MenuService {

    private final MenuItemRepository repository;
    private final SpreadsheetParser spreadsheetParser;
    private final AuditService auditService;

    public MenuService(MenuItemRepository repository, SpreadsheetParser spreadsheetParser, AuditService auditService) {
        this.repository = repository;
        this.spreadsheetParser = spreadsheetParser;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<MenuItemDto> listPublic(Cuisine cuisine, DietType diet, String q, Long branchId) {
        String needle = q == null ? null : q.trim().toLowerCase(Locale.ROOT);
        return repository.findByActiveTrueOrderBySortOrderAscNameAsc().stream()
                .filter(m -> cuisine == null || m.getCuisine() == cuisine)
                .filter(m -> diet == null || m.getDiet() == diet)
                .filter(m -> branchId == null || m.getBranchIds().isEmpty() || m.getBranchIds().contains(branchId))
                .filter(m -> needle == null || needle.isEmpty()
                        || m.getName().toLowerCase(Locale.ROOT).contains(needle)
                        || (m.getDescription() != null && m.getDescription().toLowerCase(Locale.ROOT).contains(needle)))
                .map(MenuService::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<MenuItemDto> adminList() {
        return repository.findAllByOrderBySortOrderAscNameAsc().stream().map(MenuService::toDto).toList();
    }

    @Transactional
    public MenuItemDto create(UpsertMenuItemRequest req) {
        validate(req);
        Instant now = Instant.now();
        MenuItem m = MenuItem.builder().slug(uniqueSlug(req.name(), null)).createdAt(now).build();
        apply(m, req);
        m.setUpdatedAt(now);
        MenuItem saved = repository.save(m);
        auditService.record("MENU_ITEM_CREATED", AuditActions.SUCCESS, "MENU_ITEM", String.valueOf(saved.getId()), "name=" + saved.getName());
        return toDto(saved);
    }

    @Transactional
    public MenuItemDto update(Long id, UpsertMenuItemRequest req) {
        validate(req);
        MenuItem m = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Dish not found: " + id));
        if (!m.getName().equalsIgnoreCase(req.name().trim())) {
            m.setSlug(uniqueSlug(req.name(), m.getId()));
        }
        apply(m, req);
        m.setUpdatedAt(Instant.now());
        MenuItem saved = repository.save(m);
        auditService.record("MENU_ITEM_UPDATED", AuditActions.SUCCESS, "MENU_ITEM", String.valueOf(id), "name=" + saved.getName());
        return toDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        MenuItem m = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Dish not found: " + id));
        repository.delete(m);
        auditService.record("MENU_ITEM_DELETED", AuditActions.SUCCESS, "MENU_ITEM", String.valueOf(id), "name=" + m.getName());
    }

    /** Columns: name,price,cuisine,course,diet,spicelevel,description,signature,passport,jainoption,imageurl,sortorder */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        List<Map<String, String>> rows = spreadsheetParser.parse(file);
        int rowNum = 1;
        for (Map<String, String> row : rows) {
            rowNum++;
            String name = row.getOrDefault("name", "").trim();
            if (name.isEmpty()) {
                result.addError(rowNum, "name is required");
                continue;
            }
            BigDecimal price = parseMoney(row.get("price"));
            Cuisine cuisine = parseEnum(Cuisine.class, row.get("cuisine"));
            Course course = parseEnum(Course.class, row.get("course"));
            DietType diet = parseEnum(DietType.class, row.get("diet"));
            if (price == null || price.signum() <= 0) { result.addError(rowNum, "price must be a positive number"); continue; }
            if (cuisine == null) { result.addError(rowNum, "cuisine must be one of " + List.of(Cuisine.values())); continue; }
            if (course == null) { result.addError(rowNum, "course must be one of " + List.of(Course.values())); continue; }
            if (diet == null) { result.addError(rowNum, "diet must be VEG, EGG or NON_VEG"); continue; }
            if (repository.existsBySlug(slugify(name))) {
                result.setSkipped(result.getSkipped() + 1);
                continue;
            }
            int spice = parseInt(row.get("spicelevel"), 0);
            if (spice < 0 || spice > 3) { result.addError(rowNum, "spiceLevel must be 0–3"); continue; }
            Instant now = Instant.now();
            repository.save(MenuItem.builder()
                    .name(name).slug(slugify(name)).price(price).cuisine(cuisine).course(course).diet(diet)
                    .spiceLevel(spice).description(blankToNull(row.get("description")))
                    .signature(parseBool(row.get("signature"), false)).passport(parseBool(row.get("passport"), false))
                    .jainOption(parseBool(row.get("jainoption"), false)).imageUrl(blankToNull(row.get("imageurl")))
                    .sortOrder(parseInt(row.get("sortorder"), 100)).active(true)
                    .workflowCode(RestaurantConstants.KITCHEN_WORKFLOW).createdAt(now).updatedAt(now).build());
            result.setCreated(result.getCreated() + 1);
        }
        auditService.record("MENU_BULK_IMPORT", AuditActions.SUCCESS, "MENU_ITEM", null,
                "created=" + result.getCreated() + " skipped=" + result.getSkipped() + " failed=" + result.getFailed());
        return result;
    }

    private void validate(UpsertMenuItemRequest req) {
        if (req == null || req.name() == null || req.name().isBlank()) throw bad("Dish name is required");
        if (req.price() == null || req.price().signum() <= 0) throw bad("Price must be more than ₹0");
        if (req.cuisine() == null || req.course() == null || req.diet() == null) throw bad("Cuisine, course and veg/non-veg are required");
        if (req.spiceLevel() != null && (req.spiceLevel() < 0 || req.spiceLevel() > 3)) throw bad("Spice level must be 0–3");
    }

    private void apply(MenuItem m, UpsertMenuItemRequest req) {
        m.setName(req.name().trim());
        m.setDescription(blankToNull(req.description()));
        m.setPrice(req.price());
        m.setCuisine(req.cuisine());
        m.setCourse(req.course());
        m.setDiet(req.diet());
        m.setSpiceLevel(req.spiceLevel() == null ? 0 : req.spiceLevel());
        m.setSignature(Boolean.TRUE.equals(req.signature()));
        m.setPassport(Boolean.TRUE.equals(req.passport()));
        m.setJainOption(Boolean.TRUE.equals(req.jainOption()));
        m.setImageUrl(blankToNull(req.imageUrl()));
        m.setActive(req.active() == null || req.active());
        m.setSortOrder(req.sortOrder() == null ? 100 : req.sortOrder());
        m.setWorkflowCode(RestaurantConstants.KITCHEN_WORKFLOW);
        m.setBranchIds(req.branchIds() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(req.branchIds()));
    }

    private String uniqueSlug(String name, Long selfId) {
        String base = slugify(name);
        String slug = base;
        int i = 2;
        while (true) {
            var existing = repository.findBySlug(slug);
            if (existing.isEmpty() || existing.get().getId().equals(selfId)) return slug;
            slug = base + "-" + i++;
        }
    }

    public static MenuItemDto toDto(MenuItem m) {
        return new MenuItemDto(m.getId(), m.getName(), m.getSlug(), m.getDescription(), m.getPrice(), m.getCuisine(),
                m.getCourse(), m.getDiet(), m.getSpiceLevel(), m.isSignature(), m.isPassport(), m.isJainOption(),
                m.getImageUrl(), m.isActive(), m.getSortOrder(), m.getWorkflowCode(),
                m.getBranchIds() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(m.getBranchIds()));
    }
}
