package com.webappfoundation.restaurant.service;

import com.webappfoundation.dto.BulkUploadResult;
import com.webappfoundation.exception.ResourceNotFoundException;
import com.webappfoundation.restaurant.dto.RestaurantDtos.*;
import com.webappfoundation.restaurant.model.DietType;
import com.webappfoundation.restaurant.model.WokCombo;
import com.webappfoundation.restaurant.model.WokGroup;
import com.webappfoundation.restaurant.model.WokOption;
import com.webappfoundation.restaurant.repository.WokComboRepository;
import com.webappfoundation.restaurant.repository.WokOptionRepository;
import com.webappfoundation.service.AuditActions;
import com.webappfoundation.service.AuditService;
import com.webappfoundation.service.SpreadsheetParser;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static com.webappfoundation.restaurant.RestaurantUtil.*;

/**
 * The Sauce Library wok bar: guests pick a base, a protein, one house sauce, up to four veg/finish add-ons and a
 * spice level. A build is saved once (de-duplicated by signature) and priced server-side on every read.
 */
@Service
public class WokService {

    public static final int MAX_ADDONS = 4;

    private final WokOptionRepository optionRepository;
    private final WokComboRepository comboRepository;
    private final WokPricing pricing;
    private final SpreadsheetParser spreadsheetParser;
    private final AuditService auditService;

    public WokService(WokOptionRepository optionRepository, WokComboRepository comboRepository, WokPricing pricing,
                      SpreadsheetParser spreadsheetParser, AuditService auditService) {
        this.optionRepository = optionRepository;
        this.comboRepository = comboRepository;
        this.pricing = pricing;
        this.spreadsheetParser = spreadsheetParser;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<WokOptionDto> activeOptions() {
        return optionRepository.findByActiveTrueOrderByGroupCodeAscSortOrderAsc().stream().map(WokService::toDto).toList();
    }

    @Transactional
    public WokComboDto build(WokBuildRequest req) {
        if (req == null) throw bad("Pick a base, a protein and a sauce");
        WokOption base = require(req.baseId(), WokGroup.BASE, "base");
        WokOption protein = require(req.proteinId(), WokGroup.PROTEIN, "protein");
        WokOption sauce = require(req.sauceId(), WokGroup.SAUCE, "sauce");
        List<Long> addOns = req.addOnIds() == null ? List.of() : req.addOnIds().stream().filter(Objects::nonNull).distinct().sorted().toList();
        if (addOns.size() > MAX_ADDONS) throw bad("Choose up to " + MAX_ADDONS + " add-ons");
        for (Long id : addOns) {
            WokOption o = optionRepository.findById(id).orElseThrow(() -> bad("Unknown add-on"));
            if (!o.isActive() || (o.getGroupCode() != WokGroup.VEGGIES && o.getGroupCode() != WokGroup.FINISH)) {
                throw bad(o.getName() + " can't be added here");
            }
        }
        int spice = req.spiceLevel() == null ? 1 : req.spiceLevel();
        if (spice < 0 || spice > 3) throw bad("Spice level must be 0–3");
        String signature = "b" + base.getId() + "|p" + protein.getId() + "|s" + sauce.getId() + "|a"
                + addOns.stream().map(String::valueOf).collect(Collectors.joining(",")) + "|h" + spice;
        WokCombo combo = comboRepository.findBySignature(signature).orElseGet(() -> {
            try {
                return comboRepository.saveAndFlush(WokCombo.builder().signature(signature).baseId(base.getId())
                        .proteinId(protein.getId()).sauceId(sauce.getId()).addOnIds(new ArrayList<>(addOns))
                        .spiceLevel(spice).createdAt(Instant.now()).build());
            } catch (DataIntegrityViolationException race) {
                return comboRepository.findBySignature(signature).orElseThrow(() -> race);
            }
        });
        WokComboDto dto = pricing.describe(combo);
        if (dto == null) throw bad("One of those choices just ran out — please pick again");
        return dto;
    }

    @Transactional(readOnly = true)
    public WokComboDto get(Long id) {
        WokCombo c = comboRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Wok not found"));
        WokComboDto dto = pricing.describe(c);
        if (dto == null) throw new ResourceNotFoundException("This wok is no longer available");
        return dto;
    }

    private WokOption require(Long id, WokGroup group, String label) {
        if (id == null) throw bad("Please choose a " + label);
        WokOption o = optionRepository.findById(id).orElseThrow(() -> bad("Unknown " + label));
        if (!o.isActive() || o.getGroupCode() != group) throw bad("That " + label + " isn't available");
        return o;
    }

    // ── Admin ──

    @Transactional(readOnly = true)
    public List<WokOptionDto> adminList() {
        return optionRepository.findAllByOrderByGroupCodeAscSortOrderAsc().stream().map(WokService::toDto).toList();
    }

    @Transactional
    public WokOptionDto create(UpsertWokOptionRequest req) {
        validate(req);
        WokOption o = new WokOption();
        apply(o, req);
        WokOption saved = optionRepository.save(o);
        auditService.record("WOK_OPTION_CREATED", AuditActions.SUCCESS, "WOK_OPTION", String.valueOf(saved.getId()), "name=" + saved.getName());
        return toDto(saved);
    }

    @Transactional
    public WokOptionDto update(Long id, UpsertWokOptionRequest req) {
        validate(req);
        WokOption o = optionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Option not found"));
        apply(o, req);
        WokOption saved = optionRepository.save(o);
        auditService.record("WOK_OPTION_UPDATED", AuditActions.SUCCESS, "WOK_OPTION", String.valueOf(id), "name=" + saved.getName());
        return toDto(saved);
    }

    /** Options are switched off rather than deleted, so saved woks and favourites keep resolving their history. */
    @Transactional
    public void deactivate(Long id) {
        WokOption o = optionRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Option not found"));
        o.setActive(false);
        optionRepository.save(o);
        auditService.record("WOK_OPTION_DEACTIVATED", AuditActions.SUCCESS, "WOK_OPTION", String.valueOf(id), "name=" + o.getName());
    }

    /** Columns: group,name,price,diet,description,sortorder */
    @Transactional
    public BulkUploadResult bulkImport(MultipartFile file) {
        BulkUploadResult result = BulkUploadResult.builder().build();
        int rowNum = 1;
        for (Map<String, String> row : spreadsheetParser.parse(file)) {
            rowNum++;
            WokGroup group = parseEnum(WokGroup.class, row.get("group"));
            String name = row.getOrDefault("name", "").trim();
            BigDecimal price = parseMoney(row.get("price"));
            DietType diet = parseEnum(DietType.class, row.getOrDefault("diet", "VEG"));
            if (group == null) { result.addError(rowNum, "group must be one of " + List.of(WokGroup.values())); continue; }
            if (name.isEmpty()) { result.addError(rowNum, "name is required"); continue; }
            if (price == null || price.signum() < 0) { result.addError(rowNum, "price must be 0 or more"); continue; }
            if (group == WokGroup.BASE && price.signum() == 0) { result.addError(rowNum, "a base needs a price"); continue; }
            if (optionRepository.existsByGroupCodeAndNameIgnoreCase(group, name)) { result.setSkipped(result.getSkipped() + 1); continue; }
            optionRepository.save(WokOption.builder().groupCode(group).name(name).price(price)
                    .diet(diet == null ? DietType.VEG : diet).description(blankToNull(row.get("description")))
                    .sortOrder(parseInt(row.get("sortorder"), 100)).active(true).build());
            result.setCreated(result.getCreated() + 1);
        }
        auditService.record("WOK_OPTION_BULK_IMPORT", AuditActions.SUCCESS, "WOK_OPTION", null,
                "created=" + result.getCreated() + " skipped=" + result.getSkipped() + " failed=" + result.getFailed());
        return result;
    }

    private void validate(UpsertWokOptionRequest req) {
        if (req == null || req.groupCode() == null) throw bad("Choose which step this option belongs to");
        if (req.name() == null || req.name().isBlank()) throw bad("Name is required");
        if (req.price() == null || req.price().signum() < 0) throw bad("Price must be ₹0 or more");
        if (req.groupCode() == WokGroup.BASE && req.price().signum() == 0) throw bad("A base needs a price");
    }

    private void apply(WokOption o, UpsertWokOptionRequest req) {
        o.setGroupCode(req.groupCode());
        o.setName(req.name().trim());
        o.setDescription(blankToNull(req.description()));
        o.setPrice(req.price());
        o.setDiet(req.diet() == null ? DietType.VEG : req.diet());
        o.setActive(req.active() == null || req.active());
        o.setSortOrder(req.sortOrder() == null ? 100 : req.sortOrder());
    }

    public static WokOptionDto toDto(WokOption o) {
        return new WokOptionDto(o.getId(), o.getGroupCode(), o.getName(), o.getDescription(), o.getPrice(), o.getDiet(),
                o.isActive(), o.getSortOrder());
    }
}
